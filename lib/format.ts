import { medicionDe, type Medida } from '@/lib/precio-base';

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

const cantidad = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 });

/** "5 kg", "2,5 kg", "1 unidad", "15 unidades". */
export const formatCantidad = (n: number, medida: Medida) =>
  medida === 'kg'
    ? `${cantidad.format(n)} kg`
    : `${cantidad.format(n)} ${n === 1 ? 'unidad' : 'unidades'}`;

/** Sufijo corto del precio base: "$ 24.050 /kg", "$ 3.730 /u.". */
export const sufijoMedida = (medida: Medida) => (medida === 'kg' ? '/kg' : '/u.');

export type DesglosePrecio = {
  /** Precio por kg o por unidad: es el numero grande de la tarjeta. */
  base: number;
  medida: Medida;
  /** Kilos o unidades que trae la presentacion. */
  cantidad: number;
  /** Precio cerrado de la variante, el que va al carrito. */
  total: number;
  /**
   * "(Total: $ 120.250 por 5 kg)". `null` cuando la presentacion es de 1 kg
   * o 1 unidad: ahi el total repetiria el base.
   */
  textoTotal: string | null;
};

/**
 * Precio de una variante partido como lo lee el mayorista: primero el valor
 * por kg o por unidad (con el que compara proveedores), despues el total de
 * la presentacion.
 *
 * La medida sale de `medicionDe()`, la misma que usa la calculadora del
 * admin: un pack de aceites se divide por sus unidades, no por su peso
 * sintetico, y un chocolate de 100 g se cotiza por unidad y no a $/kg.
 *
 * Devuelve null sin precio (variantes "a consultar") o sin con que medir.
 */
export const desglosePrecio = ({
  precio,
  peso_kg,
  label,
}: {
  precio: number | null;
  peso_kg: number;
  label: string;
}): DesglosePrecio | null => {
  if (!precio || precio <= 0) return null;
  const m = medicionDe({ label, peso_kg });
  if (!m) return null;

  return {
    base: Math.round(precio / m.cantidad),
    medida: m.medida,
    cantidad: m.cantidad,
    total: precio,
    textoTotal:
      m.cantidad === 1
        ? null
        : `Total: ${formatARS(precio)} por ${formatCantidad(m.cantidad, m.medida)}`,
  };
};
