'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/products';
import { supabase } from '@/lib/supabase';

type CartItem = { product: Product; quantity: number };
type CartContextValue = { items: CartItem[]; add: (product: Product) => void; remove: (id: string) => void; setQuantity: (id: string, quantity: number) => void; clear: () => void; refresh: () => Promise<{ changed: boolean; error: string | null }>; count: number; total: number };
const CartContext = createContext<CartContextValue | null>(null);
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [preserveStoredCart, setPreserveStoredCart] = useState(false);
  useEffect(() => {
    let active = true;
    async function restoreCart() {
      try {
        const stored = localStorage.getItem('threefold-market-cart');
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(parsed)) {
          if (active) { setItems([]); setHydrated(true); }
          return;
        }
        if (!supabase) {
          if (active) { setItems([]); setPreserveStoredCart(true); setHydrated(true); }
          return;
        }
        const saved = parsed.map((entry) => ({
          id: typeof entry?.id === 'string' ? entry.id : typeof entry?.product?.id === 'string' ? entry.product.id : '',
          quantity: Number(entry?.quantity),
        })).filter((entry) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.id) && Number.isInteger(entry.quantity) && entry.quantity > 0);
        if (!saved.length) {
          if (active) { setItems([]); setHydrated(true); }
          return;
        }
        const { data, error } = await supabase.from('products')
          .select('id,slug,name,category,price,stock,image_url,description')
          .in('id', saved.map((entry) => entry.id))
          .eq('is_active', true);
        if (!active) return;
        if (error) {
          setPreserveStoredCart(true);
          setHydrated(true);
          return;
        }
        const products = new Map((data ?? []).map((row) => [row.id, {
          id: row.id, slug: row.slug, name: row.name, category: row.category,
          price: Number(row.price), stock: row.stock, image: row.image_url,
          description: row.description, rating: 0, reviews: 0,
        } satisfies Product] as const));
        setItems(saved.flatMap(({ id, quantity }) => {
          const product = products.get(id);
          return product && product.stock > 0 ? [{ product, quantity: Math.min(quantity, product.stock) }] : [];
        }));
        setHydrated(true);
      } catch {
        if (active) { setItems([]); setHydrated(true); }
      }
    }
    void restoreCart();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (hydrated && !preserveStoredCart) {
      try { localStorage.setItem('threefold-market-cart', JSON.stringify(items.map(({ product, quantity }) => ({ id: product.id, quantity })))); } catch {}
    }
  }, [items, hydrated, preserveStoredCart]);
  const value = useMemo<CartContextValue>(() => ({
    items,
    add: (product) => setItems((old) => { const found = old.find((item) => item.product.id === product.id); if (found) return old.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item); return [...old, { product, quantity: 1 }]; }),
    remove: (id) => setItems((old) => old.filter((item) => item.product.id !== id)),
    setQuantity: (id, quantity) => setItems((old) => old.map((item) => item.product.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock)) } : item)),
    clear: () => setItems([]),
    refresh: async () => {
      if (!supabase) return { changed: false, error: 'Store data is not configured.' };
      if (!items.length) return { changed: false, error: null };
      const { data, error } = await supabase.from('products')
        .select('id,slug,name,category,price,stock,image_url,description')
        .in('id', items.map(({ product }) => product.id))
        .eq('is_active', true);
      if (error) return { changed: false, error: error.message };
      const products = new Map((data ?? []).map((row) => [row.id, {
        id: row.id, slug: row.slug, name: row.name, category: row.category,
        price: Number(row.price), stock: row.stock, image: row.image_url,
        description: row.description, rating: 0, reviews: 0,
      } satisfies Product] as const));
      const refreshed = items.flatMap(({ product, quantity }) => {
        const current = products.get(product.id);
        return current && current.stock > 0 ? [{ product: current, quantity: Math.min(quantity, current.stock) }] : [];
      });
      const changed = JSON.stringify(items) !== JSON.stringify(refreshed);
      setItems(refreshed);
      return { changed, error: null };
    },
    count: items.reduce((sum, item) => sum + item.quantity, 0), total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used inside CartProvider'); return context; }
