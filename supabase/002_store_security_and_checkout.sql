-- Run after schema.sql. This can also be applied to projects that already ran
-- the original starter schema.

create table if not exists public.store_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.store_admins enable row level security;
alter table public.orders add column if not exists checkout_token uuid unique;
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  where id = 'product-images';

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.store_admins where user_id = auth.uid()
  );
$$;
revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to authenticated;

drop policy if exists "Store admins can read all products" on public.products;
create policy "Store admins can read all products" on public.products
  for select to authenticated using ((select public.is_store_admin()));
drop policy if exists "Store admins can insert products" on public.products;
create policy "Store admins can insert products" on public.products
  for insert to authenticated with check ((select public.is_store_admin()));
drop policy if exists "Store admins can update products" on public.products;
create policy "Store admins can update products" on public.products
  for update to authenticated using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));
drop policy if exists "Store admins can delete products" on public.products;
create policy "Store admins can delete products" on public.products
  for delete to authenticated using ((select public.is_store_admin()));

drop policy if exists "Store admins can read all reviews" on public.reviews;
create policy "Store admins can read all reviews" on public.reviews
  for select to authenticated using ((select public.is_store_admin()));
drop policy if exists "Store admins can manage reviews" on public.reviews;
create policy "Store admins can manage reviews" on public.reviews
  for all to authenticated using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "Store admins can read orders" on public.orders;
create policy "Store admins can read orders" on public.orders
  for select to authenticated using ((select public.is_store_admin()));
drop policy if exists "Store admins can update orders" on public.orders;
create policy "Store admins can update orders" on public.orders
  for update to authenticated using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));
drop policy if exists "Store admins can read order items" on public.order_items;
create policy "Store admins can read order items" on public.order_items
  for select to authenticated using ((select public.is_store_admin()));

drop policy if exists "Store admins can upload product images" on storage.objects;
create policy "Store admins can upload product images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images' and (select public.is_store_admin())
  );
drop policy if exists "Store admins can update product images" on storage.objects;
create policy "Store admins can update product images" on storage.objects
  for update to authenticated using (
    bucket_id = 'product-images' and (select public.is_store_admin())
  ) with check (bucket_id = 'product-images' and (select public.is_store_admin()));
drop policy if exists "Store admins can delete product images" on storage.objects;
create policy "Store admins can delete product images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-images' and (select public.is_store_admin())
  );

drop function if exists public.place_order(text, text, text, text, text, jsonb);
drop function if exists public.place_order(text, text, text, text, text, jsonb, uuid);
create or replace function public.place_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_payment_method text,
  p_items jsonb,
  p_checkout_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  selected_product public.products%rowtype;
  requested_id uuid;
  requested_quantity integer;
  expected_price numeric(12,2);
  subtotal_amount numeric(12,2) := 0;
  existing_subtotal numeric(12,2);
  existing_shipping_fee numeric(12,2);
  existing_total numeric(12,2);
  order_id uuid;
  new_order_number bigint;
  duplicate_count integer;
begin
  if p_checkout_token is null then
    raise exception 'Checkout reference is required.' using errcode = '22023';
  end if;
  select id, order_number, subtotal, shipping_fee, total
    into order_id, new_order_number, existing_subtotal, existing_shipping_fee, existing_total
    from public.orders where checkout_token = p_checkout_token;
  if found then
    return jsonb_build_object(
      'id', order_id, 'order_number', new_order_number,
      'subtotal', existing_subtotal, 'shipping_fee', existing_shipping_fee, 'total', existing_total
    );
  end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120
     or length(trim(coalesce(p_customer_email, ''))) not between 3 and 254
     or p_customer_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or length(trim(coalesce(p_customer_phone, ''))) not between 7 and 30
     or length(trim(coalesce(p_shipping_address, ''))) not between 8 and 1000 then
    raise exception 'Please provide valid contact and delivery details.' using errcode = '22023';
  end if;
  if p_payment_method is null or p_payment_method not in ('cod', 'bank_transfer') then
    raise exception 'Choose a supported payment method.' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Your cart is empty or contains too many items.' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    begin
      requested_id := (item->>'id')::uuid;
      requested_quantity := (item->>'quantity')::integer;
      expected_price := (item->>'expected_price')::numeric(12,2);
    exception when others then
      raise exception 'The cart contains an invalid item.' using errcode = '22023';
    end;
    if requested_id is null or requested_quantity is null or expected_price is null or requested_quantity < 1 or requested_quantity > 99 then
      raise exception 'Item quantities must be between 1 and 99.' using errcode = '22023';
    end if;
    select count(*) into duplicate_count from jsonb_array_elements(p_items) candidate
      where candidate.value->>'id' = requested_id::text;
    if duplicate_count > 1 then
      raise exception 'The cart contains a duplicate product.' using errcode = '22023';
    end if;
    select * into selected_product from public.products
      where id = requested_id and is_active = true for update;
    if not found then
      raise exception 'A product in your cart is no longer available.' using errcode = 'P0001';
    end if;
    if selected_product.price <> expected_price then
      raise exception 'The price for % changed. Review your cart and submit the order again.', selected_product.name using errcode = 'P0001';
    end if;
    if selected_product.stock < requested_quantity then
      raise exception 'Not enough stock for %.', selected_product.name using errcode = 'P0001';
    end if;
    subtotal_amount := subtotal_amount + selected_product.price * requested_quantity;
  end loop;

  insert into public.orders (
    customer_name, customer_email, customer_phone, shipping_address,
    subtotal, shipping_fee, total, payment_method, payment_status, order_status, checkout_token
  ) values (
    trim(p_customer_name), trim(p_customer_email), trim(p_customer_phone),
    trim(p_shipping_address), subtotal_amount, 0, subtotal_amount,
    p_payment_method, 'pending', 'pending', p_checkout_token
  ) returning id, order_number into order_id, new_order_number;

  for item in select value from jsonb_array_elements(p_items)
  loop
    requested_id := (item->>'id')::uuid;
    requested_quantity := (item->>'quantity')::integer;
    select * into selected_product from public.products where id = requested_id for update;
    insert into public.order_items (
      order_id, product_id, product_name, unit_price, quantity, line_total
    ) values (
      order_id, selected_product.id, selected_product.name, selected_product.price,
      requested_quantity, selected_product.price * requested_quantity
    );
    update public.products set stock = stock - requested_quantity, updated_at = now()
      where id = selected_product.id;
  end loop;

  return jsonb_build_object(
    'id', order_id, 'order_number', new_order_number,
    'subtotal', subtotal_amount, 'shipping_fee', 0, 'total', subtotal_amount
  );
end;
$$;
revoke all on function public.place_order(text, text, text, text, text, jsonb, uuid) from public;
grant execute on function public.place_order(text, text, text, text, text, jsonb, uuid) to anon, authenticated;

create or replace function public.set_order_status(
  p_order_id uuid,
  p_order_status text,
  p_payment_status text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_order_status text;
begin
  if not public.is_store_admin() then
    raise exception 'Store admin access is required.' using errcode = '42501';
  end if;
  if p_order_status is null or p_order_status not in ('pending', 'processing', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Invalid order status.' using errcode = '22023';
  end if;
  if p_payment_status is not null and p_payment_status not in ('pending', 'paid', 'failed', 'refunded') then
    raise exception 'Invalid payment status.' using errcode = '22023';
  end if;
  select order_status into current_order_status from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;
  if current_order_status = 'cancelled' and p_order_status <> 'cancelled' then
    raise exception 'A cancelled order cannot be reopened.' using errcode = '22023';
  end if;
  if current_order_status = 'cancelled' and p_payment_status is not null and p_payment_status <> (
    select payment_status from public.orders where id = p_order_id
  ) then
    raise exception 'A cancelled order payment status cannot be changed.' using errcode = '22023';
  end if;
  if p_order_status = 'cancelled' and exists (
    select 1 from public.orders where id = p_order_id and payment_status = 'paid'
  ) and p_payment_status is distinct from 'refunded' then
    raise exception 'Mark the payment refunded before cancelling this paid order.' using errcode = '22023';
  end if;
  if current_order_status <> 'cancelled' and p_order_status = 'cancelled' then
    update public.products product set stock = product.stock + item_totals.quantity, updated_at = now()
      from (
        select product_id, sum(quantity)::integer as quantity
        from public.order_items
        where order_id = p_order_id and product_id is not null
        group by product_id
      ) item_totals
      where product.id = item_totals.product_id;
  end if;
  update public.orders set order_status = p_order_status,
      payment_status = coalesce(p_payment_status, payment_status)
    where id = p_order_id;
end;
$$;
revoke all on function public.set_order_status(uuid, text, text) from public;
grant execute on function public.set_order_status(uuid, text, text) to authenticated;

create or replace function public.set_order_shipping_fee(p_order_id uuid, p_shipping_fee numeric)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_order public.orders%rowtype;
begin
  if not public.is_store_admin() then
    raise exception 'Store admin access is required.' using errcode = '42501';
  end if;
  if p_shipping_fee is null or p_shipping_fee < 0 or p_shipping_fee > 100000 then
    raise exception 'Enter a valid shipping fee.' using errcode = '22023';
  end if;
  select * into current_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;
  if current_order.order_status in ('delivered', 'cancelled') then
    raise exception 'Shipping cannot be changed after an order is delivered or cancelled.' using errcode = '22023';
  end if;
  update public.orders set shipping_fee = p_shipping_fee,
    total = subtotal + p_shipping_fee where id = p_order_id;
end;
$$;
revoke all on function public.set_order_shipping_fee(uuid, numeric) from public;
grant execute on function public.set_order_shipping_fee(uuid, numeric) to authenticated;
