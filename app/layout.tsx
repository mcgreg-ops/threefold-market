import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart-context';
import { StoreHeader } from '@/components/store-header';
import { Mountain, Facebook, Instagram } from 'lucide-react';
import Link from 'next/link';
export const metadata: Metadata = { title: 'Threefold Market | A Family Marketplace', description: 'Shop mountain bikes, bike accessories, home essentials, tiny pockets, apparel, and outdoor gear in the Philippines.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body><CartProvider><StoreHeader/>{children}<footer className="site-footer" id="contact"><div className="footer-grid"><div className="footer-brand"><Link href="/" className="brand brand-light"><span className="brand-mark"><Mountain size={27}/></span><span><strong>Threefold Market</strong><small>THREE PEOPLE · ONE PLACE TO SHOP</small></span></Link><p>Three people, one place to discover great finds for everyday life.</p></div><div><h4>Quick Links</h4><Link href="/">Home</Link><Link href="/#products">Shop</Link><Link href="/#categories">Categories</Link><Link href="/#about">About Us</Link></div><div><h4>Customer Care</h4><Link href="/shipping">Shipping Information</Link><Link href="/returns">Returns &amp; Refunds</Link><Link href="/contact">Contact Us</Link><Link href="/admin/login">Admin Login</Link></div><div><h4>Follow Along</h4><div className="social-links"><a href="#contact" aria-label="Facebook"><Facebook/></a><a href="#contact" aria-label="Instagram"><Instagram/></a></div><p>Secure checkout with supported payment methods.</p><div className="payment-tags"><span>GCash*</span><span>VISA*</span></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Threefold Market. All rights reserved.</span><span>*Payment options depend on checkout setup.</span></div></footer></CartProvider></body></html>
}
