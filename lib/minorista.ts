import { getProducts } from './products';
import { sinPrecios } from './catalogo';
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
 * Catalogo del canal minorista (B2C): todos los productos activos, cada uno
 * con sus variantes de `precios_minoristas` o, si no tiene, "Consultar".
 *
 * `precios_minoristas` se lee con service_role (RLS solo deja leerla a
 * usuarios logueados). Si la key falta o la consulta falla, se sigue con
 * la lista de productos: nunca se devuelve vacio por un problema de precios.
 * Solo servidor (supabase-admin explota en el navegador).
 */
export async function getCatalogoMinorista({ conPrecios }: { conPrecios: boolean }): Promise<Product[]> {
  const [products, filas] = await Promise.all([getProducts(), leerPreciosMinoristas()]);

  const conVariantes = products.map((p) => {
    const variantes = filas.get(p.id);
    return { ...p, precios_por_variante: variantes?.length ? variantes : [CONSULTAR] };
  });

  return conPrecios ? conVariantes : sinPrecios(conVariantes);
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
