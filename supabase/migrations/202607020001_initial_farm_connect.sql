create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

create type public.user_role as enum ('farmer', 'buyer');
create type public.product_status as enum (
  'draft',
  'active',
  'sold_out',
  'archived',
  'deleted'
);
create type public.product_category as enum (
  'grains',
  'legumes',
  'tubers',
  'vegetables',
  'fruits',
  'livestock',
  'poultry',
  'fish_seafood',
  'dairy',
  'spices',
  'other'
);
create type public.product_unit as enum (
  'kg',
  'tonne',
  'bag',
  'basket',
  'crate',
  'bunch',
  'piece',
  'litre',
  'dozen'
);
create type public.nigerian_state as enum (
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name varchar(100) not null
    check (char_length(btrim(full_name)) between 2 and 100),
  role public.user_role not null,
  state public.nigerian_state not null,
  city varchar(100) not null
    check (char_length(btrim(city)) between 2 and 100),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone varchar(16) not null
    check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles (id) on delete restrict,
  title varchar(120) not null
    check (char_length(btrim(title)) between 3 and 120),
  description text not null
    check (char_length(btrim(description)) between 20 and 5000),
  category public.product_category not null,
  price numeric(12, 2) not null check (price > 0),
  currency char(3) not null default 'NGN' check (currency = 'NGN'),
  unit public.product_unit not null,
  available_quantity numeric(12, 2) not null
    check (available_quantity >= 0),
  state public.nigerian_state not null,
  city varchar(100) not null
    check (char_length(btrim(city)) between 2 and 100),
  status public.product_status not null default 'draft',
  search_document tsvector not null default ''::tsvector,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique,
  display_order smallint not null check (display_order between 0 and 4),
  alt_text varchar(160)
    check (alt_text is null or char_length(btrim(alt_text)) between 1 and 160),
  created_at timestamptz not null default now(),
  constraint product_images_product_order_key
    unique (product_id, display_order) deferrable initially immediate
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  buyer_id uuid not null references public.profiles (id) on delete restrict,
  farmer_id uuid not null references public.profiles (id) on delete restrict,
  product_title_snapshot varchar(120) not null,
  product_price_snapshot numeric(12, 2) not null,
  product_unit_snapshot public.product_unit not null,
  product_image_snapshot text,
  last_message_id uuid,
  last_message_at timestamptz,
  buyer_last_read_at timestamptz,
  farmer_last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> farmer_id),
  unique (product_id, buyer_id, farmer_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete restrict,
  body text not null
    check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.conversations
  add constraint conversations_last_message_id_fkey
  foreign key (last_message_id) references public.messages (id) on delete set null;

create index profiles_role_location_idx
  on public.profiles (role, state, city);
create index profiles_created_at_idx
  on public.profiles (created_at desc);
create index products_farmer_status_created_idx
  on public.products (farmer_id, status, created_at desc);
create index products_public_created_idx
  on public.products (status, created_at desc)
  where status <> 'deleted';
create index products_filter_idx
  on public.products (status, category, state, city);
create index products_price_idx
  on public.products (status, price);
create index products_search_idx
  on public.products using gin (search_document);
create index product_images_product_order_idx
  on public.product_images (product_id, display_order);
create index conversations_buyer_recent_idx
  on public.conversations (buyer_id, last_message_at desc nulls last);
create index conversations_farmer_recent_idx
  on public.conversations (farmer_id, last_message_at desc nulls last);
create index messages_conversation_recent_idx
  on public.messages (conversation_id, created_at desc, id desc);
create index messages_sender_recent_idx
  on public.messages (sender_id, created_at desc);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger profile_private_set_updated_at
before update on public.profile_private
for each row execute function private.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function private.set_updated_at();

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.user_role;
  requested_state public.nigerian_state;
  requested_name text;
  requested_city text;
  requested_phone text;
begin
  requested_name := btrim(new.raw_user_meta_data ->> 'full_name');
  requested_city := btrim(new.raw_user_meta_data ->> 'city');
  requested_phone := btrim(new.raw_user_meta_data ->> 'phone');
  requested_role := (new.raw_user_meta_data ->> 'role')::public.user_role;
  requested_state := (new.raw_user_meta_data ->> 'state')::public.nigerian_state;

  if char_length(requested_name) not between 2 and 100
    or char_length(requested_city) not between 2 and 100
    or requested_phone !~ '^\+[1-9][0-9]{7,14}$'
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid profile metadata supplied during registration';
  end if;

  insert into public.profiles (id, full_name, role, state, city)
  values (new.id, requested_name, requested_role, requested_state, requested_city);

  insert into public.profile_private (user_id, phone)
  values (new.id, requested_phone);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create function private.is_current_farmer(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.role = 'farmer'::public.user_role
  );
$$;

create function private.owns_product(target_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products
    where id = target_product_id
      and farmer_id = (select auth.uid())
  );
$$;

create function private.is_conversation_participant(
  target_conversation_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations
    where id = target_conversation_id
      and target_user_id in (buyer_id, farmer_id)
  );
$$;

create function private.users_share_conversation(
  first_user_id uuid,
  second_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations
    where first_user_id in (buyer_id, farmer_id)
      and second_user_id in (buyer_id, farmer_id)
  );
$$;

create function private.prepare_product()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  image_count integer;
begin
  new.title := btrim(new.title);
  new.description := btrim(new.description);
  new.city := btrim(new.city);
  new.search_document := to_tsvector(
    'english',
    concat_ws(
      ' ',
      new.title,
      new.description,
      replace(new.category::text, '_', ' ')
    )
  );

  if tg_op = 'UPDATE' and old.status = 'deleted' then
    raise exception using
      errcode = '23514',
      message = 'Deleted products cannot be changed';
  end if;

  if tg_op = 'UPDATE' and old.status = 'archived'
    and new.status not in ('archived', 'draft', 'deleted')
  then
    raise exception using
      errcode = '23514',
      message = 'An archived product must return to draft before publication';
  end if;

  if new.status = 'active' and new.available_quantity = 0 then
    new.status := 'sold_out';
  end if;

  if new.status = 'active' then
    select count(*) into image_count
    from public.product_images
    where product_id = new.id;

    if image_count < 1 then
      raise exception using
        errcode = '23514',
        message = 'An active product requires at least one image';
    end if;

    if new.published_at is null then
      new.published_at := now();
    end if;
  end if;

  if new.status = 'deleted' then
    new.deleted_at := coalesce(new.deleted_at, now());
  elsif new.deleted_at is not null then
    raise exception using
      errcode = '23514',
      message = 'Only deleted products may have deleted_at set';
  end if;

  return new;
end;
$$;

create trigger products_prepare
before insert or update on public.products
for each row execute function private.prepare_product();

create function private.enforce_product_image_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  image_count integer;
begin
  perform 1
  from public.products
  where id = new.product_id
  for update;

  select count(*) into image_count
  from public.product_images
  where product_id = new.product_id
    and (tg_op <> 'UPDATE' or id <> old.id);

  if image_count >= 5 then
    raise exception using
      errcode = '23514',
      message = 'A product may have at most five images';
  end if;

  return new;
end;
$$;

create trigger product_images_enforce_limit
before insert or update of product_id on public.product_images
for each row execute function private.enforce_product_image_limit();

create function public.switch_user_role(target_role public.user_role)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_role public.user_role;
  archived_count integer := 0;
  result_profile jsonb;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select p.role into existing_role
  from public.profiles p
  where p.id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Profile not found';
  end if;

  if existing_role = target_role then
    select to_jsonb(p) into result_profile
    from public.profiles p
    where p.id = current_user_id;

    return jsonb_build_object(
      'profile', result_profile,
      'archivedProductCount', 0
    );
  end if;

  if target_role = 'buyer' then
    update public.products
    set status = 'archived'
    where farmer_id = current_user_id
      and status in ('draft', 'active', 'sold_out');
    get diagnostics archived_count = row_count;
  end if;

  update public.profiles
  set role = target_role
  where id = current_user_id
  returning to_jsonb(profiles.*) into result_profile;

  return jsonb_build_object(
    'profile', result_profile,
    'archivedProductCount', archived_count
  );
end;
$$;

create function public.update_my_profile(
  target_full_name text,
  target_phone text,
  target_state public.nigerian_state,
  target_city text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  public_profile jsonb;
  private_profile jsonb;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if char_length(btrim(target_full_name)) not between 2 and 100
    or char_length(btrim(target_city)) not between 2 and 100
    or btrim(target_phone) !~ '^\+[1-9][0-9]{7,14}$'
  then
    raise exception using errcode = '22023', message = 'Invalid profile details';
  end if;

  update public.profiles
  set
    full_name = btrim(target_full_name),
    state = target_state,
    city = btrim(target_city)
  where id = current_user_id
  returning to_jsonb(profiles.*) into public_profile;

  if public_profile is null then
    raise exception using errcode = 'P0002', message = 'Profile not found';
  end if;

  update public.profile_private
  set phone = btrim(target_phone)
  where user_id = current_user_id
  returning to_jsonb(profile_private.*) into private_profile;

  return public_profile || jsonb_build_object(
    'phone',
    private_profile ->> 'phone'
  );
end;
$$;

create function public.start_conversation(target_product_id uuid)
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
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if not private.is_current_farmer(current_user_id)
    and exists (
      select 1
      from public.profiles p
      where p.id = current_user_id
        and p.role = 'buyer'::public.user_role
    )
  then
    null;
  else
    raise exception using errcode = '42501', message = 'Only buyers can start conversations';
  end if;

  select * into target_product
  from public.products
  where id = target_product_id
    and status = 'active'
  for share;

  if not found then
    raise exception using errcode = 'P0002', message = 'Active product not found';
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

create function public.reorder_product_images(
  target_product_id uuid,
  ordered_image_ids uuid[]
)
returns setof public.product_images
language plpgsql
security definer
set search_path = ''
as $$
declare
  supplied_count integer := coalesce(array_length(ordered_image_ids, 1), 0);
  stored_count integer;
begin
  if not private.owns_product(target_product_id)
    or not private.is_current_farmer(auth.uid())
  then
    raise exception using errcode = '42501', message = 'Product access denied';
  end if;

  select count(*) into stored_count
  from public.product_images
  where product_id = target_product_id;

  if supplied_count <> stored_count
    or supplied_count > 5
    or exists (
      select 1
      from unnest(ordered_image_ids) image_id
      where not exists (
        select 1 from public.product_images
        where id = image_id and product_id = target_product_id
      )
    )
    or (select count(distinct image_id) from unnest(ordered_image_ids) image_id)
      <> supplied_count
  then
    raise exception using errcode = '22023', message = 'Image order is invalid';
  end if;

  set constraints product_images_product_order_key deferred;

  update public.product_images image
  set display_order = ordered.ordinality - 1
  from unnest(ordered_image_ids) with ordinality as ordered(id, ordinality)
  where image.id = ordered.id
    and image.product_id = target_product_id;

  return query
  select *
  from public.product_images
  where product_id = target_product_id
  order by display_order;
end;
$$;

create function public.mark_conversation_read(target_conversation_id uuid)
returns public.conversations
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  updated_conversation public.conversations;
begin
  if not private.is_conversation_participant(
    target_conversation_id,
    current_user_id
  ) then
    raise exception using errcode = '42501', message = 'Conversation access denied';
  end if;

  update public.conversations
  set
    buyer_last_read_at = case
      when buyer_id = current_user_id then now()
      else buyer_last_read_at
    end,
    farmer_last_read_at = case
      when farmer_id = current_user_id then now()
      else farmer_last_read_at
    end
  where id = target_conversation_id
  returning * into updated_conversation;

  return updated_conversation;
end;
$$;

create function private.after_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set
    last_message_id = new.id,
    last_message_at = new.created_at,
    buyer_last_read_at = case
      when buyer_id = new.sender_id then new.created_at
      else buyer_last_read_at
    end,
    farmer_last_read_at = case
      when farmer_id = new.sender_id then new.created_at
      else farmer_last_read_at
    end
  where id = new.conversation_id;

  return new;
end;
$$;

create trigger messages_update_conversation
after insert on public.messages
for each row execute function private.after_message_insert();

create function public.send_message(
  target_conversation_id uuid,
  message_body text
)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_message public.messages;
  normalized_body text := btrim(message_body);
begin
  if not private.is_conversation_participant(
    target_conversation_id,
    current_user_id
  ) then
    raise exception using errcode = '42501', message = 'Conversation access denied';
  end if;

  if char_length(normalized_body) not between 1 and 2000 then
    raise exception using errcode = '22023', message = 'Message length must be between 1 and 2000';
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (target_conversation_id, current_user_id, normalized_body)
  returning * into created_message;

  return created_message;
end;
$$;

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Public can read farmer profiles"
on public.profiles for select
to anon, authenticated
using (profiles.role = 'farmer'::public.user_role);

create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "Participants can read counterpart profiles"
on public.profiles for select
to authenticated
using (
  private.users_share_conversation((select auth.uid()), id)
);

create policy "Users can update their own public profile fields"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Users can read their private profile"
on public.profile_private for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can update their private profile"
on public.profile_private for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (status = 'active');

create policy "Owners can read all their products"
on public.products for select
to authenticated
using (farmer_id = (select auth.uid()));

create policy "Farmers can create their own products"
on public.products for insert
to authenticated
with check (
  farmer_id = (select auth.uid())
  and private.is_current_farmer((select auth.uid()))
  and status = 'draft'
);

create policy "Farmer owners can update products"
on public.products for update
to authenticated
using (
  farmer_id = (select auth.uid())
  and private.is_current_farmer((select auth.uid()))
)
with check (
  farmer_id = (select auth.uid())
  and private.is_current_farmer((select auth.uid()))
);

create policy "Public can read images for active products"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.status = 'active'
  )
);

create policy "Owners can read all product images"
on public.product_images for select
to authenticated
using (private.owns_product(product_id));

create policy "Farmer owners can add product images"
on public.product_images for insert
to authenticated
with check (
  private.owns_product(product_id)
  and private.is_current_farmer((select auth.uid()))
);

create policy "Farmer owners can update product images"
on public.product_images for update
to authenticated
using (
  private.owns_product(product_id)
  and private.is_current_farmer((select auth.uid()))
)
with check (
  private.owns_product(product_id)
  and private.is_current_farmer((select auth.uid()))
);

create policy "Farmer owners can remove product images"
on public.product_images for delete
to authenticated
using (
  private.owns_product(product_id)
  and private.is_current_farmer((select auth.uid()))
);

create policy "Participants can read conversations"
on public.conversations for select
to authenticated
using ((select auth.uid()) in (buyer_id, farmer_id));

create policy "Participants can read messages"
on public.messages for select
to authenticated
using (
  private.is_conversation_participant(conversation_id, (select auth.uid()))
);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.profile_private from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.product_images from anon, authenticated;
revoke all on table public.conversations from anon, authenticated;
revoke all on table public.messages from anon, authenticated;

grant select on table public.profiles to anon, authenticated;
grant update (full_name, state, city, avatar_path)
  on table public.profiles to authenticated;
grant select on table public.profile_private to authenticated;
grant update (phone) on table public.profile_private to authenticated;
grant select on table public.products to anon, authenticated;
grant insert (
  farmer_id,
  title,
  description,
  category,
  price,
  unit,
  available_quantity,
  state,
  city
) on table public.products to authenticated;
grant update (
  title,
  description,
  category,
  price,
  unit,
  available_quantity,
  state,
  city,
  status
) on table public.products to authenticated;
grant select on table public.product_images to anon, authenticated;
grant insert (product_id, storage_path, display_order, alt_text)
  on table public.product_images to authenticated;
grant update (display_order, alt_text)
  on table public.product_images to authenticated;
grant delete on table public.product_images to authenticated;
grant select on table public.conversations to authenticated;
grant select on table public.messages to authenticated;

revoke all on function public.switch_user_role(public.user_role) from public;
revoke all on function public.update_my_profile(text, text, public.nigerian_state, text) from public;
revoke all on function public.start_conversation(uuid) from public;
revoke all on function public.reorder_product_images(uuid, uuid[]) from public;
revoke all on function public.mark_conversation_read(uuid) from public;
revoke all on function public.send_message(uuid, text) from public;
grant execute on function public.switch_user_role(public.user_role) to authenticated;
grant execute on function public.update_my_profile(text, text, public.nigerian_state, text) to authenticated;
grant execute on function public.start_conversation(uuid) to authenticated;
grant execute on function public.reorder_product_images(uuid, uuid[]) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;

grant usage on schema private to anon, authenticated;
grant execute on function private.is_current_farmer(uuid) to authenticated;
grant execute on function private.owns_product(uuid) to authenticated;
grant execute on function private.is_conversation_participant(uuid, uuid)
  to authenticated;
grant execute on function private.users_share_conversation(uuid, uuid)
  to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  ('avatars', 'avatars', true, 5242880, array['image/webp']),
  ('product-images', 'product-images', true, 8388608, array['image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read marketplace images"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('avatars', 'product-images'));

create policy "Users can upload their avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can replace their avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can remove their avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid())::text
);

create policy "Farmers can upload owned product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and private.owns_product(((storage.foldername(name))[2])::uuid)
  and private.is_current_farmer((select auth.uid()))
);

create policy "Farmers can replace owned product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and owner_id = (select auth.uid())::text
  and private.owns_product(((storage.foldername(name))[2])::uuid)
)
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and private.owns_product(((storage.foldername(name))[2])::uuid)
  and private.is_current_farmer((select auth.uid()))
);

create policy "Farmers can remove owned product images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and owner_id = (select auth.uid())::text
  and private.owns_product(((storage.foldername(name))[2])::uuid)
  and private.is_current_farmer((select auth.uid()))
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end;
$$;
