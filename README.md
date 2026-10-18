# Threefold Market — E-commerce Starter

A responsive Next.js starter storefront for a mixed-category shop: mountain bikes, bike gear, home accessories, tiny pockets / small pouches, apparel, outdoor & camping, and lifestyle gifts.

## Included

- Responsive white-theme storefront and category navigation
- Featured product cards and product detail pages
- Browser-persisted demo shopping cart
- Checkout UI preview (does **not** create orders or charge money)
- Admin login page wired to Supabase email/password authentication when configured
- Starter admin inventory dashboard that can read the `products` table
- Supabase SQL schema for products, orders, order items, and reviews
- Vercel-ready environment variable template

## Not production-ready yet

The starter intentionally does not pretend that payment or checkout is live. Before accepting real orders, implement trusted server-side order creation, stock locking/decrement transactions, delivery fee calculation, payment-gateway checkout creation, signature-verified payment webhooks, admin authorization/RLS policies, and error handling. Never trust a price or payment status sent from the browser. Never expose a Supabase service-role key in client-side code.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Configure Supabase

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. In Supabase Authentication, create your admin user. Keep public sign-ups disabled if only you should administer the store.
4. Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

5. Restart the development server. Visit `/admin/login`.
6. Configure Storage policies so only authorized admins can upload images; product images can be publicly readable.

Important: the SQL starter only creates basic public read policies for active products and approved reviews. Do not expose private order/customer data through public policies. Add admin-role policies and trusted server-side checkout before launch.

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
  admin/products/page.tsx    # starter inventory dashboard
  admin/orders/page.tsx      # orders placeholder
  cart/page.tsx              # cart
  checkout/page.tsx          # checkout UI preview only
  products/[slug]/page.tsx   # product detail
  globals.css                # white theme + responsive layout
  layout.tsx                 # global header/footer/provider
  page.tsx                   # homepage
components/
  product-card.tsx
  store-header.tsx
lib/
  cart-context.tsx            # demo cart saved in localStorage
  products.ts                 # sample products/categories
  supabase.ts                 # Supabase browser client
supabase/
  schema.sql                  # starter database schema
```

## Before launch checklist

- Replace sample products, prices, photos, ratings, and reviews with real content.
- Connect storefront product queries and admin CRUD to Supabase.
- Add secure admin role enforcement and Storage upload policies.
- Implement order creation with server-side product/stock/price validation.
- Integrate a payment gateway that supports GCash for your approved merchant account.
- Verify payment webhooks server-side before marking an order paid or changing stock.
- Add shipping rules, cancellation/refund workflow, privacy notice, and terms.
- Test mobile layout, checkout edge cases, RLS policies, and payment failure paths.
