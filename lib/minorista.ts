import { getProducts } from './products';
import { supabaseAdmin } from './supabase-admin';
import type { Product, Variant } from '@/types';

/**
 * Presentacion de los productos que todavia no tienen fila en
 * `precios_minoristas`: se listan igual (el catalogo no puede quedar vacio
 * porque falte cargar un precio) y se cotizan por WhatsApp.
 */
const CONSULTAR: Variant = {
  id: 'min-consultar',
  label: 'Consultar',
  tipo: 'consultar',
  precio: null,
  peso_kg: 1,
};

/**
 * Catalogo del canal minorista (B2C): productos activos con
 * `visible_minorista`, cada uno
 * con sus variantes de `precios_minoristas` o, si no tiene, "Consultar".
 *
 * Precios PUBLICOS: se devuelven con o sin sesion (regla de negocio del
 * canal B2C). Lo que no puede viajar nunca es el precio mayorista: por eso
 * `precios_por_variante` de products se REEMPLAZA entero, nunca se mezcla.
 * Un producto sin fila minorista cae en CONSULTAR (precio null), no en sus
 * variantes por bulto.
 *
 * `precios_minoristas` se sigue leyendo con service_role: la RLS de la
 * tabla (solo authenticated) queda igual, asi nadie la baja entera con la
 * anon key por la API REST; el precio le llega a la web filtrado por aca.
 * Si la key falta o la consulta falla, se sigue con la lista de productos:
 * nunca se devuelve vacio por un problema de precios.
 * Solo servidor (supabase-admin explota en el navegador).
 */
export async function getCatalogoMinorista(): Promise<Product[]> {
  const [products, filas] = await Promise.all([getProducts('minorista'), leerPreciosMinoristas()]);

  return products.map((p) => {
    const variantes = filas.get(p.id);
    return { ...p, precios_por_variante: variantes?.length ? variantes : [CONSULTAR] };
  });
}

async function leerPreciosMinoristas(): Promise<Map<string, Variant[]>> {
  if (!supabaseAdmin) {
    console.error('[minorista] falta SUPABASE_SERVICE_ROLE_KEY: se listan los productos sin precio.');
    return new Map();
  }
  const { data, error } = await supabaseAdmin.from('precios_minoristas').select('product_id, variantes');
  if (error) {
    console.error('[minorista] supabase error:', error.message);
    return new Map();
  }
  return new Map((data ?? []).map((r) => [r.product_id as string, (r.variantes ?? []) as Variant[]]));
}
