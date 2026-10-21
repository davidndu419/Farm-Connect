create type public.account_status as enum ('active', 'frozen', 'suspended');
create type public.report_category as enum (
  'spam',
  'scam',
  'harassment',
  'prohibited_content',
  'impersonation',
  'other'
);
create type public.report_status as enum (
  'open',
  'reviewing',
  'resolved',
  'dismissed'
);
create type public.admin_action_type as enum (
  'promote_admin',
  'demote_admin',
  'freeze_account',
  'suspend_account',
  'restore_account',
  'hide_product',
  'restore_product',
  'review_report',
  'resolve_report',
  'dismiss_report'
);

alter table public.profiles
  add column account_status public.account_status not null default 'active',
  add column restriction_reason varchar(500),
  add column restricted_at timestamptz,
  add column restricted_by uuid references public.profiles (id) on delete set null,
  add constraint profiles_restriction_details_check check (
    (
      account_status = 'active'
      and restriction_reason is null
      and restricted_at is null
      and restricted_by is null
    )
    or (
      account_status in ('frozen', 'suspended')
      and restriction_reason is not null
      and char_length(btrim(restriction_reason)) between 5 and 500
      and restricted_at is not null
      and restricted_by is not null
    )
  );

alter table public.products
  add column admin_hidden_at timestamptz,
  add column admin_hidden_by uuid references public.profiles (id) on delete set null,
  add column admin_hidden_reason varchar(500),
  add constraint products_admin_hidden_details_check check (
    (
      admin_hidden_at is null
      and admin_hidden_by is null
      and admin_hidden_reason is null
    )
    or (
      admin_hidden_at is not null
      and admin_hidden_by is not null
      and admin_hidden_reason is not null
      and char_length(btrim(admin_hidden_reason)) between 5 and 500
    )
  );

create table public.admin_memberships (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  check (
    (revoked_at is null and revoked_by is null)
    or (revoked_at is not null and revoked_by is not null)
  )
);

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete restrict,
  reported_user_id uuid not null references public.profiles (id) on delete restrict,
  conversation_id uuid references public.conversations (id) on delete set null,
  message_id uuid references public.messages (id) on delete set null,
  category public.report_category not null,
  details varchar(1000) not null
    check (char_length(btrim(details)) between 10 and 1000),
  status public.report_status not null default 'open',
  assigned_admin_id uuid references public.profiles (id) on delete set null,
  resolution_notes varchar(1000),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id),
  check (
    resolution_notes is null
    or char_length(btrim(resolution_notes)) between 5 and 1000
  ),
  check (message_id is null or conversation_id is not null),
  check (
    (status in ('open', 'reviewing') and resolved_at is null)
    or (status in ('resolved', 'dismissed') and resolved_at is not null)
  )
);

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid not null references public.profiles (id) on delete restrict,
  action public.admin_action_type not null,
  target_user_id uuid references public.profiles (id) on delete set null,
  target_product_id uuid references public.products (id) on delete set null,
  target_report_id uuid references public.user_reports (id) on delete set null,
  reason varchar(1000) not null
    check (char_length(btrim(reason)) between 5 and 1000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_account_status_idx
  on public.profiles (account_status, created_at desc);
create index products_admin_hidden_idx
  on public.products (admin_hidden_at, created_at desc);
create index user_reports_queue_idx
  on public.user_reports (status, created_at desc);
create index user_reports_reported_user_idx
  on public.user_reports (reported_user_id, created_at desc);
create index admin_actions_recent_idx
  on public.admin_actions (created_at desc);

create trigger user_reports_set_updated_at
before update on public.user_reports
for each row execute function private.set_updated_at();

create function private.is_admin(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_memberships
    where user_id = target_user_id
      and revoked_at is null
  );
$$;

create function private.is_active_admin(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin(target_user_id)
    and exists (
      select 1
      from public.profiles
      where id = target_user_id
        and account_status = 'active'
    );
$$;

create function private.can_access_account(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and account_status in ('active', 'frozen')
  );
$$;

create function private.is_account_active(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and account_status = 'active'
  );
$$;

create function private.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not private.is_active_admin(current_user_id) then
    raise exception using errcode = '42501', message = 'Administrator access required';
  end if;
  return current_user_id;
end;
$$;

create function private.enforce_account_write_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is not null
    and not private.is_account_active(current_user_id)
  then
    raise exception using
      errcode = '42501',
      message = 'This account is restricted to read-only access';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_account_write
before update on public.profiles
for each row execute function private.enforce_account_write_access();
create trigger profile_private_enforce_account_write
before update on public.profile_private
for each row execute function private.enforce_account_write_access();
create trigger products_enforce_account_write
before insert or update or delete on public.products
for each row execute function private.enforce_account_write_access();
create trigger product_images_enforce_account_write
before insert or update or delete on public.product_images
for each row execute function private.enforce_account_write_access();
create trigger conversations_enforce_account_write
before insert or update or delete on public.conversations
for each row execute function private.enforce_account_write_access();
create trigger messages_enforce_account_write
before insert or update or delete on public.messages
for each row execute function private.enforce_account_write_access();
create trigger user_reports_enforce_account_write
before insert or update or delete on public.user_reports
for each row execute function private.enforce_account_write_access();

alter table public.admin_memberships enable row level security;
alter table public.user_reports enable row level security;
alter table public.admin_actions enable row level security;

revoke all on table public.admin_memberships from anon, authenticated;
revoke all on table public.user_reports from anon, authenticated;
revoke all on table public.admin_actions from anon, authenticated;

drop policy if exists "Public can read farmer profiles" on public.profiles;
create policy "Public can read active farmer profiles"
on public.profiles for select
to anon, authenticated
using (
  role = 'farmer'::public.user_role
  and account_status <> 'suspended'
);

drop policy if exists "Participants can read counterpart profiles"
on public.profiles;
create policy "Participants can read counterpart profiles"
on public.profiles for select
to authenticated
using (
  private.can_access_account((select auth.uid()))
  and private.users_share_conversation((select auth.uid()), id)
);

drop policy if exists "Public can read marketplace products" on public.products;
create policy "Public can read marketplace products"
on public.products for select
to anon, authenticated
using (
  status in ('active', 'sold_out')
  and admin_hidden_at is null
  and private.can_access_account(farmer_id)
);

drop policy if exists "Owners can read all their products" on public.products;
create policy "Owners can read all their products"
on public.products for select
to authenticated
using (
  farmer_id = (select auth.uid())
  and private.can_access_account((select auth.uid()))
);

drop policy if exists "Public can read images for marketplace products"
on public.product_images;
create policy "Public can read images for marketplace products"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.status in ('active', 'sold_out')
      and products.admin_hidden_at is null
      and private.can_access_account(products.farmer_id)
  )
);

drop policy if exists "Public can read profiles with marketplace products"
on public.profiles;
create policy "Public can read profiles with marketplace products"
on public.profiles for select
to anon, authenticated
using (
  account_status <> 'suspended'
  and exists (
    select 1
    from public.products
    where products.farmer_id = profiles.id
      and products.status in ('active', 'sold_out')
      and products.admin_hidden_at is null
  )
);

drop policy if exists "Participants can read conversations"
on public.conversations;
create policy "Participants can read conversations"
on public.conversations for select
to authenticated
using (
  private.can_access_account((select auth.uid()))
  and (select auth.uid()) in (buyer_id, farmer_id)
);

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
on public.messages for select
to authenticated
using (
  private.can_access_account((select auth.uid()))
  and private.is_conversation_participant(
    conversation_id,
    (select auth.uid())
  )
);

drop policy if exists "Users can upload their avatar" on storage.objects;
create policy "Users can upload their avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and private.is_account_active((select auth.uid()))
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can replace their avatar" on storage.objects;
create policy "Users can replace their avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and private.is_account_active((select auth.uid()))
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and private.is_account_active((select auth.uid()))
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can remove their avatar" on storage.objects;
create policy "Users can remove their avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and private.is_account_active((select auth.uid()))
  and owner_id = (select auth.uid())::text
);

drop policy if exists "Farmers can upload owned product images"
on storage.objects;
create policy "Farmers can upload owned product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and private.is_account_active((select auth.uid()))
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and private.owns_product(((storage.foldername(name))[2])::uuid)
  and private.is_current_farmer((select auth.uid()))
);

drop policy if exists "Farmers can replace owned product images"
on storage.objects;
create policy "Farmers can replace owned product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and private.is_account_active((select auth.uid()))
  and owner_id = (select auth.uid())::text
  and private.owns_product(((storage.foldername(name))[2])::uuid)
)
with check (
  bucket_id = 'product-images'
  and private.is_account_active((select auth.uid()))
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and private.owns_product(((storage.foldername(name))[2])::uuid)
  and private.is_current_farmer((select auth.uid()))
);

drop policy if exists "Farmers can remove owned product images"
on storage.objects;
create policy "Farmers can remove owned product images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and private.is_account_active((select auth.uid()))
  and owner_id = (select auth.uid())::text
  and private.owns_product(((storage.foldername(name))[2])::uuid)
  and private.is_current_farmer((select auth.uid()))
);

drop policy if exists "Participants can read chat media" on storage.objects;
create policy "Participants and admins can read chat media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'chat-media'
  and (
    private.is_active_admin((select auth.uid()))
    or (
      private.can_access_account((select auth.uid()))
      and private.is_conversation_participant(
        ((storage.foldername(name))[2])::uuid,
        (select auth.uid())
      )
    )
  )
);

drop policy if exists "Participants can upload chat media" on storage.objects;
create policy "Participants can upload chat media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and private.is_account_active((select auth.uid()))
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and private.is_conversation_participant(
    ((storage.foldername(name))[2])::uuid,
    (select auth.uid())
  )
);

drop policy if exists "Senders can remove chat media" on storage.objects;
create policy "Senders can remove chat media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'chat-media'
  and private.is_account_active((select auth.uid()))
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.get_public_farmer_profile(target_profile_id uuid)
returns table (
  id uuid,
  full_name text,
  role public.user_role,
  phone text,
  address text,
  city text,
  state public.nigerian_state,
  avatar_path text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profiles.id,
    profiles.full_name::text,
    profiles.role,
    profile_private.phone::text,
    profiles.address::text,
    profiles.city::text,
    profiles.state,
    profiles.avatar_path,
    profiles.created_at
  from public.profiles
  join public.profile_private
    on profile_private.user_id = profiles.id
  where profiles.id = target_profile_id
    and profiles.account_status <> 'suspended'
    and (
      profiles.role = 'farmer'
      or exists (
        select 1
        from public.products
        where products.farmer_id = profiles.id
          and products.status in ('active', 'sold_out')
          and products.admin_hidden_at is null
      )
    );
$$;

create or replace function public.start_conversation(target_product_id uuid)
returns table (conversation_id uuid, created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_product public.products%rowtype;
  inserted_id uuid;
begin
  if current_user_id is null or not private.is_account_active(current_user_id) then
    raise exception using errcode = '42501', message = 'An active account is required';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = current_user_id and role = 'buyer'::public.user_role
  ) then
    raise exception using errcode = '42501', message = 'Only buyers can start conversations';
  end if;

  select products.* into target_product
  from public.products
  where products.id = target_product_id
    and products.status in ('active', 'sold_out')
    and products.admin_hidden_at is null
    and private.can_access_account(products.farmer_id)
  for share;

  if not found then
    raise exception using errcode = 'P0002', message = 'Marketplace product not found';
  end if;
  if target_product.farmer_id = current_user_id then
    raise exception using errcode = '23514', message = 'You cannot contact yourself';
  end if;

  insert into public.conversations (
    product_id,
    buyer_id,
    farmer_id,
    product_title_snapshot,
    product_price_snapshot,
    product_unit_snapshot,
    product_image_snapshot,
    buyer_last_read_at
  )
  values (
    target_product.id,
    current_user_id,
    target_product.farmer_id,
    target_product.title,
    target_product.price,
    target_product.unit,
    (
      select storage_path
      from public.product_images
      where product_id = target_product.id
      order by display_order
      limit 1
    ),
    now()
  )
  on conflict (product_id, buyer_id, farmer_id) do nothing
  returning id into inserted_id;

  if inserted_id is not null then
    return query select inserted_id, true;
  else
    return query
      select c.id, false
      from public.conversations c
      where c.product_id = target_product.id
        and c.buyer_id = current_user_id
        and c.farmer_id = target_product.farmer_id;
  end if;
end;
$$;

create function public.get_my_account_access()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'accountStatus', p.account_status,
    'restrictionReason', p.restriction_reason,
    'restrictedAt', p.restricted_at,
    'isAdmin', private.is_admin(p.id)
  )
  from public.profiles p
  where p.id = auth.uid();
$$;

create function public.submit_user_report(
  target_user_id uuid,
  report_category public.report_category,
  report_details text,
  target_conversation_id uuid default null,
  target_message_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_report public.user_reports;
begin
  if current_user_id is null or not private.is_account_active(current_user_id) then
    raise exception using errcode = '42501', message = 'An active account is required';
  end if;
  if current_user_id = target_user_id then
    raise exception using errcode = '23514', message = 'You cannot report yourself';
  end if;
  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception using errcode = 'P0002', message = 'Reported user not found';
  end if;
  if char_length(btrim(report_details)) not between 10 and 1000 then
    raise exception using errcode = '22023', message = 'Report details must be between 10 and 1000 characters';
  end if;

  if target_conversation_id is not null and not exists (
    select 1
    from public.conversations
    where id = target_conversation_id
      and current_user_id in (buyer_id, farmer_id)
      and target_user_id in (buyer_id, farmer_id)
  ) then
    raise exception using errcode = '42501', message = 'Conversation evidence is not accessible';
  end if;

  if target_message_id is not null and not exists (
    select 1
    from public.messages
    where id = target_message_id
      and conversation_id = target_conversation_id
      and sender_id = target_user_id
  ) then
    raise exception using errcode = '42501', message = 'Message evidence is not accessible';
  end if;

  if exists (
    select 1
    from public.user_reports
    where reporter_id = current_user_id
      and reported_user_id = target_user_id
      and conversation_id is not distinct from target_conversation_id
      and status in ('open', 'reviewing')
  ) then
    raise exception using errcode = '23505', message = 'You already have an active report for this user';
  end if;

  insert into public.user_reports (
    reporter_id,
    reported_user_id,
    conversation_id,
    message_id,
    category,
    details
  )
  values (
    current_user_id,
    target_user_id,
    target_conversation_id,
    target_message_id,
    report_category,
    btrim(report_details)
  )
  returning * into created_report;

  return jsonb_build_object(
    'id', created_report.id,
    'status', created_report.status,
    'createdAt', created_report.created_at
  );
end;
$$;

create function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
  result jsonb;
begin
  select jsonb_build_object(
    'metrics', jsonb_build_object(
      'totalUsers', (select count(*) from public.profiles),
      'newUsers7d', (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
      'activeUsers', (select count(*) from public.profiles where account_status = 'active'),
      'restrictedUsers', (select count(*) from public.profiles where account_status <> 'active'),
      'admins', (select count(*) from public.admin_memberships where revoked_at is null),
      'totalProducts', (select count(*) from public.products where status <> 'deleted'),
      'activeProducts', (select count(*) from public.products where status in ('active', 'sold_out') and admin_hidden_at is null),
      'hiddenProducts', (select count(*) from public.products where admin_hidden_at is not null),
      'conversations', (select count(*) from public.conversations),
      'newConversations7d', (select count(*) from public.conversations where created_at >= now() - interval '7 days'),
      'messages', (select count(*) from public.messages),
      'newMessages7d', (select count(*) from public.messages where created_at >= now() - interval '7 days'),
      'openReports', (select count(*) from public.user_reports where status in ('open', 'reviewing'))
    ),
    'reportsByCategory', coalesce((
      select jsonb_agg(jsonb_build_object('category', category, 'count', report_count) order by report_count desc)
      from (
        select category, count(*) as report_count
        from public.user_reports
        where status in ('open', 'reviewing')
        group by category
      ) grouped_reports
    ), '[]'::jsonb),
    'recentReports', coalesce((
      select jsonb_agg(item order by item_created_at desc)
      from (
        select
          r.created_at as item_created_at,
          jsonb_build_object(
            'id', r.id,
            'category', r.category,
            'status', r.status,
            'details', r.details,
            'createdAt', r.created_at,
            'reportedUser', jsonb_build_object('id', reported.id, 'name', reported.full_name),
            'reporter', jsonb_build_object('id', reporter.id, 'name', reporter.full_name)
          ) as item
        from public.user_reports r
        join public.profiles reported on reported.id = r.reported_user_id
        join public.profiles reporter on reporter.id = r.reporter_id
        where r.status in ('open', 'reviewing')
        order by r.created_at desc
        limit 5
      ) recent
    ), '[]'::jsonb),
    'recentActions', coalesce((
      select jsonb_agg(item order by item_created_at desc)
      from (
        select
          a.created_at as item_created_at,
          jsonb_build_object(
            'id', a.id,
            'action', a.action,
            'reason', a.reason,
            'createdAt', a.created_at,
            'actorName', actor.full_name,
            'targetName', target.full_name
          ) as item
        from public.admin_actions a
        join public.profiles actor on actor.id = a.actor_admin_id
        left join public.profiles target on target.id = a.target_user_id
        order by a.created_at desc
        limit 6
      ) recent
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create function public.admin_search_users(
  search_text text default null,
  status_filter text default null,
  role_filter text default null,
  admin_filter text default null,
  page_limit integer default 25,
  page_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
  normalized_search text := nullif(btrim(coalesce(search_text, '')), '');
  safe_limit integer := least(greatest(page_limit, 1), 100);
  safe_offset integer := greatest(page_offset, 0);
  result jsonb;
begin
  with filtered as (
    select
      p.*,
      u.email,
      pp.phone,
      (am.user_id is not null and am.revoked_at is null) as is_admin
    from public.profiles p
    join auth.users u on u.id = p.id
    join public.profile_private pp on pp.user_id = p.id
    left join public.admin_memberships am on am.user_id = p.id
    where (
      normalized_search is null
      or p.full_name ilike '%' || normalized_search || '%'
      or coalesce(u.email, '') ilike '%' || normalized_search || '%'
      or pp.phone ilike '%' || normalized_search || '%'
    )
      and (status_filter is null or status_filter = 'all' or p.account_status::text = status_filter)
      and (role_filter is null or role_filter = 'all' or p.role::text = role_filter)
      and (
        admin_filter is null
        or admin_filter = 'all'
        or (admin_filter = 'admin' and am.user_id is not null and am.revoked_at is null)
        or (admin_filter = 'user' and (am.user_id is null or am.revoked_at is not null))
      )
  ), page as (
    select * from filtered
    order by created_at desc
    limit safe_limit offset safe_offset
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', page.id,
        'fullName', page.full_name,
        'email', page.email,
        'phone', page.phone,
        'role', page.role,
        'state', page.state,
        'city', page.city,
        'avatarPath', page.avatar_path,
        'accountStatus', page.account_status,
        'restrictionReason', page.restriction_reason,
        'restrictedAt', page.restricted_at,
        'isAdmin', page.is_admin,
        'createdAt', page.created_at,
        'productCount', (select count(*) from public.products where farmer_id = page.id and status <> 'deleted'),
        'conversationCount', (select count(*) from public.conversations where page.id in (buyer_id, farmer_id)),
        'reportCount', (select count(*) from public.user_reports where reported_user_id = page.id)
      ) order by page.created_at desc)
      from page
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create function public.admin_search_products(
  search_text text default null,
  status_filter text default null,
  moderation_filter text default null,
  page_limit integer default 25,
  page_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
  normalized_search text := nullif(btrim(coalesce(search_text, '')), '');
  safe_limit integer := least(greatest(page_limit, 1), 100);
  safe_offset integer := greatest(page_offset, 0);
  result jsonb;
begin
  with filtered as (
    select p.*, owner.full_name as owner_name
    from public.products p
    join public.profiles owner on owner.id = p.farmer_id
    where (
      normalized_search is null
      or p.title ilike '%' || normalized_search || '%'
      or p.description ilike '%' || normalized_search || '%'
      or owner.full_name ilike '%' || normalized_search || '%'
    )
      and (status_filter is null or status_filter = 'all' or p.status::text = status_filter)
      and (
        moderation_filter is null
        or moderation_filter = 'all'
        or (moderation_filter = 'hidden' and p.admin_hidden_at is not null)
        or (moderation_filter = 'visible' and p.admin_hidden_at is null)
      )
  ), page as (
    select * from filtered
    order by created_at desc
    limit safe_limit offset safe_offset
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', page.id,
        'title', page.title,
        'description', page.description,
        'category', page.category,
        'price', page.price,
        'currency', page.currency,
        'unit', page.unit,
        'availableQuantity', page.available_quantity,
        'status', page.status,
        'state', page.state,
        'city', page.city,
        'owner', jsonb_build_object('id', page.farmer_id, 'name', page.owner_name),
        'isHidden', page.admin_hidden_at is not null,
        'hiddenReason', page.admin_hidden_reason,
        'hiddenAt', page.admin_hidden_at,
        'createdAt', page.created_at,
        'images', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', pi.id,
            'storagePath', pi.storage_path,
            'altText', pi.alt_text
          ) order by pi.display_order)
          from public.product_images pi
          where pi.product_id = page.id
        ), '[]'::jsonb),
        'conversationCount', (select count(*) from public.conversations where product_id = page.id)
      ) order by page.created_at desc)
      from page
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create function public.admin_search_conversations(
  search_text text default null,
  page_limit integer default 25,
  page_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
  normalized_search text := nullif(btrim(coalesce(search_text, '')), '');
  safe_limit integer := least(greatest(page_limit, 1), 100);
  safe_offset integer := greatest(page_offset, 0);
  result jsonb;
begin
  with filtered as (
    select
      c.*,
      buyer.full_name as buyer_name,
      buyer.avatar_path as buyer_avatar_path,
      farmer.full_name as farmer_name,
      farmer.avatar_path as farmer_avatar_path,
      latest.body as latest_body,
      latest.message_type as latest_message_type,
      latest.sender_id as latest_sender_id
    from public.conversations c
    join public.profiles buyer on buyer.id = c.buyer_id
    join public.profiles farmer on farmer.id = c.farmer_id
    left join public.messages latest on latest.id = c.last_message_id
    where normalized_search is null
      or c.product_title_snapshot ilike '%' || normalized_search || '%'
      or buyer.full_name ilike '%' || normalized_search || '%'
      or farmer.full_name ilike '%' || normalized_search || '%'
  ), page as (
    select * from filtered
    order by coalesce(last_message_at, created_at) desc
    limit safe_limit offset safe_offset
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', page.id,
        'productId', page.product_id,
        'productTitle', page.product_title_snapshot,
        'productPrice', page.product_price_snapshot,
        'productUnit', page.product_unit_snapshot,
        'buyer', jsonb_build_object('id', page.buyer_id, 'name', page.buyer_name, 'avatarPath', page.buyer_avatar_path),
        'farmer', jsonb_build_object('id', page.farmer_id, 'name', page.farmer_name, 'avatarPath', page.farmer_avatar_path),
        'lastMessageAt', page.last_message_at,
        'createdAt', page.created_at,
        'messageCount', (select count(*) from public.messages where conversation_id = page.id),
        'latestMessage', case when page.last_message_id is null then null else jsonb_build_object(
          'body', page.latest_body,
          'type', page.latest_message_type,
          'senderId', page.latest_sender_id
        ) end
      ) order by coalesce(page.last_message_at, page.created_at) desc)
      from page
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create function public.admin_conversation_messages(
  target_conversation_id uuid,
  page_limit integer default 100,
  page_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
  safe_limit integer := least(greatest(page_limit, 1), 200);
  safe_offset integer := greatest(page_offset, 0);
  result jsonb;
begin
  if not exists (select 1 from public.conversations where id = target_conversation_id) then
    raise exception using errcode = 'P0002', message = 'Conversation not found';
  end if;

  select jsonb_build_object(
    'conversation', (
      select jsonb_build_object(
        'id', c.id,
        'productTitle', c.product_title_snapshot,
        'buyer', jsonb_build_object('id', buyer.id, 'name', buyer.full_name),
        'farmer', jsonb_build_object('id', farmer.id, 'name', farmer.full_name),
        'createdAt', c.created_at
      )
      from public.conversations c
      join public.profiles buyer on buyer.id = c.buyer_id
      join public.profiles farmer on farmer.id = c.farmer_id
      where c.id = target_conversation_id
    ),
    'total', (select count(*) from public.messages where conversation_id = target_conversation_id),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'senderId', m.sender_id,
        'senderName', sender.full_name,
        'body', m.body,
        'messageType', m.message_type,
        'mediaPath', m.media_path,
        'mediaOriginalName', m.media_original_name,
        'createdAt', m.created_at
      ) order by m.created_at, m.id)
      from (
        select *
        from public.messages
        where conversation_id = target_conversation_id
        order by created_at desc, id desc
        limit safe_limit offset safe_offset
      ) m
      join public.profiles sender on sender.id = m.sender_id
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create function public.admin_search_reports(
  status_filter text default null,
  page_limit integer default 25,
  page_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
  safe_limit integer := least(greatest(page_limit, 1), 100);
  safe_offset integer := greatest(page_offset, 0);
  result jsonb;
begin
  with filtered as (
    select
      r.*,
      reporter.full_name as reporter_name,
      reported.full_name as reported_name,
      assigned.full_name as assigned_name,
      evidence.body as evidence_body,
      evidence.message_type as evidence_type,
      evidence.media_path as evidence_media_path,
      c.product_title_snapshot
    from public.user_reports r
    join public.profiles reporter on reporter.id = r.reporter_id
    join public.profiles reported on reported.id = r.reported_user_id
    left join public.profiles assigned on assigned.id = r.assigned_admin_id
    left join public.messages evidence on evidence.id = r.message_id
    left join public.conversations c on c.id = r.conversation_id
    where status_filter is null
      or status_filter = 'all'
      or r.status::text = status_filter
  ), page as (
    select * from filtered
    order by created_at desc
    limit safe_limit offset safe_offset
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', page.id,
        'category', page.category,
        'details', page.details,
        'status', page.status,
        'reporter', jsonb_build_object('id', page.reporter_id, 'name', page.reporter_name),
        'reportedUser', jsonb_build_object('id', page.reported_user_id, 'name', page.reported_name),
        'conversationId', page.conversation_id,
        'productTitle', page.product_title_snapshot,
        'messageId', page.message_id,
        'evidence', case when page.message_id is null then null else jsonb_build_object(
          'body', page.evidence_body,
          'type', page.evidence_type,
          'mediaPath', page.evidence_media_path
        ) end,
        'assignedAdmin', case when page.assigned_admin_id is null then null else jsonb_build_object(
          'id', page.assigned_admin_id,
          'name', page.assigned_name
        ) end,
        'resolutionNotes', page.resolution_notes,
        'resolvedAt', page.resolved_at,
        'createdAt', page.created_at,
        'updatedAt', page.updated_at
      ) order by page.created_at desc)
      from page
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create function public.admin_audit_log(
  page_limit integer default 50,
  page_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
  safe_limit integer := least(greatest(page_limit, 1), 100);
  safe_offset integer := greatest(page_offset, 0);
  result jsonb;
begin
  select jsonb_build_object(
    'total', (select count(*) from public.admin_actions),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'action', a.action,
        'reason', a.reason,
        'metadata', a.metadata,
        'createdAt', a.created_at,
        'actor', jsonb_build_object('id', actor.id, 'name', actor.full_name),
        'targetUser', case when target.id is null then null else jsonb_build_object('id', target.id, 'name', target.full_name) end,
        'targetProductId', a.target_product_id,
        'targetReportId', a.target_report_id
      ) order by a.created_at desc)
      from (
        select * from public.admin_actions
        order by created_at desc
        limit safe_limit offset safe_offset
      ) a
      join public.profiles actor on actor.id = a.actor_admin_id
      left join public.profiles target on target.id = a.target_user_id
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create function public.admin_set_account_status(
  target_user_id uuid,
  target_status public.account_status,
  action_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
  updated_profile public.profiles;
  action_name public.admin_action_type;
begin
  if char_length(btrim(action_reason)) not between 5 and 500 then
    raise exception using errcode = '22023', message = 'A reason between 5 and 500 characters is required';
  end if;
  if actor_id = target_user_id and target_status <> 'active' then
    raise exception using errcode = '23514', message = 'Administrators cannot restrict their own account';
  end if;

  update public.profiles
  set
    account_status = target_status,
    restriction_reason = case when target_status = 'active' then null else btrim(action_reason) end,
    restricted_at = case when target_status = 'active' then null else now() end,
    restricted_by = case when target_status = 'active' then null else actor_id end
  where id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception using errcode = 'P0002', message = 'User not found';
  end if;

  action_name := case target_status
    when 'frozen' then 'freeze_account'::public.admin_action_type
    when 'suspended' then 'suspend_account'::public.admin_action_type
    else 'restore_account'::public.admin_action_type
  end;

  insert into public.admin_actions (
    actor_admin_id,
    action,
    target_user_id,
    reason,
    metadata
  ) values (
    actor_id,
    action_name,
    target_user_id,
    btrim(action_reason),
    jsonb_build_object('status', target_status)
  );

  return jsonb_build_object(
    'id', updated_profile.id,
    'accountStatus', updated_profile.account_status,
    'restrictionReason', updated_profile.restriction_reason,
    'restrictedAt', updated_profile.restricted_at
  );
end;
$$;

create function public.admin_set_membership(
  target_user_id uuid,
  make_admin boolean,
  action_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
begin
  if char_length(btrim(action_reason)) not between 5 and 500 then
    raise exception using errcode = '22023', message = 'A reason between 5 and 500 characters is required';
  end if;
  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception using errcode = 'P0002', message = 'User not found';
  end if;
  if not make_admin and actor_id = target_user_id then
    raise exception using errcode = '23514', message = 'Administrators cannot remove their own access';
  end if;

  if make_admin then
    insert into public.admin_memberships (
      user_id,
      granted_by,
      granted_at,
      revoked_by,
      revoked_at
    ) values (
      target_user_id,
      actor_id,
      now(),
      null,
      null
    )
    on conflict (user_id) do update set
      granted_by = excluded.granted_by,
      granted_at = excluded.granted_at,
      revoked_by = null,
      revoked_at = null;
  else
    update public.admin_memberships
    set revoked_by = actor_id, revoked_at = now()
    where user_id = target_user_id and revoked_at is null;

    if not found then
      raise exception using errcode = 'P0002', message = 'Active administrator membership not found';
    end if;
  end if;

  insert into public.admin_actions (
    actor_admin_id,
    action,
    target_user_id,
    reason
  ) values (
    actor_id,
    case
      when make_admin then 'promote_admin'::public.admin_action_type
      else 'demote_admin'::public.admin_action_type
    end,
    target_user_id,
    btrim(action_reason)
  );

  return jsonb_build_object('id', target_user_id, 'isAdmin', make_admin);
end;
$$;

create function public.admin_moderate_product(
  target_product_id uuid,
  hide_product boolean,
  action_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
  updated_product public.products;
begin
  if char_length(btrim(action_reason)) not between 5 and 500 then
    raise exception using errcode = '22023', message = 'A reason between 5 and 500 characters is required';
  end if;

  update public.products
  set
    admin_hidden_at = case when hide_product then now() else null end,
    admin_hidden_by = case when hide_product then actor_id else null end,
    admin_hidden_reason = case when hide_product then btrim(action_reason) else null end
  where id = target_product_id
  returning * into updated_product;

  if updated_product.id is null then
    raise exception using errcode = 'P0002', message = 'Product not found';
  end if;

  insert into public.admin_actions (
    actor_admin_id,
    action,
    target_user_id,
    target_product_id,
    reason,
    metadata
  ) values (
    actor_id,
    case
      when hide_product then 'hide_product'::public.admin_action_type
      else 'restore_product'::public.admin_action_type
    end,
    updated_product.farmer_id,
    target_product_id,
    btrim(action_reason),
    jsonb_build_object('title', updated_product.title)
  );

  return jsonb_build_object(
    'id', updated_product.id,
    'isHidden', updated_product.admin_hidden_at is not null,
    'hiddenReason', updated_product.admin_hidden_reason,
    'hiddenAt', updated_product.admin_hidden_at
  );
end;
$$;

create function public.admin_update_report(
  target_report_id uuid,
  target_status public.report_status,
  target_resolution_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := private.require_admin();
  updated_report public.user_reports;
  normalized_notes text := nullif(btrim(coalesce(target_resolution_notes, '')), '');
  action_name public.admin_action_type;
begin
  if target_status = 'open' then
    raise exception using errcode = '22023', message = 'An administrator cannot return a report to open';
  end if;
  if target_status in ('resolved', 'dismissed')
    and (normalized_notes is null or char_length(normalized_notes) not between 5 and 1000)
  then
    raise exception using errcode = '22023', message = 'Resolution notes between 5 and 1000 characters are required';
  end if;

  update public.user_reports
  set
    status = target_status,
    assigned_admin_id = actor_id,
    resolution_notes = normalized_notes,
    resolved_at = case when target_status in ('resolved', 'dismissed') then now() else null end
  where id = target_report_id
  returning * into updated_report;

  if updated_report.id is null then
    raise exception using errcode = 'P0002', message = 'Report not found';
  end if;

  action_name := case target_status
    when 'reviewing' then 'review_report'::public.admin_action_type
    when 'resolved' then 'resolve_report'::public.admin_action_type
    else 'dismiss_report'::public.admin_action_type
  end;

  insert into public.admin_actions (
    actor_admin_id,
    action,
    target_user_id,
    target_report_id,
    reason
  ) values (
    actor_id,
    action_name,
    updated_report.reported_user_id,
    target_report_id,
    coalesce(normalized_notes, 'Report moved to review')
  );

  return jsonb_build_object(
    'id', updated_report.id,
    'status', updated_report.status,
    'resolutionNotes', updated_report.resolution_notes,
    'resolvedAt', updated_report.resolved_at
  );
end;
$$;

revoke all on function public.get_my_account_access() from public;
revoke all on function public.submit_user_report(uuid, public.report_category, text, uuid, uuid) from public;
revoke all on function public.admin_dashboard() from public;
revoke all on function public.admin_search_users(text, text, text, text, integer, integer) from public;
revoke all on function public.admin_search_products(text, text, text, integer, integer) from public;
revoke all on function public.admin_search_conversations(text, integer, integer) from public;
revoke all on function public.admin_conversation_messages(uuid, integer, integer) from public;
revoke all on function public.admin_search_reports(text, integer, integer) from public;
revoke all on function public.admin_audit_log(integer, integer) from public;
revoke all on function public.admin_set_account_status(uuid, public.account_status, text) from public;
revoke all on function public.admin_set_membership(uuid, boolean, text) from public;
revoke all on function public.admin_moderate_product(uuid, boolean, text) from public;
revoke all on function public.admin_update_report(uuid, public.report_status, text) from public;

grant execute on function public.get_my_account_access() to authenticated;
grant execute on function public.submit_user_report(uuid, public.report_category, text, uuid, uuid) to authenticated;
grant execute on function public.admin_dashboard() to authenticated;
grant execute on function public.admin_search_users(text, text, text, text, integer, integer) to authenticated;
grant execute on function public.admin_search_products(text, text, text, integer, integer) to authenticated;
grant execute on function public.admin_search_conversations(text, integer, integer) to authenticated;
grant execute on function public.admin_conversation_messages(uuid, integer, integer) to authenticated;
grant execute on function public.admin_search_reports(text, integer, integer) to authenticated;
grant execute on function public.admin_audit_log(integer, integer) to authenticated;
grant execute on function public.admin_set_account_status(uuid, public.account_status, text) to authenticated;
grant execute on function public.admin_set_membership(uuid, boolean, text) to authenticated;
grant execute on function public.admin_moderate_product(uuid, boolean, text) to authenticated;
grant execute on function public.admin_update_report(uuid, public.report_status, text) to authenticated;

grant usage on type public.account_status to authenticated;
grant usage on type public.report_category to authenticated;
grant usage on type public.report_status to authenticated;

-- Bootstrap the first administrator from the Supabase SQL editor after this
-- migration is applied. Replace the email and run this once:
-- insert into public.admin_memberships (user_id)
-- select id from auth.users where lower(email) = lower('owner@example.com')
-- on conflict (user_id) do update set revoked_at = null, revoked_by = null;
