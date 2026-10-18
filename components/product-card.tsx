'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { peso, type Product } from '@/lib/products';
export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  return <article className="product-card"><Link className="product-image" href={`/products/${product.slug}`}><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 20vw"/><span className="product-category">{product.category}</span>{product.badge && <span className="product-badge">{product.badge}</span>}</Link>
    <div className="product-info"><Link href={`/products/${product.slug}`} className="product-name">{product.name}</Link><div className="rating"><span>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={13} fill={i < Math.round(product.rating) ? 'currentColor' : 'none'}/>)}</span><small>({product.reviews})</small></div><strong className="price">{peso(product.price)}</strong><p className={product.stock > 0 ? 'stock stock-in' : 'stock'}><span/> {product.stock > 0 ? `In Stock · ${product.stock} available` : 'Out of stock'}</p><button className="button button-outline add-button" onClick={() => add(product)} disabled={product.stock < 1}><ShoppingCart size={15}/>{product.stock > 0 ? 'Add to Cart' : 'Sold Out'}</button></div>
  </article>;
}
