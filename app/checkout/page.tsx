'use client';

import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { peso } from '@/lib/products';
import { supabase } from '@/lib/supabase';

type PlacedOrder = { order_number: number; subtotal: number; shipping_fee: number; total: number };

export default function CheckoutPage() {
  const { items, total, clear, refresh } = useCart();
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const checkoutToken = useRef<string | null>(null);

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (!supabase) {
      setMessage('Store checkout is not configured yet. Add the Supabase URL and publishable key to the app environment.');
      return;
    }
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const refreshed = await refresh();
      if (refreshed.error) {
        setMessage(`Could not refresh your cart: ${refreshed.error}`);
        return;
      }
      if (refreshed.changed) {
        setMessage('Product prices or availability changed. Review the updated cart and place the order again.');
        return;
      }
      const requestToken = checkoutToken.current ?? crypto.randomUUID();
      checkoutToken.current = requestToken;
      const { data, error } = await supabase.rpc('place_order', {
        p_customer_name: String(form.get('name') ?? ''),
        p_customer_email: String(form.get('email') ?? ''),
        p_customer_phone: String(form.get('phone') ?? ''),
        p_shipping_address: String(form.get('address') ?? ''),
        p_payment_method: String(form.get('payment') ?? ''),
        p_items: items.map(({ product, quantity }) => ({ id: product.id, quantity, expected_price: product.price })),
        p_checkout_token: requestToken,
      });
      if (error) {
        if (error.code === 'P0001') {
          const currentCart = await refresh();
          setMessage(currentCart.error
            ? `The cart changed while placing your order. Could not refresh it: ${currentCart.error}`
            : 'Prices or availability changed. Review the updated cart and place the order again.');
          return;
        }
        setMessage(error.message.includes('function') ? 'Checkout is not installed in Supabase yet. Run the store security and checkout SQL migration.' : error.message);
        return;
      }
      setPlacedOrder(data as PlacedOrder);
      clear();
    } catch {
      setMessage('Could not reach Supabase. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (placedOrder) return <main className="page-wrap"><div className="empty-state"><h1>Order received</h1><p>Your order number is <strong>#{placedOrder.order_number}</strong>.</p><p className="muted">Your order total is {peso(Number(placedOrder.total))}. Shipping is not included yet; the store will confirm the delivery fee and payment instructions before dispatch.</p><p className="muted">Your items have been reserved. The store will contact you to confirm the order.</p><Link href="/" className="button button-dark">Return to shop</Link></div></main>;

  return <main className="page-wrap"><h1 className="page-title">Checkout</h1><p className="muted">Submit your delivery details to place an order. Shipping will be confirmed by the store.</p>{items.length === 0 ? <div className="empty-state"><p>Your cart is empty.</p><Link href="/shop" className="text-link">Continue shopping</Link></div> : <div className="cart-layout"><form className="summary-panel" onSubmit={placeOrder}><h3>Delivery information</h3><div className="field"><label htmlFor="name">Full name</label><input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your full name"/></div><div className="form-grid"><div className="field"><label htmlFor="phone">Mobile number</label><input id="phone" name="phone" required minLength={7} maxLength={30} autoComplete="tel" placeholder="09XX XXX XXXX"/></div><div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/></div></div><div className="field"><label htmlFor="address">Complete delivery address</label><textarea id="address" name="address" required minLength={8} maxLength={1000} autoComplete="street-address" placeholder="House number, street, barangay, city, province"/></div><div className="field"><label htmlFor="payment">Payment method</label><select id="payment" name="payment" defaultValue="cod"><option value="cod">Cash on delivery</option><option value="bank_transfer">Bank transfer (store will send instructions)</option></select></div><div className="notice">Shipping is not included in the amount below. The store will confirm the delivery fee and payment instructions before dispatch. Payment gateway checkout is not set up yet.</div>{message && <p className="notice" role="alert">{message}</p>}<button className="button button-dark full-width" type="submit" disabled={submitting}>{submitting ? 'Placing order…' : 'Place order'}</button></form><aside className="summary-panel"><h3>Your order</h3>{items.map(({ product, quantity }) => <div className="summary-row" key={product.id}><span>{product.name} × {quantity}</span><strong>{peso(product.price * quantity)}</strong></div>)}<div className="summary-row summary-total"><span>Estimated subtotal</span><span>{peso(total)}</span></div><p className="muted" style={{fontSize:11}}>Final prices and stock are checked against the store database when you place the order.</p></aside></div>}</main>;
}
