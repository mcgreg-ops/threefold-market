export type Product = {
  id: string; slug: string; name: string; category: string; price: number;
  stock: number; rating: number; reviews: number; image: string | null; description: string;
};

export const peso = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount);
