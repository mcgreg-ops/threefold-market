# Threefold Market — E-commerce Starter

A responsive Next.js starter storefront for a mixed-category shop: mountain bikes, bike gear, home accessories, tiny pockets / small pouches, apparel, outdoor & camping, and lifestyle gifts.

## Included

- Responsive white-theme storefront and category navigation
- Homepage, shop, and product detail pages read active products from Supabase
- Browser-persisted shopping cart
- Server-validated order creation with stock reservation; shipping and online payment are not configured
- Admin login page wired to Supabase email/password authentication when configured
- Admin product management, image upload, and order status management
- Supabase SQL schema for products, orders, order items, and reviews
- Vercel-ready environment variable template

## Not production-ready yet

Checkout creates pending orders and reserves stock using database product prices. Shipping fees and online payments are not configured; confirm shipping and payment instructions with customers before dispatch. Add abuse protection and customer notifications before opening checkout to the public. Never trust a price or payment status sent from the browser. Never expose a Supabase service-role key in client-side code.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Configure Supabase

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`, then `supabase/002_store_security_and_checkout.sql`, then `supabase/003_shipping_courier_preference.sql`.
3. In Supabase Authentication, create your admin user. Keep public sign-ups disabled if only you should administer the store.
4. Add that account as the store admin in SQL Editor, replacing the email with the admin email:

```sql
insert into public.store_admins (user_id)
select id from auth.users where email = 'admin@example.com'
on conflict (user_id) do nothing;
```

5. Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

6. Set these variables in the environment used to run/build this app (for local development, `.env.local`), then restart the development server. Visit `/admin/login`.
7. Sign in to add products and upload images. The migration grants product and image management only to accounts in `store_admins`.

The first SQL file creates the tables and public read policies. The second adds admin-only policies and trusted order creation. The third saves each buyer's preferred courier with the order. The store still confirms the actual courier and shipping fee manually. Do not expose private order/customer data through public policies.

## Deploy to GitHub and Vercel

1. Create an empty GitHub repository named `threefold-market`.
2. From this folder run:

```bash
git init
git add .
git commit -m "Initial Threefold Market storefront"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/threefold-market.git
git push -u origin main
```

3. In Vercel, choose **Add New → Project**, import the GitHub repository, and deploy with the default Next.js settings.
4. Add the same Supabase environment variables in Vercel → Project Settings → Environment Variables, then redeploy.

## Main structure

```text
app/
  admin/login/page.tsx       # Supabase admin sign-in
  admin/products/page.tsx    # admin product management
  admin/orders/page.tsx      # order and payment status management
  cart/page.tsx              # cart
  checkout/page.tsx          # order checkout
  products/[slug]/page.tsx   # product detail
  globals.css                # white theme + responsive layout
  layout.tsx                 # global header/footer/provider
  page.tsx                   # homepage
components/
  product-card.tsx
  store-header.tsx
lib/
  cart-context.tsx            # cart saved in localStorage
  products.ts                 # product types and currency formatting
  use-catalog.ts              # active product/category reads from Supabase
  supabase.ts                 # Supabase browser client
supabase/
  schema.sql                  # starter database schema
  002_store_security_and_checkout.sql # admin policies and order functions
  003_shipping_courier_preference.sql # buyer courier preference on checkout
```

## Before launch checklist

- Add real products to Supabase; the homepage, shop, and product detail pages now read the active catalog there.
- Confirm the courier and shipping fee with each buyer before dispatch; the checkout stores their preferred courier but does not calculate carrier rates.
- Configure shipping fees and a payment gateway before taking online payments or advertising final totals.
- Integrate a payment gateway that supports GCash for your approved merchant account.
- Verify payment webhooks server-side before marking an order paid or changing stock.
- Add customer order confirmation, cancellation/refund workflow, privacy notice, and terms.
- Add checkout abuse protection and customer order notifications.
- Test mobile layout, checkout edge cases, RLS policies, and payment failure paths.
