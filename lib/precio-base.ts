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
 * Vive en `lib` porque lo consumen varios lugares con la misma matematica:
 * la calculadora (grilla y ProductoModal) y el precio que ve el comprador.
 * Si cada uno hiciera su propia cuenta, un cambio de criterio (redondeo, que
 * variantes se saltean) quedaria aplicado en uno solo.
 */

/** Las dos escalas de precio que maneja el negocio. */
export type EscalaPeso = 'fraccionado' | 'bulto';

/** Corte entre fraccionado y bulto, en kg. `<= 5` es fraccionado. */
const CORTE_KG = 5;

/**
 * Unidad de medida del precio base: el granel se cotiza por kilo, los
 * aceites y los chocolates de 100 g se cotizan por unidad.
 */
export type Medida = 'kg' | 'unidad';

/** Por que se multiplica el precio base para llegar al total de la variante. */
export type Medicion = { medida: Medida; cantidad: number };

/** Fin de palabra que tambien respeta acentos (`\b` no los conoce). */
const FIN = '(?![a-záéíóúñ])';

/** Envases que se venden de a uno, en singular y plural. */
const ENVASES =
  'bolsitas?|bolsas?|frascos?|botellitas?|botellas?|displays?|potes?|latas?|sobres?|paquetes?|blisters?';

/**
 * Unidades de contenido: gramos, mililitros, litros. Un rotulo que las
 * declara ("Bolsita 150 gr", "Botella 1 Litro") habla del contenido de un
 * envase, no del peso a cotizar: el precio va por envase.
 */
const CONTENIDO = 'g|grs?|gramos?|ml|cc|cm3|l|lts?|litros?';

/** Numero seguido de una medida (kg o contenido): no es una cantidad de unidades. */
const MEDIDA = `(?:kg|kilos?|${CONTENIDO}|cm|mm)${FIN}`;

/**
 * "15 u.", "Pack 3 unidades", "Bulto de 20 bolsitas" -> 15, 3, 20.
 * Numero pegado a un sustantivo contable.
 */
const RE_UNIDADES = new RegExp(
  `(\\d+)\\s*(?:u\\.?|uds?\\.?|unid\\.?|unidad(?:es)?|${ENVASES}|barritas?|barras?|tabletas?|alfajores)${FIN}`,
  'i'
);

/**
 * "Caja x 12", "Display de 24", "Bolsita 150 gr x 20" -> 12, 24, 20.
 * Numero despues de "x" o de un envase agrupador, **siempre que no sea una
 * medida**: "Bulto x 25 kg" o "Bolsita de 150 gr" no son cantidades.
 * `(?![\d.,/])` evita que el backtracking corte "25" en "2".
 */
const RE_POR_CANTIDAD = new RegExp(
  `(?:\\bx|\\b(?:caja|bulto|pack|display|paquete|blister)\\s*(?:de|x|por)?)\\s*(\\d+)(?![\\d.,/])(?!\\s*${MEDIDA})`,
  'i'
);

/** "Media docena", "2 docenas" -> 6, 24. */
const RE_DOCENA = /(media|\d+)?\s*docenas?\b/i;

/** Rotulos que dicen "se vende por unidad" aunque no digan cuantas. */
const RE_VENTA_POR_UNIDAD = new RegExp(`\\b(?:pack|unidad(?:es)?|u\\.)${FIN}`, 'i');

/** Rotulos que nombran un envase de venta por unidad ("Bolsita", "Frasco"). */
const RE_ENVASE = new RegExp(`\\b(${ENVASES})${FIN}`, 'i');

/** Rotulos que declaran contenido ("150 gr", "500 ml", "1 Litro", "medio litro"). */
const RE_CONTENIDO = new RegExp(`(?:\\d\\s*(?:${CONTENIDO})|\\b(?:gramos?|litros?))${FIN}`, 'i');

/** Rotulos que declaran kilos de forma explicita ("0.5 kg", "Bulto x 25 kilos"). */
const RE_KG = new RegExp(`\\d\\s*(?:kg|kilos?)${FIN}`, 'i');

/**
 * Cantidad de unidades que trae una presentacion, leida del rotulo.
 *
 * `Variant` no guarda el dato: para los productos que se venden por unidad
 * `peso_kg` es un peso sintetico o el peso del bulto para el correo, que
 * sirve para cotizar el envio pero **nunca** para multiplicar el precio. La
 * cantidad real sobrevive en el label: "Bulto Cerrado (15 u.)", "Pack 3
 * unidades", "Bulto de 20 bolsitas", "Caja x 12".
 */
function unidadesDeLabel(label: string): number | null {
  const u = label.match(RE_UNIDADES) ?? label.match(RE_POR_CANTIDAD);
  if (u) {
    const n = Number(u[1]);
    return n > 0 ? n : null;
  }
  const d = label.match(RE_DOCENA);
  if (d) {
    if (!d[1]) return 12;
    return d[1].toLowerCase() === 'media' ? 6 : Number(d[1]) * 12;
  }
  return null;
}

/**
 * El rotulo habla de un envase o de su contenido ("Bolsita 150 gr",
 * "Botella 1 Litro") y no de kilos a granel. "Bolsa 25 kg" no cuenta: ahi
 * los kilos son explicitos y se cotiza por kilo.
 */
function esEnvase(label: string): boolean {
  return !RE_KG.test(label) && (RE_ENVASE.test(label) || RE_CONTENIDO.test(label));
}

/**
 * Nombre del envase en singular ("bolsita", "frasco"), para los textos de
 * la calculadora. `null` si el rotulo no nombra ninguno.
 */
export function envaseDe(label: string): string | null {
  const m = (label ?? '').match(RE_ENVASE);
  return m ? m[1].toLowerCase().replace(/s$/, '') : null;
}

/**
 * Como se mide una variante: por kilo o por unidad, y cuantos de cada uno.
 *
 * Es la unica fuente de la division `total / cantidad`: la usan la
 * calculadora del admin y el precio que ve el comprador, asi un aceite nunca
 * termina mostrado "por kg" en un lado y "por unidad" en el otro.
 *
 * Orden de lectura:
 *  1. El rotulo declara unidades ("Pack 15 unidades", "Media docena"): manda
 *     el rotulo, porque el `peso_kg` de esos productos es sintetico.
 *     Excepcion: si las unidades coinciden con `peso_kg` ("Caja de 6
 *     Unidades" con 6 kg), cada unidad es 1 kg justo y se cotiza por kilo,
 *     como el resto del granel. La cantidad no cambia (6), solo la medida:
 *     el comprador ve "/kg" en vez de "/u.". Una caja de 10 chocolates de
 *     100 g pesa 1 kg (10 !== 1) y sigue por unidad.
 *     La excepcion no aplica si el rotulo nombra un envase o contenido
 *     ("Bulto de 20 bolsitas de 150 gr" con 20 kg sigue por bolsita).
 *  2. El rotulo dice que se vende por unidad sin decir cuantas ("Pack"),
 *     nombra un envase o su contenido ("Bolsita 150 gr", "Botella 1 Litro")
 *     sin declarar kilos, o la variante pesa menos de 1 kg sin declarar
 *     kilos (un chocolate de 100 g): se cotiza por unidad, 1 unidad. El
 *     `peso_kg` de esas variantes es el del bulto para el correo: usarlo de
 *     multiplicador convertia una bolsita con 5 kg de envio en "$/kg x 5".
 *  3. El resto es granel: por kilo, con `peso_kg` como cantidad.
 *
 * Devuelve `null` si no hay con que medir (sin peso y sin unidades).
 */
export function medicionDe(v: Pick<Variant, 'label' | 'peso_kg'>): Medicion | null {
  const label = v.label ?? '';
  const peso = Number(v.peso_kg);
  const pesoUtil = Number.isFinite(peso) && peso > 0;
  const envase = esEnvase(label);

  const unidades = unidadesDeLabel(label);
  if (unidades !== null) {
    // Tolerancia: `peso_kg` sale de `toFixed(3)` en la migracion y puede
    // traer ruido de coma flotante (5.999999...).
    const unidadDeUnKilo = !envase && pesoUtil && Math.abs(unidades - peso) < 1e-6;
    return { medida: unidadDeUnKilo ? 'kg' : 'unidad', cantidad: unidades };
  }

  const sinKg = !RE_KG.test(label);
  if (RE_VENTA_POR_UNIDAD.test(label) || envase || (pesoUtil && peso < 1 && sinKg)) {
    return { medida: 'unidad', cantidad: 1 };
  }
  return pesoUtil ? { medida: 'kg', cantidad: peso } : null;
}

/** Una variante sirve para la cuenta si lleva precio y tiene con que medirse. */
function calculable(v: Variant): boolean {
  return v.tipo !== 'consultar' && medicionDe(v) !== null;
}

/** Cantidad por la que se multiplica el base. Solo sobre variantes `calculable`. */
const cantidadDe = (v: Variant): number => medicionDe(v)?.cantidad ?? 0;

/**
 * A que escala pertenece una variante.
 *
 * El label manda sobre el peso porque es lo que el admin ve y lo que define
 * el precio comercial: un "Bulto x 25 kg" cargado sin peso, o un "5 kg"
 * cargado como 5.0 exacto, tienen que caer donde dice la etiqueta. Recien si
 * el label no dice nada se decide por `peso_kg`.
 *
 * Una sola unidad suelta ("Bolsita 150 gr") es siempre fraccionado: su
 * `peso_kg` puede ser el del bulto de envio y no dice nada de la escala.
 */
export function escalaDe(v: Variant): EscalaPeso {
  const label = (v.label ?? '').toLowerCase();
  if (label.includes('bulto')) return 'bulto';
  if (/\b5\s*kg\b/.test(label)) return 'fraccionado';
  const m = medicionDe(v);
  if (m?.medida === 'unidad' && m.cantidad === 1) return 'fraccionado';
  return Number(v.peso_kg) > CORTE_KG ? 'bulto' : 'fraccionado';
}

/** Variantes de una escala que entran en la cuenta. */
function utilesDe(variantes: Variant[], escala: EscalaPeso): Variant[] {
  return variantes.filter((v) => calculable(v) && escalaDe(v) === escala);
}

/**
 * Deriva el precio base de **una** escala desde las variantes ya cargadas.
 *
 * Divide por kilo o por unidad segun {@link medicionDe}. Dentro de la
 * escala toma la variante mas chica con precio: es la que el
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

  const chica = utiles.reduce((min, v) => (cantidadDe(v) < cantidadDe(min) ? v : min));
  return Math.round(Number(chica.precio) / cantidadDe(chica));
}

/**
 * Reescribe el precio de las variantes **de una sola escala** como
 * `base * cantidad` (kilos o unidades), y deja intactas las de la otra.
 *
 * Esto es lo que mantiene los dos margenes vivos: recalcular el fraccionado
 * no puede tocar el bulto ni al reves.
 *
 * Se saltean las `consultar` (su precio tiene que quedar en `null`, el
 * endpoint rechaza un numero) y las que no tienen con que medirse, para no pisar
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
      ? { ...v, precio: Math.round(base * cantidadDe(v)) }
      : v
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

/**
 * Con que se multiplica el base de una escala, para el texto de ayuda:
 * "(base × kg)" o "(base × unidad)". `mixta` si la escala combina variantes
 * por kilo y por unidad; `null` si no tiene ninguna calculable.
 */
export function medidaDeEscala(
  variantes: Variant[],
  escala?: EscalaPeso
): Medida | 'mixta' | null {
  const utiles = escala ? utilesDe(variantes, escala) : variantes.filter(calculable);
  const medidas = new Set(utiles.map((v) => medicionDe(v)?.medida));
  if (medidas.size === 0) return null;
  if (medidas.size > 1) return 'mixta';
  return medidas.has('unidad') ? 'unidad' : 'kg';
}

/**
 * Envase que nombran las variantes por unidad de una escala ("bolsita"),
 * para el titulo de la calculadora. `null` si ninguna nombra uno o si
 * nombran envases distintos.
 */
export function envaseDeEscala(variantes: Variant[], escala: EscalaPeso): string | null {
  const envases = new Set(
    utilesDe(variantes, escala)
      .filter((v) => medicionDe(v)?.medida === 'unidad')
      .map((v) => envaseDe(v.label))
  );
  if (envases.size !== 1) return null;
  return [...envases][0];
}

/** Texto del multiplicador para la ayuda de la calculadora. */
export function formulaDe(medida: Medida | 'mixta' | null): string {
  if (medida === 'unidad') return 'base × unidad';
  if (medida === 'mixta') return 'base × kg / unidad';
  return 'base × kg';
}
