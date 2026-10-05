import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { supabaseAdmin } from './supabase-admin';
import { FALLBACK_PRODUCTS } from './fallback-products';
import type { Product } from '@/types';

/*
 * SOLO SERVIDOR (importa supabase-admin, que explota en el navegador).
 *
 * Los precios (`precios_por_variante`) no son legibles con la anon key:
 * supabase/seguridad_precios.sql le quita esa columna a anon y
 * authenticated. Por eso el catalogo se lee con service_role. Ojo: este
 * modulo devuelve SIEMPRE los precios mayoristas; quien decide si llegan a
 * la UI es lib/catalogo.ts (null sin sesion) o lib/minorista.ts (los
 * reemplaza por los minoristas). No llamar a getProducts() desde una
 * pagina sin pasar por ahi.
 */

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

const COLUMNAS_PUBLICAS =
  'id, slug, nombre, descripcion, composicion, nota_venta, imagen_url, imagenes, categoria, activo, orden';
const SELECT_CON_PRECIOS = `${COLUMNAS_PUBLICAS}, precios_por_variante`;

/**
 * Cliente y columnas para leer el catalogo.
 *
 * - Con service_role: todas las columnas. service_role ignora RLS, asi que
 *   el filtro `activo = true` de la policy publica lo pone cada consulta.
 * - Sin service_role (entorno mal configurado): anon, sin la columna de
 *   precios (pedirla con anon daria "permission denied"). El catalogo se ve
 *   igual, con "Precio a Consultar"; mejor eso que caerse o mostrar el
 *   fallback estatico.
 */
function lector(): { db: SupabaseClient; select: string; conPrecios: boolean } | null {
  if (supabaseAdmin) return { db: supabaseAdmin, select: SELECT_CON_PRECIOS, conPrecios: true };
  if (isSupabaseConfigured && supabase) {
    console.error('[products] falta SUPABASE_SERVICE_ROLE_KEY: catalogo sin precios.');
    return { db: supabase, select: COLUMNAS_PUBLICAS, conPrecios: false };
  }
  return null;
}

/** Fila leida sin la columna de precios: variantes vacias, nunca undefined. */
const completar = (fila: Product, conPrecios: boolean): Product =>
  normalizar(conPrecios ? fila : { ...fila, precios_por_variante: [] });

export async function getProducts(): Promise<Product[]> {
  const l = lector();
  if (!l) return FALLBACK_PRODUCTS.map(normalizar);

  const { data, error } = await l.db
    .from('products')
    .select(l.select)
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) {
    console.error('[products] supabase error:', error.message);
    return FALLBACK_PRODUCTS.map(normalizar);
  }
  return ((data ?? []) as unknown as Product[]).map((p) => completar(p, l.conPrecios));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const l = lector();
  if (!l) {
    const local = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
    return local ? normalizar(local) : null;
  }

  const { data, error } = await l.db
    .from('products')
    .select(l.select)
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle();

  if (error) {
    console.error('[products] supabase error:', error.message);
    const local = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
    return local ? normalizar(local) : null;
  }
  return data ? completar(data as unknown as Product, l.conPrecios) : null;
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
