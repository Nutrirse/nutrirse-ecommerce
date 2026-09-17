import type { Variant } from '@/types';

/**
 * Precio base (por kg o por unidad) de un producto.
 *
 * No es una columna de Supabase: el catalogo guarda un precio cerrado por
 * variante, porque el admin redondea a mano (39.750 -> 39.000) y ese
 * redondeo tiene que sobrevivir. El precio base existe solo como auxiliar de
 * carga: se deriva para mostrarlo y se usa para reescribir las variantes.
 *
 * Vive en `lib` porque lo consumen dos lugares con la misma matematica: la
 * calculadora del ProductoModal y la edicion inline de la grilla. Si cada
 * uno hiciera su propia cuenta, un cambio de criterio (redondeo, que
 * variantes se saltean) quedaria aplicado en uno solo.
 */

/** Una variante sirve para la cuenta si lleva precio y tiene peso util. */
function calculable(v: Variant): boolean {
  return v.tipo !== 'consultar' && Number.isFinite(Number(v.peso_kg)) && Number(v.peso_kg) > 0;
}

/**
 * Deriva el precio base desde las variantes ya cargadas.
 *
 * Toma la variante **mas chica** con precio: es la que el admin carga
 * primero y la que menos sufre redondeos de volumen (un bulto suele venir
 * con descuento, asi que dividirlo daria un base mas bajo que el real).
 *
 * Devuelve `null` cuando no hay ninguna variante utilizable (producto solo a
 * consultar, o sin precios todavia): el input queda vacio en vez de mostrar
 * un 0 que al guardarse borraria los precios.
 */
export function derivarPrecioBase(variantes: Variant[]): number | null {
  const utiles = variantes.filter((v) => calculable(v) && Number(v.precio) > 0);
  if (utiles.length === 0) return null;

  const chica = utiles.reduce((min, v) => (Number(v.peso_kg) < Number(min.peso_kg) ? v : min));
  return Math.round(Number(chica.precio) / Number(chica.peso_kg));
}

/**
 * Reescribe el precio de cada variante como `base * peso_kg`.
 *
 * Se saltean las `consultar` (su precio tiene que quedar en `null`, el
 * endpoint rechaza un numero) y las que no tienen peso util, para no pisar
 * un precio ya cargado con un 0.
 */
export function aplicarPrecioBase(variantes: Variant[], base: number): Variant[] {
  if (!Number.isFinite(base) || base <= 0) return variantes;
  return variantes.map((v) =>
    calculable(v) ? { ...v, precio: Math.round(base * Number(v.peso_kg)) } : v
  );
}

/** Cuantas variantes tocaria {@link aplicarPrecioBase}. Sirve para avisarlo. */
export function alcanzadasPorPrecioBase(variantes: Variant[]): number {
  return variantes.filter(calculable).length;
}
