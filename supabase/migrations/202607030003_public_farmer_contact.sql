alter table public.profiles
add column address varchar(200) not null default ''
check (
  address = ''
  or char_length(btrim(address)) between 5 and 200
);

grant update (address) on table public.profiles to authenticated;

drop function if exists public.update_my_profile(
  text,
  text,
  public.nigerian_state,
  text
);

create function public.update_my_profile(
  target_full_name text,
  target_phone text,
  target_address text,
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
  normalized_address text := btrim(coalesce(target_address, ''));
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if char_length(btrim(target_full_name)) not between 2 and 100
    or char_length(btrim(target_city)) not between 2 and 100
    or char_length(normalized_address) > 200
    or (
      normalized_address <> ''
      and char_length(normalized_address) < 5
    )
    or btrim(target_phone) !~ '^\+[1-9][0-9]{7,14}$'
  then
    raise exception using errcode = '22023', message = 'Invalid profile details';
  end if;

  update public.profiles
  set
    full_name = btrim(target_full_name),
    address = normalized_address,
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

create function public.get_public_farmer_profile(target_profile_id uuid)
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
    and (
      profiles.role = 'farmer'
      or exists (
        select 1
        from public.products
        where products.farmer_id = profiles.id
          and products.status in ('active', 'sold_out')
      )
    );
$$;

revoke all on function public.update_my_profile(
  text,
  text,
  text,
  public.nigerian_state,
  text
) from public;
revoke all on function public.get_public_farmer_profile(uuid) from public;

grant execute on function public.update_my_profile(
  text,
  text,
  text,
  public.nigerian_state,
  text
) to authenticated;
grant execute on function public.get_public_farmer_profile(uuid)
to anon, authenticated;
