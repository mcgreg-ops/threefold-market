export type Product = {
  id: string; slug: string; name: string; category: string; price: number;
  stock: number; rating: number; reviews: number; image: string; description: string; badge?: string;
};

// Demo catalog. Replace with Supabase queries when the database is configured.
export const categories = [
  { name: 'Mountain Bikes', count: 12, image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=500&q=85' },
  { name: 'Bike Gear & Parts', count: 68, image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=500&q=85' },
  { name: 'Home Accessories', count: 42, image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=500&q=85' },
  { name: 'Tiny Pockets', count: 28, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=85' },
  { name: 'Apparel', count: 16, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=85' },
  { name: 'Outdoor & Camping', count: 14, image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=500&q=85' },
  { name: 'Lifestyle & Gifts', count: 20, image: 'https://images.unsplash.com/photo-1514228742587-6b1558f38990?auto=format&fit=crop&w=500&q=85' },
];

export const products: Product[] = [
  { id: 'p1', slug: 'trail-mountain-bike', name: 'Trail Mountain Bike', category: 'Mountain Bikes', price: 18500, stock: 5, rating: 4.9, reviews: 12, image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=500&q=85', description: 'A versatile trail bike for weekend rides, rough paths, and everyday adventure.', badge: 'Bestseller' },
  { id: 'p2', slug: 'speedframe-helmet', name: 'Speedframe Helmet', category: 'Bike Gear & Parts', price: 4250, stock: 8, rating: 4.8, reviews: 8, image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=500&q=85', description: 'A lightweight cycling helmet designed for comfort and confidence on the trail.' },
  { id: 'p3', slug: 'tactical-edc-pouch', name: 'Tactical EDC Pouch', category: 'Tiny Pockets', price: 450, stock: 20, rating: 4.8, reviews: 15, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=85', description: 'A compact everyday pouch for keeping small essentials organized.', badge: 'Popular' },
  { id: 'p4', slug: 'ceramic-plant-pot', name: 'Ceramic Plant Pot', category: 'Home Accessories', price: 350, stock: 12, rating: 4.6, reviews: 7, image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=500&q=85', description: 'A simple ceramic planter that adds a natural touch to desks and shelves.' },
  { id: 'p5', slug: 'folding-camping-chair', name: 'Folding Camping Chair', category: 'Outdoor & Camping', price: 1250, stock: 10, rating: 4.7, reviews: 6, image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=500&q=85', description: 'A portable folding chair for camping, picnics, and outdoor weekends.' },
  { id: 'p6', slug: 'everyday-cotton-tee', name: 'Everyday Cotton Tee', category: 'Apparel', price: 590, stock: 15, rating: 4.5, reviews: 12, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=85', description: 'A comfortable everyday T-shirt with a clean, easy-to-style fit.' },
  { id: 'p7', slug: 'travel-insulated-mug', name: 'Travel Insulated Mug', category: 'Lifestyle & Gifts', price: 480, stock: 18, rating: 4.6, reviews: 9, image: 'https://images.unsplash.com/photo-1514228742587-6b1558f38990?auto=format&fit=crop&w=500&q=85', description: 'A reusable travel mug for coffee, tea, and daily commutes.' },
  { id: 'p8', slug: 'flat-bike-pedals', name: 'Flat Bike Pedals', category: 'Bike Gear & Parts', price: 850, stock: 20, rating: 4.7, reviews: 9, image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=500&q=85', description: 'Durable flat pedals for grip and control on everyday rides.' },
];

export const peso = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount);
