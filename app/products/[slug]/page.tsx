'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Star } from 'lucide-react';
import { products, peso } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
export default function ProductPage() {
 const params = useParams<{slug:string}>(); const product = products.find((p)=>p.slug===params.slug); const {add}=useCart();
 if(!product) return <main className="page-wrap"><h1>Product not found</h1><Link href="/" className="text-link">Return to shop</Link></main>;
 return <main className="page-wrap"><Link href="/#products" className="text-link"><ArrowLeft size={15}/> Back to shop</Link><div className="detail-layout" style={{marginTop:25}}><div className="detail-image"><Image src={product.image} alt={product.name} fill priority sizes="(max-width:760px) 90vw, 50vw"/></div><div className="detail-copy"><span className="eyebrow">{product.category.toUpperCase()}</span><h1>{product.name}</h1><div className="rating"><span>{Array.from({length:5},(_,i)=><Star key={i} size={15} fill={i<Math.round(product.rating)?'currentColor':'none'}/>)}</span><small>{product.rating} · {product.reviews} demo reviews</small></div><strong className="price">{peso(product.price)}</strong><p>{product.description}</p><p className={product.stock>0?'stock stock-in':'stock'}><span/>{product.stock>0?`${product.stock} available`:'Out of stock'}</p><button className="button button-dark" onClick={()=>add(product)} disabled={product.stock<1}><ShoppingCart size={16}/> Add to Cart</button><p className="muted" style={{fontSize:11}}>Demo product data. Final availability is confirmed by the store before order processing.</p></div></div></main>
}
