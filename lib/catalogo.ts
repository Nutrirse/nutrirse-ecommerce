import { getProducts } from './products';
import type { Product } from '@/types';

/**
 * Gating de precios. Regla por canal:
 * - Mayorista: sin sesion los precios se quitan EN EL SERVIDOR. Esconderlos
 *   solo en la tarjeta no alcanza, porque igual viajarian en el payload de
 *   React y se leerian con "ver codigo fuente".
 * - Minorista: precios publicos (lib/minorista.ts). Ese catalogo reemplaza
 *   las variantes por las de `precios_minoristas`, asi que el precio
 *   mayorista nunca viaja en ese canal.
 * La lista de productos se manda siempre completa.
 */
export function sinPrecios(products: Product[]): Product[] {
  return products.map((p) => ({
    ...p,
    precios_por_variante: p.precios_por_variante.map((v) => ({ ...v, precio: null })),
  }));
}

/** Catalogo mayorista (variantes por bulto). */
export async function getCatalogoMayorista({ conPrecios }: { conPrecios: boolean }): Promise<Product[]> {
  const products = await getProducts('mayorista');
  return conPrecios ? products : sinPrecios(products);
}
