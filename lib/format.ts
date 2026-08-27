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
