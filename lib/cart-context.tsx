'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/products';

type CartItem = { product: Product; quantity: number };
type CartContextValue = { items: CartItem[]; add: (product: Product) => void; remove: (id: string) => void; setQuantity: (id: string, quantity: number) => void; clear: () => void; count: number; total: number };
const CartContext = createContext<CartContextValue | null>(null);
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { try { const saved = localStorage.getItem('threefold-market-cart'); if (saved) setItems(JSON.parse(saved)); } catch {} }, []);
  useEffect(() => { localStorage.setItem('threefold-market-cart', JSON.stringify(items)); }, [items]);
  const value = useMemo<CartContextValue>(() => ({
    items,
    add: (product) => setItems((old) => { const found = old.find((item) => item.product.id === product.id); if (found) return old.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item); return [...old, { product, quantity: 1 }]; }),
    remove: (id) => setItems((old) => old.filter((item) => item.product.id !== id)),
    setQuantity: (id, quantity) => setItems((old) => old.map((item) => item.product.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock)) } : item)),
    clear: () => setItems([]), count: items.reduce((sum, item) => sum + item.quantity, 0), total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used inside CartProvider'); return context; }
