const ars = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export const formatARS = (n: number) => ars.format(n);

export const PRECIO_CONSULTAR = 'Precio a Consultar';

/** Devuelve el precio formateado, o el texto de consulta si no hay precio. */
export const formatPrecio = (precio: number | null) =>
  precio === null ? PRECIO_CONSULTAR : formatARS(precio);

/**
 * Costo por kilo de una variante, para el comprador mayorista: la bolsa de
 * 5 kg a $60.300 son $12.060 el kg. Devuelve null si no hay precio o peso
 * con los que calcularlo.
 */
export const formatPrecioPorKg = (precio: number | null, pesoKg: number) =>
  precio && pesoKg > 0 ? `${formatARS(Math.round(precio / pesoKg))} el kg` : null;

/**
 * Cantidad de unidades que trae una presentacion, leida del rotulo.
 *
 * `Variant` no guarda el dato: para los productos que se venden por unidad
 * la migracion escribe en `peso_kg` un peso sintetico (peso de la unidad x
 * cantidad), que sirve para cotizar el envio pero no para dividir el
 * precio. La cantidad real sobrevive en el label que arma
 * `construirVariantes()`: "Bulto Cerrado (15 u.)", "Pack 3 unidades".
 */
const unidadesDeLabel = (label: string): number | null => {
  const m = label.match(/(\d+)\s*(?:u\.?|unidad(?:es)?)(?![a-záéíóúñ])/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Precio unitario sutil que acompana al precio de la variante: lo que el
 * mayorista usa para comparar presentaciones entre si.
 *
 * Se prueba primero por unidad y despues por kilo, en ese orden: un pack de
 * 15 frascos tiene tambien un `peso_kg`, pero dividir por el peso sintetico
 * daria un numero sin sentido comercial.
 *
 * Devuelve null cuando el dato no aporta nada: sin precio (variantes "a
 * consultar"), o con un divisor de 1 o menos, donde el resultado repetiria
 * el precio principal.
 */
export const formatPrecioUnitario = ({
  precio,
  peso_kg,
  label,
}: {
  precio: number | null;
  peso_kg: number;
  label: string;
}): string | null => {
  if (!precio || precio <= 0) return null;

  const unidades = unidadesDeLabel(label);
  if (unidades !== null) {
    return unidades > 1 ? `${formatARS(Math.round(precio / unidades))} la unidad` : null;
  }

  return peso_kg > 1 ? formatPrecioPorKg(precio, peso_kg) : null;
};
