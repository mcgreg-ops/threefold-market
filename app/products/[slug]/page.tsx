'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Star } from 'lucide-react';
import { peso } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
import { useCatalog } from '@/lib/use-catalog';
export default function ProductPage() {
 const params = useParams<{slug:string}>(); const {products,loading,error}=useCatalog(); const product = products.find((p)=>p.slug===params.slug); const {add}=useCart();
 if(loading) return <main className="page-wrap"><p className="muted">Loading product…</p></main>;
 if(error) return <main className="page-wrap"><div className="notice" role="alert">{error}</div><Link href="/shop" className="text-link">Return to shop</Link></main>;
 if(!product) return <main className="page-wrap"><h1>Product not found</h1><Link href="/shop" className="text-link">Return to shop</Link></main>;
 return <main className="page-wrap"><Link href="/shop" className="text-link"><ArrowLeft size={15}/> Back to shop</Link><div className="detail-layout" style={{marginTop:25}}><div className="detail-image">{product.image&&<Image src={product.image} alt={product.name} fill priority sizes="(max-width:760px) 90vw, 50vw" unoptimized/>}</div><div className="detail-copy"><span className="eyebrow">{product.category.toUpperCase()}</span><h1>{product.name}</h1>{product.reviews>0&&<div className="rating"><span>{Array.from({length:5},(_,i)=><Star key={i} size={15} fill={i<Math.round(product.rating)?'currentColor':'none'}/>)}</span><small>{product.rating} · {product.reviews} reviews</small></div>}<strong className="price">{peso(product.price)}</strong><p>{product.description}</p><p className={product.stock>0?'stock stock-in':'stock'}><span/>{product.stock>0?`${product.stock} available`:'Out of stock'}</p><button className="button button-dark" onClick={()=>add(product)} disabled={product.stock<1}><ShoppingCart size={16}/> Add to Cart</button></div></div></main>
}
