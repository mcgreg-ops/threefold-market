'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { peso } from '@/lib/products';
import { LogOut } from 'lucide-react';

type OrderItem = { id: string; order_id: string; product_name: string; unit_price: number; quantity: number; line_total: number };
type StoreOrder = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  preferred_courier: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  items: OrderItem[];
};
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [status, setStatus] = useState('Loading orders…');
  const [authorized, setAuthorized] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadOrders() {
    const client = supabase;
    if (!client) return;
    const { data, error } = await client.from('orders')
      .select('id,order_number,customer_name,customer_email,customer_phone,shipping_address,preferred_courier,subtotal,shipping_fee,total,payment_method,payment_status,order_status,created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setStatus(`Could not load orders: ${error.message}`);
      return;
    }
    const orderRows = (data ?? []) as Omit<StoreOrder, 'items'>[];
    const itemResults = await Promise.all(orderRows.map(async (order) => {
      const result = await client.from('order_items').select('id,order_id,product_name,unit_price,quantity,line_total').eq('order_id', order.id);
      return { orderId: order.id, data: result.data, error: result.error };
    }));
    const itemError = itemResults.find((result) => result.error)?.error;
    if (itemError) {
      setStatus(`Could not load order items: ${itemError.message}`);
      return;
    }
    const itemsByOrder = new Map(itemResults.map((result) => [result.orderId, result.data ?? []] as const));
    setOrders(orderRows.map((order) => ({ ...order, items: (itemsByOrder.get(order.id) ?? []) as OrderItem[] })));
    setStatus(`${orderRows.length} order${orderRows.length === 1 ? '' : 's'} loaded.`);
  }

  useEffect(() => {
    let active = true;
    async function authorize() {
      if (!supabase) {
        setStatus('Supabase is not configured. Add the app environment variables to load live data.');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/admin/login';
        return;
      }
      const { data, error } = await supabase.rpc('is_store_admin');
      if (!active) return;
      if (error) {
        setStatus('Run supabase/002_store_security_and_checkout.sql and add your account to store_admins to enable order management.');
        return;
      }
      if (!data) {
        setStatus('This account is signed in but is not authorized to manage the store.');
        return;
      }
      setAuthorized(true);
      await loadOrders();
    }
    void authorize();
    return () => { active = false; };
  }, []);

  async function saveStatus(order: StoreOrder, form: HTMLFormElement) {
    if (!supabase) return;
    const formData = new FormData(form);
    setSavingId(order.id);
    const { error } = await supabase.rpc('set_order_status', {
      p_order_id: order.id,
      p_order_status: String(formData.get('order_status')),
      p_payment_status: String(formData.get('payment_status')),
    });
    setSavingId(null);
    if (error) {
      setStatus(`Could not update order #${order.order_number}: ${error.message}`);
      return;
    }
    await loadOrders();
    setStatus(`Order #${order.order_number} updated.`);
  }

  async function saveShippingFee(order: StoreOrder, form: HTMLFormElement) {
    if (!supabase) return;
    const fee = Number(new FormData(form).get('shipping_fee'));
    setSavingId(order.id);
    const { error } = await supabase.rpc('set_order_shipping_fee', { p_order_id: order.id, p_shipping_fee: fee });
    setSavingId(null);
    if (error) {
      setStatus(`Could not update shipping for order #${order.order_number}: ${error.message}`);
      return;
    }
    await loadOrders();
    setStatus(`Shipping fee and total updated for order #${order.order_number}.`);
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = '/admin/login';
  }

  return <main className="page-wrap"><div className="section-heading"><div><span className="eyebrow">STORE MANAGEMENT</span><h1 className="page-title">Orders</h1></div><button className="button button-outline" onClick={logout}><LogOut size={15}/> Log out</button></div><p className="muted" role="status">{status}</p>
    {authorized && (orders.length ? <div style={{display:'grid',gap:16}}>{orders.map((order) => <article className="summary-panel" key={order.id}>
      <div className="section-heading"><div><h2>Order #{order.order_number}</h2><span className="muted">{new Date(order.created_at).toLocaleString()}</span></div><strong>{peso(Number(order.total))}</strong></div>
      <div className="form-grid"><div><h3>Customer</h3><p>{order.customer_name}<br/><a href={`mailto:${order.customer_email}`}>{order.customer_email}</a><br/><a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a></p><p>{order.shipping_address}</p><p><strong>Preferred courier:</strong> {order.preferred_courier || 'No preference provided'}</p></div><div><h3>Payment</h3><p>{order.payment_method.replace('_', ' ')} · {order.payment_status}</p><p>Items: {peso(Number(order.subtotal))}<br/>Shipping: {Number(order.shipping_fee) ? peso(Number(order.shipping_fee)) : 'To be confirmed'}</p><form className="form-grid" onSubmit={(event) => { event.preventDefault(); void saveShippingFee(order, event.currentTarget); }}><div className="field"><label htmlFor={`shipping-fee-${order.id}`}>Shipping fee (PHP)</label><input id={`shipping-fee-${order.id}`} name="shipping_fee" type="number" min="0" max="100000" step="0.01" defaultValue={Number(order.shipping_fee)} disabled={['delivered', 'cancelled'].includes(order.order_status)} required/></div><button className="button button-outline" type="submit" disabled={savingId === order.id || ['delivered', 'cancelled'].includes(order.order_status)}>{savingId === order.id ? 'Saving…' : 'Update shipping'}</button></form></div></div>
      <h3>Items</h3>{order.items.map((item) => <div className="summary-row" key={item.id}><span>{item.product_name} × {item.quantity} ({peso(Number(item.unit_price))} each)</span><strong>{peso(Number(item.line_total))}</strong></div>)}
      <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void saveStatus(order, event.currentTarget); }}><div className="field"><label htmlFor={`order-status-${order.id}`}>Order status</label><select id={`order-status-${order.id}`} name="order_status" defaultValue={order.order_status} disabled={order.order_status === 'cancelled'}>{orderStatuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></div><div className="field"><label htmlFor={`payment-status-${order.id}`}>Payment status (verify before marking paid)</label><select id={`payment-status-${order.id}`} name="payment_status" defaultValue={order.payment_status} disabled={order.order_status === 'cancelled'}>{paymentStatuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></div><button className="button button-dark" type="submit" disabled={savingId === order.id || order.order_status === 'cancelled'}>{savingId === order.id ? 'Saving…' : 'Update order'}</button></form>
    </article>)}</div> : <div className="empty-state"><h2>No orders yet</h2><p className="muted">Orders placed through checkout will appear here.</p></div>)}
    <Link href="/admin/products" className="admin-link">← Back to products</Link>
  </main>;
}
