import type { Variant } from '@/types';

/**
 * Precio base (por kg o por unidad) de un producto, **por escala de peso**.
 *
 * No es una columna de Supabase: el catalogo guarda un precio cerrado por
 * variante, porque el admin redondea a mano (39.750 -> 39.000) y ese
 * redondeo tiene que sobrevivir. El precio base existe solo como auxiliar de
 * carga: se deriva para mostrarlo y se usa para reescribir las variantes.
 *
 * Hay **dos** precios base y no uno porque el negocio tiene precios
 * escalonados: el kilo fraccionado (5 kg) sale mas caro que el kilo del
 * bulto cerrado, que viene con descuento por volumen. Un unico multiplicador
 * pisaba las dos variantes con el mismo numero y rompia el margen de una de
 * las dos.
 *
 * Vive en `lib` porque lo consumen dos lugares con la misma matematica: la
 * calculadora del ProductoModal y la edicion inline de la grilla. Si cada
 * uno hiciera su propia cuenta, un cambio de criterio (redondeo, que
 * variantes se saltean) quedaria aplicado en uno solo.
 */

/** Las dos escalas de precio que maneja el negocio. */
export type EscalaPeso = 'fraccionado' | 'bulto';

/** Corte entre fraccionado y bulto, en kg. `<= 5` es fraccionado. */
const CORTE_KG = 5;

/** Una variante sirve para la cuenta si lleva precio y tiene peso util. */
function calculable(v: Variant): boolean {
  return v.tipo !== 'consultar' && Number.isFinite(Number(v.peso_kg)) && Number(v.peso_kg) > 0;
}

/**
 * A que escala pertenece una variante.
 *
 * El label manda sobre el peso porque es lo que el admin ve y lo que define
 * el precio comercial: un "Bulto x 25 kg" cargado sin peso, o un "5 kg"
 * cargado como 5.0 exacto, tienen que caer donde dice la etiqueta. Recien si
 * el label no dice nada se decide por `peso_kg`.
 */
export function escalaDe(v: Variant): EscalaPeso {
  const label = (v.label ?? '').toLowerCase();
  if (label.includes('bulto')) return 'bulto';
  if (/\b5\s*kg\b/.test(label)) return 'fraccionado';
  return Number(v.peso_kg) > CORTE_KG ? 'bulto' : 'fraccionado';
}

/** Variantes de una escala que entran en la cuenta. */
function utilesDe(variantes: Variant[], escala: EscalaPeso): Variant[] {
  return variantes.filter((v) => calculable(v) && escalaDe(v) === escala);
}

/**
 * Deriva el precio base de **una** escala desde las variantes ya cargadas.
 *
 * Dentro de la escala toma la variante mas chica con precio: es la que el
 * admin carga primero y la que menos sufre redondeos (dentro del bulto, el
 * de 50 kg suele venir con mas descuento que el de 25).
 *
 * Devuelve `null` cuando esa escala no tiene ninguna variante utilizable
 * (producto solo a consultar, sin precios todavia, o directamente sin esa
 * escala): el input queda vacio en vez de mostrar un 0 que al guardarse
 * borraria los precios.
 */
export function derivarPrecioBase(variantes: Variant[], escala: EscalaPeso): number | null {
  const utiles = utilesDe(variantes, escala).filter((v) => Number(v.precio) > 0);
  if (utiles.length === 0) return null;

  const chica = utiles.reduce((min, v) => (Number(v.peso_kg) < Number(min.peso_kg) ? v : min));
  return Math.round(Number(chica.precio) / Number(chica.peso_kg));
}

/**
 * Reescribe el precio de las variantes **de una sola escala** como
 * `base * peso_kg`, y deja intactas las de la otra.
 *
 * Esto es lo que mantiene los dos margenes vivos: recalcular el fraccionado
 * no puede tocar el bulto ni al reves.
 *
 * Se saltean las `consultar` (su precio tiene que quedar en `null`, el
 * endpoint rechaza un numero) y las que no tienen peso util, para no pisar
 * un precio ya cargado con un 0.
 */
export function aplicarPrecioBase(
  variantes: Variant[],
  base: number,
  escala: EscalaPeso
): Variant[] {
  if (!Number.isFinite(base) || base <= 0) return variantes;
  return variantes.map((v) =>
    calculable(v) && escalaDe(v) === escala
      ? { ...v, precio: Math.round(base * Number(v.peso_kg)) }
      : v
  );
}

/**
 * Reescribe **todas** las variantes con peso desde un unico base.
 *
 * Queda solo para la carga inicial del ProductoModal, donde el admin todavia
 * no cargo precios y quiere sembrar el producto entero con un numero antes
 * de ajustar el bulto a mano. La grilla no la usa: ahi cada escala tiene su
 * propio input.
 */
export function aplicarPrecioBaseGlobal(variantes: Variant[], base: number): Variant[] {
  if (!Number.isFinite(base) || base <= 0) return variantes;
  return variantes.map((v) =>
    calculable(v) ? { ...v, precio: Math.round(base * Number(v.peso_kg)) } : v
  );
}

/** Cuantas variantes de una escala tocaria {@link aplicarPrecioBase}. */
export function alcanzadasPorPrecioBase(variantes: Variant[], escala?: EscalaPeso): number {
  if (!escala) return variantes.filter(calculable).length;
  return utilesDe(variantes, escala).length;
}

/**
 * Que escalas tiene realmente este producto.
 *
 * La grilla lo usa para no dibujar un input de "Bulto" en un producto que
 * solo se vende fraccionado: dos inputs donde uno siempre queda vacio son
 * dos lugares donde equivocarse, sobre todo en el celular.
 */
export function escalasPresentes(variantes: Variant[]): EscalaPeso[] {
  const escalas: EscalaPeso[] = [];
  if (utilesDe(variantes, 'fraccionado').length > 0) escalas.push('fraccionado');
  if (utilesDe(variantes, 'bulto').length > 0) escalas.push('bulto');
  return escalas;
}
