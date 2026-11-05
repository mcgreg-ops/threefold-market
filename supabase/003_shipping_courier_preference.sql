-- Run after 002_store_security_and_checkout.sql.
-- Stores the buyer's preferred courier. The final courier and fee are confirmed
-- by the store after checking destination and parcel details.

alter table public.orders
  add column if not exists preferred_courier text not null default ''
  check (char_length(preferred_courier) <= 80);

drop function if exists public.place_order(text, text, text, text, text, jsonb, uuid);

create or replace function public.place_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_payment_method text,
  p_items jsonb,
  p_checkout_token uuid,
  p_preferred_courier text
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
  existing_preferred_courier text;
  order_id uuid;
  new_order_number bigint;
  duplicate_count integer;
begin
  if p_checkout_token is null then
    raise exception 'Checkout reference is required.' using errcode = '22023';
  end if;
  select id, order_number, subtotal, shipping_fee, total, preferred_courier
    into order_id, new_order_number, existing_subtotal, existing_shipping_fee, existing_total, existing_preferred_courier
    from public.orders where checkout_token = p_checkout_token;
  if found then
    return jsonb_build_object(
      'id', order_id, 'order_number', new_order_number,
      'subtotal', existing_subtotal, 'shipping_fee', existing_shipping_fee, 'total', existing_total,
      'preferred_courier', existing_preferred_courier
    );
  end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120
     or length(trim(coalesce(p_customer_email, ''))) not between 3 and 254
     or p_customer_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or length(trim(coalesce(p_customer_phone, ''))) not between 7 and 30
     or length(trim(coalesce(p_shipping_address, ''))) not between 8 and 1000
     or length(trim(coalesce(p_preferred_courier, ''))) > 80 then
    raise exception 'Please provide valid contact, delivery, and courier details.' using errcode = '22023';
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
    subtotal, shipping_fee, total, payment_method, payment_status, order_status,
    checkout_token, preferred_courier
  ) values (
    trim(p_customer_name), trim(p_customer_email), trim(p_customer_phone),
    trim(p_shipping_address), subtotal_amount, 0, subtotal_amount,
    p_payment_method, 'pending', 'pending', p_checkout_token, trim(coalesce(p_preferred_courier, ''))
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
    'subtotal', subtotal_amount, 'shipping_fee', 0, 'total', subtotal_amount,
    'preferred_courier', trim(coalesce(p_preferred_courier, ''))
  );
end;
$$;
revoke all on function public.place_order(text, text, text, text, text, jsonb, uuid, text) from public;
grant execute on function public.place_order(text, text, text, text, text, jsonb, uuid, text) to anon, authenticated;
