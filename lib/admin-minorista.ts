import { PayloadError, validarVariantes } from './admin-products';
import type { Variant } from '@/types';

/**
 * Variantes del canal minorista. Misma validacion que las mayoristas, mas
 * dos reglas:
 *   - lista vacia = el producto sale del canal minorista (se borra la fila);
 *   - los ids llevan prefijo `min-`, para no chocar en el carrito con la
 *     variante mayorista del mismo producto (ver migracion_minorista.sql).
 */
export function validarVariantesMinoristas(v: unknown): Variant[] {
  if (Array.isArray(v) && v.length === 0) return [];
  return validarVariantes(v).map((x) => {
    if (x.tipo !== 'precio') {
      throw new PayloadError(`"${x.label}": en minorista todas las variantes llevan precio.`);
    }
    return { ...x, id: x.id.startsWith('min-') ? x.id : `min-${x.id}` };
  });
}

export type FilaMinorista = { product_id: string; variantes: Variant[]; updated_at: string };
