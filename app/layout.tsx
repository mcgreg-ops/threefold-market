import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart-context';
import { StoreHeader } from '@/components/store-header';
import { Mountain } from 'lucide-react';
import Link from 'next/link';
export const metadata: Metadata = { title: 'Threefold Market | A Family Marketplace', description: 'Shop mountain bikes, bike accessories, home essentials, tiny pockets, apparel, and outdoor gear in the Philippines.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body><CartProvider><StoreHeader/>{children}<footer className="site-footer" id="contact"><div className="footer-grid"><div className="footer-brand"><Link href="/" className="brand brand-light"><span className="brand-mark"><Mountain size={27}/></span><span><strong>Threefold Market</strong><small>THREE PEOPLE · ONE PLACE TO SHOP</small></span></Link><p>Three people, one place to discover great finds for everyday life.</p></div><div><h4>Quick Links</h4><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/#categories">Categories</Link><Link href="/#about">About Us</Link></div><div><h4>Customer Care</h4><p>Shipping fee and payment details are confirmed by the store after you place an order.</p><Link href="/admin/login">Store admin</Link></div><div><h4>Payment methods</h4><p>Payment and delivery details are confirmed by the store.</p><div className="payment-tags"><span>Cash on delivery</span><span>Bank transfer</span></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Threefold Market. All rights reserved.</span><span>Shipping fee confirmed before dispatch.</span></div></footer></CartProvider></body></html>
}
