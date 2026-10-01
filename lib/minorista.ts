import { getProducts } from './products';
import { supabaseAdmin } from './supabase-admin';
import type { Product, Variant } from '@/types';

/**
 * Catalogo del canal minorista (B2C).
 *
 * Solo entran los productos con fila en `precios_minoristas`, y cada uno
 * reemplaza sus variantes mayoristas por las minoristas. Sin sesion los
 * precios salen en null DESDE EL SERVIDOR: ocultarlos solo en la UI no
 * sirve, porque igual viajarian en el payload de React y se verian con
 * "ver codigo fuente".
 *
 * Lee con service_role porque los anonimos tambien necesitan ver que
 * productos y presentaciones hay. Solo servidor (supabase-admin explota en
 * el navegador).
 */
export async function getCatalogoMinorista({ conPrecios }: { conPrecios: boolean }): Promise<Product[]> {
  if (!supabaseAdmin) return [];

  const [products, { data, error }] = await Promise.all([
    getProducts(),
    supabaseAdmin.from('precios_minoristas').select('product_id, variantes'),
  ]);

  if (error) {
    console.error('[minorista] supabase error:', error.message);
    return [];
  }

  const porProducto = new Map(
    (data ?? []).map((r) => [r.product_id as string, (r.variantes ?? []) as Variant[]])
  );

  return products.flatMap((p) => {
    const variantes = porProducto.get(p.id);
    if (!variantes?.length) return [];
    return [
      {
        ...p,
        precios_por_variante: variantes.map((v) => (conPrecios ? v : { ...v, precio: null })),
      },
    ];
  });
}
