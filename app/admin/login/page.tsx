'use client';
import { useState } from 'react';
import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { supabase } from '@/lib/supabase';
export default function AdminLoginPage() {
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [message,setMessage]=useState(''); const [loading,setLoading]=useState(false);
 async function signIn(e:React.FormEvent){e.preventDefault();setMessage('');if(!supabase){setMessage('Supabase is not configured yet. Add the environment variables from .env.example.');return;}setLoading(true);const {error}=await supabase.auth.signInWithPassword({email,password});setLoading(false);if(error){setMessage(error.message);return;}window.location.href='/admin/products';}
 return <main className="page-wrap"><div className="admin-card"><div style={{display:'grid',placeItems:'center',marginBottom:15}}><LockKeyhole size={30}/></div><h1 className="page-title" style={{fontSize:27,textAlign:'center'}}>Admin login</h1><p className="muted" style={{textAlign:'center'}}>Sign in to manage your store.</p><form onSubmit={signIn}><div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@yourstore.com"/></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/></div>{message&&<p className="notice" role="alert">{message}</p>}<button className="button button-dark full-width" disabled={loading}>{loading?'Signing in...':'Login'}</button></form><p className="muted" style={{fontSize:10,marginTop:18}}>Create an admin user in Supabase Authentication first. Do not expose service-role keys in the browser.</p><Link href="/" className="admin-link">← Back to storefront</Link></div></main>
}
