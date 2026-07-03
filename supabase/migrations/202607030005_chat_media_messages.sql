create type public.message_type as enum ('text', 'image', 'mixed');

alter table public.messages
  alter column body drop not null,
  add column message_type public.message_type not null default 'text',
  add column media_url text,
  add column media_path text,
  add column media_mime_type varchar(50),
  add column media_size bigint,
  add column media_original_name varchar(255);

alter table public.messages
  drop constraint if exists messages_body_check;

alter table public.messages
  add constraint messages_content_check
  check (
    (
      message_type = 'text'
      and body is not null
      and char_length(btrim(body)) between 1 and 2000
      and media_url is null
      and media_path is null
      and media_mime_type is null
      and media_size is null
      and media_original_name is null
    )
    or (
      message_type = 'image'
      and body is null
      and media_path is not null
      and media_mime_type is not null
      and media_mime_type = 'image/webp'
      and media_size is not null
      and media_size between 1 and 5242880
      and media_original_name is not null
      and char_length(btrim(media_original_name)) between 1 and 255
    )
    or (
      message_type = 'mixed'
      and body is not null
      and char_length(btrim(body)) between 1 and 2000
      and media_path is not null
      and media_mime_type is not null
      and media_mime_type = 'image/webp'
      and media_size is not null
      and media_size between 1 and 5242880
      and media_original_name is not null
      and char_length(btrim(media_original_name)) between 1 and 255
    )
  );

create unique index messages_media_path_idx
on public.messages (media_path)
where media_path is not null;

create function public.send_message(
  target_conversation_id uuid,
  message_body text,
  message_media_url text,
  message_media_path text,
  message_media_mime_type text,
  message_media_size bigint,
  message_media_original_name text
)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_message public.messages;
  normalized_body text := nullif(btrim(coalesce(message_body, '')), '');
  normalized_media_url text := nullif(btrim(coalesce(message_media_url, '')), '');
  normalized_original_name text :=
    nullif(btrim(coalesce(message_media_original_name, '')), '');
  has_media boolean := message_media_path is not null;
  resolved_type public.message_type;
begin
  if not private.is_conversation_participant(
    target_conversation_id,
    current_user_id
  ) then
    raise exception using errcode = '42501', message = 'Conversation access denied';
  end if;

  if normalized_body is not null
    and char_length(normalized_body) > 2000
  then
    raise exception using errcode = '22023', message = 'Message length must be between 1 and 2000';
  end if;

  if normalized_body is null and not has_media then
    raise exception using errcode = '22023', message = 'Enter a message or choose an image';
  end if;

  if has_media then
    if message_media_path not like (
      current_user_id::text
      || '/'
      || target_conversation_id::text
      || '/%'
    )
      or message_media_mime_type <> 'image/webp'
      or message_media_size is null
      or message_media_size not between 1 and 5242880
      or normalized_original_name is null
      or char_length(normalized_original_name) > 255
      or not exists (
        select 1
        from storage.objects
        where objects.bucket_id = 'chat-media'
          and objects.name = message_media_path
          and objects.owner_id = current_user_id::text
      )
    then
      raise exception using errcode = '22023', message = 'Invalid message image metadata';
    end if;
  elsif message_media_url is not null
    or message_media_mime_type is not null
    or message_media_size is not null
    or message_media_original_name is not null
  then
    raise exception using errcode = '22023', message = 'Incomplete message image metadata';
  end if;

  resolved_type := case
    when has_media and normalized_body is not null then 'mixed'::public.message_type
    when has_media then 'image'::public.message_type
    else 'text'::public.message_type
  end;

  insert into public.messages (
    conversation_id,
    sender_id,
    body,
    message_type,
    media_url,
    media_path,
    media_mime_type,
    media_size,
    media_original_name
  )
  values (
    target_conversation_id,
    current_user_id,
    normalized_body,
    resolved_type,
    normalized_media_url,
    message_media_path,
    message_media_mime_type,
    message_media_size,
    normalized_original_name
  )
  returning * into created_message;

  return created_message;
end;
$$;

revoke all on function public.send_message(
  uuid,
  text,
  text,
  text,
  text,
  bigint,
  text
) from public;
grant execute on function public.send_message(
  uuid,
  text,
  text,
  text,
  text,
  bigint,
  text
) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'chat-media',
  'chat-media',
  false,
  5242880,
  array['image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Participants can read chat media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'chat-media'
  and private.is_conversation_participant(
    ((storage.foldername(name))[2])::uuid,
    (select auth.uid())
  )
);

create policy "Participants can upload chat media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and private.is_conversation_participant(
    ((storage.foldername(name))[2])::uuid,
    (select auth.uid())
  )
);

create policy "Senders can remove chat media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'chat-media'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
