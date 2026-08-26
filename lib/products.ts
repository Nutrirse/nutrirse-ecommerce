import { supabase, isSupabaseConfigured } from './supabase';
import { FALLBACK_PRODUCTS } from './fallback-products';
import type { Product } from '@/types';

/**
 * Revalidacion ISR del catalogo. El fetch de Supabase se cachea
 * a nivel de Data Cache de Next via `next: { revalidate }` en las
 * paginas que lo consumen (`export const revalidate = 3600`).
 */
export const CATALOG_REVALIDATE = 3600; // 1 h

/**
 * Nomenclatura vieja -> nueva. Se aplica al leer, no en la base: las filas
 * ya cargadas siguen sirviendo y el carrito, el ticket de WhatsApp y la UI
 * ven todos la misma etiqueta.
 */
const ALIAS_VARIANTE: Record<string, string> = {
  'Bolsa cerrada': 'Bulto Cerrado',
  'Bolsa Cerrada': 'Bulto Cerrado',
  'Más de 5 bolsas (Consultar)': '+5 bultos (Consultar)',
  'Mas de 5 bolsas (Consultar)': '+5 bultos (Consultar)',
};

function normalizar(p: Product): Product {
  return {
    ...p,
    precios_por_variante: (p.precios_por_variante ?? []).map((v) => ({
      ...v,
      label: ALIAS_VARIANTE[v.label] ?? v.label,
    })),
  };
}

const SELECT =
  'id, slug, nombre, descripcion, imagen_url, categoria, precios_por_variante, activo, orden';

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) return FALLBACK_PRODUCTS.map(normalizar);

  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) {
    console.error('[products] supabase error:', error.message);
    return FALLBACK_PRODUCTS.map(normalizar);
  }
  return ((data ?? []) as Product[]).map(normalizar);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured || !supabase) {
    const local = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
    return local ? normalizar(local) : null;
  }

  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle();

  if (error) {
    console.error('[products] supabase error:', error.message);
    const local = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
    return local ? normalizar(local) : null;
  }
  return data ? normalizar(data as Product) : null;
}

/**
 * Categorias con producto activo, y cuando se toco cada una por ultima vez.
 * Lo consume el sitemap: `lastModified` real le dice a Google que vuelva a
 * pasar cuando cambio un precio, en vez de poner la fecha de hoy siempre
 * (una fecha que siempre cambia es ruido y termina ignorandose).
 */
export type CategoriaSitemap = { categoria: string; lastModified: Date };

export async function getCategoriasParaSitemap(): Promise<CategoriaSitemap[]> {
  type Fila = { categoria: string | null; updated_at?: string | null };

  let filas: Fila[];

  if (!isSupabaseConfigured || !supabase) {
    filas = FALLBACK_PRODUCTS.map((p) => ({ categoria: p.categoria }));
  } else {
    const { data, error } = await supabase
      .from('products')
      .select('categoria, updated_at')
      .eq('activo', true);

    if (error) {
      console.error('[products] supabase error:', error.message);
      filas = FALLBACK_PRODUCTS.map((p) => ({ categoria: p.categoria }));
    } else {
      filas = (data ?? []) as Fila[];
    }
  }

  const porCategoria = new Map<string, Date>();
  for (const f of filas) {
    if (!f.categoria) continue;
    const fecha = f.updated_at ? new Date(f.updated_at) : new Date();
    const previa = porCategoria.get(f.categoria);
    if (!previa || fecha > previa) porCategoria.set(f.categoria, fecha);
  }

  return [...porCategoria.entries()]
    .map(([categoria, lastModified]) => ({ categoria, lastModified }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria));
}
