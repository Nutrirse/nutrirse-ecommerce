import type { Product, Variant } from '@/types';

/**
 * Topes de cantidad por linea, segun la regla comercial B2B.
 *
 * Vive aparte de los componentes porque lo consumen tres lugares: el
 * selector del ProductModal, el stepper del CartDrawer y el store del
 * carrito. Si el tope viviera solo en la UI, sumar de a uno desde el modal
 * varias veces igual acumularia de mas en el carrito.
 */

/**
 * Maximo de bultos cerrados por linea. Arriba de 5 el precio deja de ser de
 * lista y se cotiza por volumen: para eso existe la variante "+5 bultos".
 */
export const MAX_BULTOS = 5;

/**
 * Tope de la presentacion base cuando el producto no publica bulto cerrado
 * (una sola presentacion en el catalogo). Sin bulto no hay con que calcular
 * el limite real, asi que se corta en un numero razonable.
 */
export const MAX_BASE_SIN_BULTO = 5;

/** El id de la presentacion base. Ojo: no siempre pesa 5 kg. */
const ID_BASE = '5kg';
/** El id del bulto cerrado. */
const ID_BULTO = 'bolsa';

/**
 * Cantidad maxima de una variante en una misma linea.
 *
 * Reglas:
 *
 * - `mayorista` (tipo `consultar`): sin tope. El precio se arma por
 *   WhatsApp, no hay estructura de bulto que romper.
 * - `bolsa`: {@link MAX_BULTOS}.
 * - `5kg`: la mayor cantidad cuyo peso total sea **estrictamente menor** al
 *   del bulto cerrado. Apenas empatarlo conviene comprar el bulto, y esa es
 *   la decision que la UI tiene que forzar.
 *
 *   Se calcula con `ceil(bulto / base) - 1`, no con `floor`: con un bulto de
 *   10 kg y base de 5 kg, `floor` daria 2 (= 10 kg, empata el bulto) y la
 *   respuesta correcta es 1. Con bulto de 22,68 kg da 4 (20 kg < 22,68).
 *
 * `peso_kg` de la base no es siempre 5: cuando el Excel no trae la fila de
 * 5 kg, la migracion usa la presentacion mas chica (2 kg, un pack). Por eso
 * se divide por el peso real de la variante y no por la constante 5.
 */
export function maxCantidad(product: Product, variant: Variant): number {
  if (variant.tipo === 'consultar') return Infinity;
  if (variant.id === ID_BULTO) return MAX_BULTOS;
  if (variant.id !== ID_BASE) return MAX_BASE_SIN_BULTO;

  const bulto = product.precios_por_variante.find((v) => v.id === ID_BULTO);
  if (!bulto || !(bulto.peso_kg > 0) || !(variant.peso_kg > 0)) {
    return MAX_BASE_SIN_BULTO;
  }

  const tope = Math.ceil(bulto.peso_kg / variant.peso_kg) - 1;
  // Si el bulto pesa igual o menos que la base, el tope daria 0: nunca se
  // deja una linea en cero, se permite al menos una unidad.
  return Math.max(1, tope);
}

/**
 * Texto que explica por que se corto el contador. Es lo unico que le dice al
 * usuario adonde ir, asi que cambia segun el motivo del tope.
 */
export function motivoTope(product: Product, variant: Variant): string {
  if (variant.id === ID_BULTO) {
    const consultar = product.precios_por_variante.find((v) => v.tipo === 'consultar');
    return `Para más de ${MAX_BULTOS} bultos, elegí la opción "${
      consultar?.label ?? '+5 bultos (Consultar)'
    }".`;
  }

  const bulto = product.precios_por_variante.find((v) => v.id === ID_BULTO);
  if (variant.id === ID_BASE && bulto) {
    return `A partir de acá conviene el bulto cerrado: elegí "${bulto.label}".`;
  }

  return `Máximo ${MAX_BASE_SIN_BULTO} unidades por pedido. Consultanos por WhatsApp para más volumen.`;
}
