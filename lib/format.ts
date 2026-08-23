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
