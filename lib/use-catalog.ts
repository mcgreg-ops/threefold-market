'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/products';

export type CatalogCategory = { name: string; count: number; image: string | null };
type CatalogState = { products: Product[]; categories: CatalogCategory[]; loading: boolean; error: string | null };

const initialState: CatalogState = { products: [], categories: [], loading: true, error: null };

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogState>(initialState);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      if (!supabase) {
        if (active) setCatalog({ ...initialState, loading: false, error: 'Store data is not configured. Add the Supabase URL and publishable key to the app environment.' });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id,slug,name,category,price,stock,image_url,description')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!active) return;
        if (error) {
          setCatalog({ ...initialState, loading: false, error: `Could not load products: ${error.message}` });
          return;
        }

        const products: Product[] = (data ?? []).map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          category: row.category,
          price: Number(row.price),
          stock: row.stock,
          image: row.image_url,
          description: row.description,
          rating: 0,
          reviews: 0,
        }));
        const categoryMap = new Map<string, CatalogCategory>();
        for (const product of products) {
          const category = categoryMap.get(product.category);
          if (category) category.count += 1;
          else categoryMap.set(product.category, { name: product.category, count: 1, image: product.image });
        }
        setCatalog({ products, categories: [...categoryMap.values()], loading: false, error: null });
      } catch {
        if (active) setCatalog({ ...initialState, loading: false, error: 'Could not reach Supabase. Check the app configuration and connection.' });
      }
    }

    void loadCatalog();
    return () => { active = false; };
  }, []);

  return catalog;
}
