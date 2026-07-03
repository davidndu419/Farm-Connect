create or replace function private.prepare_product()
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

  if tg_op = 'UPDATE'
    and new.status <> old.status
    and not (
      (old.status = 'draft' and new.status in ('active', 'deleted'))
      or (old.status = 'active' and new.status in ('sold_out', 'archived', 'deleted'))
      or (old.status = 'sold_out' and new.status in ('active', 'archived', 'deleted'))
      or (old.status = 'archived' and new.status in ('active', 'deleted'))
    )
  then
    raise exception using
      errcode = '23514',
      message = format(
        'Product status cannot change from %s to %s',
        old.status,
        new.status
      );
  end if;

  if new.status = 'active' and new.available_quantity = 0 then
    if tg_op = 'UPDATE' and old.status = 'active' then
      new.status := 'sold_out';
    else
      raise exception using
        errcode = '23514',
        message = 'Set a positive available quantity before marking this product active';
    end if;
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
    and status in ('active', 'sold_out')
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

drop policy if exists "Public can read active products"
on public.products;

drop policy if exists "Public can read marketplace products"
on public.products;

create policy "Public can read marketplace products"
on public.products for select
to anon, authenticated
using (status in ('active', 'sold_out'));

drop policy if exists "Public can read images for active products"
on public.product_images;

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
  )
);

drop policy if exists "Public can read profiles with active products"
on public.profiles;

drop policy if exists "Public can read profiles with marketplace products"
on public.profiles;

create policy "Public can read profiles with marketplace products"
on public.profiles for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.farmer_id = profiles.id
      and products.status in ('active', 'sold_out')
  )
);
