const ars = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export const formatARS = (n: number) => ars.format(n);

export const formatPrecio = (precio: number | null) =>
  precio === null ? 'A convenir' : formatARS(precio);
