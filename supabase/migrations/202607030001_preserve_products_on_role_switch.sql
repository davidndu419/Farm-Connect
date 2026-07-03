create or replace function public.switch_user_role(
  target_role public.user_role
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  result_profile jsonb;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  update public.profiles
  set role = target_role
  where id = current_user_id
  returning to_jsonb(profiles.*) into result_profile;

  if result_profile is null then
    raise exception using errcode = 'P0002', message = 'Profile not found';
  end if;

  return jsonb_build_object('profile', result_profile);
end;
$$;

drop policy if exists "Farmers can create their own products"
on public.products;

create policy "Farmers can create their own products"
on public.products for insert
to authenticated
with check (
  farmer_id = (select auth.uid())
  and private.is_current_farmer((select auth.uid()))
  and status = 'draft'
);

drop policy if exists "Farmer owners can update products"
on public.products;

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

drop policy if exists "Public can read profiles with active products"
on public.profiles;

create policy "Public can read profiles with active products"
on public.profiles for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.farmer_id = profiles.id
      and products.status = 'active'
  )
);
