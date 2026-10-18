-- Threefold Market starter database schema. Review before using with real customers.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category text not null,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  payment_method text not null default 'gcash',
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  order_status text not null default 'pending' check (order_status in ('pending','processing','shipped','delivered','cancelled')),
  payment_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

-- Public storefront may read active products only.
create policy "Anyone can read active products" on public.products
  for select to anon, authenticated using (is_active = true);
-- Public storefront may read approved reviews only.
create policy "Anyone can read approved reviews" on public.reviews
  for select to anon, authenticated using (is_approved = true);
-- No public insert/update/delete policies are intentionally provided for orders,
-- order_items, products, or reviews. Implement trusted server-side checkout,
-- admin role checks, and review submission before production use.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Configure Storage policies from the Supabase dashboard. Keep uploads restricted
-- to authenticated admin users; public read access is appropriate for product images.
