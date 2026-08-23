import { supabase, isSupabaseConfigured } from './supabase';
import { FALLBACK_PRODUCTS } from './fallback-products';
import type { Product } from '@/types';

/**
 * Revalidacion ISR del catalogo. El fetch de Supabase se cachea
 * a nivel de Data Cache de Next via `next: { revalidate }` en las
 * paginas que lo consumen (`export const revalidate = 3600`).
 */
export const CATALOG_REVALIDATE = 3600; // 1 h

const SELECT =
  'id, slug, nombre, descripcion, imagen_url, categoria, precios_por_variante, activo, orden';

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) return FALLBACK_PRODUCTS;

  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) {
    console.error('[products] supabase error:', error.message);
    return FALLBACK_PRODUCTS;
  }
  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured || !supabase) {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle();

  if (error) {
    console.error('[products] supabase error:', error.message);
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
  return (data as Product) ?? null;
}
