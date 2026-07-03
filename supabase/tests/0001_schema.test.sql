begin;

select plan(32);

select has_type('public', 'user_role', 'user_role enum exists');
select has_type('public', 'product_status', 'product_status enum exists');
select has_type('public', 'product_category', 'product_category enum exists');
select has_type('public', 'product_unit', 'product_unit enum exists');
select has_type('public', 'nigerian_state', 'nigerian_state enum exists');

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'profile_private', 'profile_private table exists');
select has_table('public', 'products', 'products table exists');
select has_table('public', 'product_images', 'product_images table exists');
select has_table('public', 'conversations', 'conversations table exists');
select has_table('public', 'messages', 'messages table exists');

select col_is_pk('public', 'profiles', 'id', 'profiles.id is the primary key');
select col_is_pk('public', 'products', 'id', 'products.id is the primary key');
select col_is_pk('public', 'conversations', 'id', 'conversations.id is the primary key');
select col_is_pk('public', 'messages', 'id', 'messages.id is the primary key');

select fk_ok(
  'public', 'products', 'farmer_id',
  'public', 'profiles', 'id',
  'products belong to profiles'
);
select fk_ok(
  'public', 'product_images', 'product_id',
  'public', 'products', 'id',
  'images belong to products'
);
select fk_ok(
  'public', 'conversations', 'product_id',
  'public', 'products', 'id',
  'conversations retain product references'
);
select fk_ok(
  'public', 'messages', 'conversation_id',
  'public', 'conversations', 'id',
  'messages belong to conversations'
);

select has_index(
  'public', 'products', 'products_search_idx',
  'products have a full-text search index'
);
select has_index(
  'public', 'messages', 'messages_conversation_recent_idx',
  'messages support chronological conversation reads'
);

select has_function(
  'public', 'switch_user_role', array['user_role'],
  'atomic role switching function exists'
);
select has_function(
  'public', 'update_my_profile', array['text', 'text', 'nigerian_state', 'text'],
  'atomic profile update function exists'
);
select has_function(
  'public', 'start_conversation', array['uuid'],
  'idempotent conversation function exists'
);
select has_function(
  'public', 'reorder_product_images', array['uuid', 'uuid[]'],
  'atomic image ordering function exists'
);
select has_function(
  'public', 'mark_conversation_read', array['uuid'],
  'read-state function exists'
);
select has_function(
  'public', 'send_message', array['uuid', 'text'],
  'message function exists'
);

select table_privs_are(
  'anon',
  'public',
  'profile_private',
  array[]::text[],
  'anonymous users have no private-profile privileges'
);
select table_privs_are(
  'anon',
  'public',
  'messages',
  array[]::text[],
  'anonymous users have no message privileges'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.products'::regclass),
  true,
  'products enforce RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.conversations'::regclass),
  true,
  'conversations enforce RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.messages'::regclass),
  true,
  'messages enforce RLS'
);

select * from finish();
rollback;
