import { getProducts } from './products';
import type { Product } from '@/types';

/**
 * Gating de precios, comun a los dos canales. Sin sesion los precios se
 * quitan EN EL SERVIDOR: esconderlos solo en la tarjeta no alcanza, porque
 * igual viajarian en el payload de React y se leerian con "ver codigo
 * fuente". La lista de productos se manda siempre completa.
 */
export function sinPrecios(products: Product[]): Product[] {
  return products.map((p) => ({
    ...p,
    precios_por_variante: p.precios_por_variante.map((v) => ({ ...v, precio: null })),
  }));
}

/** Catalogo mayorista (variantes por bulto). */
export async function getCatalogoMayorista({ conPrecios }: { conPrecios: boolean }): Promise<Product[]> {
  const products = await getProducts();
  return conPrecios ? products : sinPrecios(products);
}
