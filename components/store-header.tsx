'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Search, ShoppingCart, UserRound, Mountain, Menu, X } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
export function StoreHeader() {
  const { count } = useCart(); const [menuOpen, setMenuOpen] = useState(false); const [search, setSearch] = useState('');
  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="brand"><span className="brand-mark"><Mountain size={27}/></span><span><strong>Threefold Market</strong><small>THREE PEOPLE · ONE PLACE TO SHOP</small></span></Link>
    <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X/> : <Menu/>}</button>
    <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'}><Link href="/">Home</Link><Link href="/#products">Shop</Link><Link href="/#categories">Categories</Link><Link href="/#about">About</Link><Link href="/#contact">Contact</Link></nav>
    <form className="search-box" action="/shop" method="get"><input aria-label="Search products" name="q" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}/><button aria-label="Search"><Search size={18}/></button></form>
    <Link href="/admin/login" className="icon-button account-button" aria-label="Admin login"><UserRound size={21}/></Link><Link href="/cart" className="icon-button cart-button" aria-label={`Cart with ${count} items`}><ShoppingCart size={21}/>{count > 0 && <span className="cart-count">{count}</span>}</Link>
  </div></header>;
}
