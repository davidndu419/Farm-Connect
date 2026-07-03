create function public.get_conversation_profile(target_profile_id uuid)
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
    and auth.uid() is not null
    and (
      profiles.id = auth.uid()
      or private.users_share_conversation(auth.uid(), profiles.id)
    );
$$;

revoke all on function public.get_conversation_profile(uuid) from public;
grant execute on function public.get_conversation_profile(uuid)
to authenticated;
