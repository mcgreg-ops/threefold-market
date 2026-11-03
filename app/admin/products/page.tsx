'use client';

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { peso } from '@/lib/products';
import { LogOut, Package, Plus, Save, X } from 'lucide-react';

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
};
type ProductForm = Omit<AdminProduct, 'id' | 'image_url' | 'is_active'>;
const emptyForm: ProductForm = { slug: '', name: '', price: 0, stock: 0, category: '', description: '' };

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminProductsPage() {
  const [rows, setRows] = useState<AdminProduct[]>([]);
  const [status, setStatus] = useState('Loading store data…');
  const [authorized, setAuthorized] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    if (!supabase) {
      setStatus('Supabase is not configured. Add the app environment variables to load live data.');
      return;
    }
    const { data, error } = await supabase.from('products')
      .select('id,slug,name,price,stock,category,description,image_url,is_active')
      .order('created_at', { ascending: false });
    if (error) {
      setStatus(`Could not load products: ${error.message}`);
      return;
    }
    setRows((data ?? []) as AdminProduct[]);
    setStatus('Product catalog loaded.');
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
        setStatus('Run supabase/002_store_security_and_checkout.sql, then add your user to store_admins before using product management.');
        return;
      }
      if (!data) {
        setStatus('This account is signed in but is not authorized to manage the store.');
        return;
      }
      setAuthorized(true);
      await loadProducts();
    }
    void authorize();
    return () => { active = false; };
  }, []);

  function editProduct(product: AdminProduct) {
    setEditingId(product.id);
    setForm({ slug: product.slug, name: product.name, price: Number(product.price), stock: product.stock, category: product.category, description: product.description });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setStatus('Saving product…');
    let imageUrl = editingId ? rows.find((row) => row.id === editingId)?.image_url ?? null : null;

    if (imageFile) {
      const extension = imageFile.name.split('.').pop()?.toLowerCase() || 'image';
      const imagePath = `${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(imagePath, imageFile, { upsert: false, contentType: imageFile.type });
      if (uploadError) {
        setStatus(`Image upload failed: ${uploadError.message}`);
        setSaving(false);
        return;
      }
      imageUrl = supabase.storage.from('product-images').getPublicUrl(imagePath).data.publicUrl;
    }

    const productData = { ...form, slug: toSlug(form.slug || form.name), price: Number(form.price), stock: Number(form.stock), image_url: imageUrl, updated_at: new Date().toISOString() };
    const result = editingId
      ? await supabase.from('products').update(productData).eq('id', editingId)
      : await supabase.from('products').insert(productData);
    if (result.error) {
      setStatus(`Could not save product: ${result.error.message}`);
      setSaving(false);
      return;
    }
    resetForm();
    await loadProducts();
    setSaving(false);
    setStatus('Product saved.');
  }

  async function toggleActive(product: AdminProduct) {
    if (!supabase) return;
    const { error } = await supabase.from('products').update({ is_active: !product.is_active, updated_at: new Date().toISOString() }).eq('id', product.id);
    if (error) setStatus(`Could not update product: ${error.message}`);
    else await loadProducts();
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = '/admin/login';
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type))) {
      setStatus('Choose a JPG, PNG, WebP, or AVIF image under 5 MB.');
      event.target.value = '';
      setImageFile(null);
      return;
    }
    setImageFile(file);
  }

  return <main className="page-wrap">
    <div className="section-heading"><div><span className="eyebrow">STORE MANAGEMENT</span><h1 className="page-title">Products &amp; inventory</h1><Link href="/admin/orders" className="admin-link">Manage orders →</Link></div><button className="button button-outline" onClick={logout}><LogOut size={15}/> Log out</button></div>
    <p className="muted" role="status">{status}</p>
    {authorized && <>
      <form className="summary-panel" onSubmit={saveProduct}>
        <div className="section-heading"><h2>{editingId ? 'Edit product' : 'Add a product'}</h2>{editingId && <button type="button" className="button button-outline" onClick={resetForm}><X size={15}/> Cancel edit</button>}</div>
        <div className="form-grid">
          <div className="field"><label htmlFor="product-name">Product name</label><input id="product-name" required maxLength={160} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: editingId ? form.slug : toSlug(event.target.value) })}/></div>
          <div className="field"><label htmlFor="product-slug">URL slug</label><input id="product-slug" required maxLength={180} value={form.slug} onChange={(event) => setForm({ ...form, slug: toSlug(event.target.value) })}/></div>
          <div className="field"><label htmlFor="product-category">Category</label><input id="product-category" required maxLength={100} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}/></div>
          <div className="form-grid"><div className="field"><label htmlFor="product-price">Price (PHP)</label><input id="product-price" type="number" min="0" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}/></div><div className="field"><label htmlFor="product-stock">Stock</label><input id="product-stock" type="number" min="0" step="1" required value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })}/></div></div>
        </div>
        <div className="field"><label htmlFor="product-description">Description</label><textarea id="product-description" maxLength={5000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></div>
        <div className="field"><label htmlFor="product-image">Product image (JPG, PNG, WebP, AVIF; max 5 MB)</label><input id="product-image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={chooseImage}/></div>
        <button className="button button-dark" type="submit" disabled={saving}>{editingId ? <Save size={15}/> : <Plus size={15}/>}{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'}</button>
      </form>
      <div className="product-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))',margin:'25px 0'}}><div className="summary-panel"><Package/><p className="muted">Products</p><h2>{rows.length}</h2></div><div className="summary-panel"><Package/><p className="muted">Active products</p><h2>{rows.filter((product) => product.is_active).length}</h2></div><div className="summary-panel"><Package/><p className="muted">Units in stock</p><h2>{rows.reduce((sum, product) => sum + Number(product.stock || 0), 0)}</h2></div></div>
      <div style={{overflowX:'auto'}}><table className="simple-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.category}</td><td>{peso(Number(product.price))}</td><td>{product.stock}</td><td>{product.is_active ? 'Active' : 'Hidden'}</td><td><button className="button button-outline" onClick={() => editProduct(product)}>Edit</button> <button className="button button-outline" onClick={() => void toggleActive(product)}>{product.is_active ? 'Hide' : 'Publish'}</button></td></tr>)}</tbody></table></div>
      <p className="muted">Use the orders page to review customer orders and update fulfillment and payment status. Sales reporting is not included yet.</p>
    </>}
    <Link href="/" className="admin-link">← View storefront</Link>
  </main>;
}
