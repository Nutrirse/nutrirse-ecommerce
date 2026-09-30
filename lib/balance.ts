import { formatARS } from './format';

/**
 * Tipos y calculos del Panel de Balance. Sin imports de servidor: lo usan
 * tanto los Route Handlers como los componentes de /admin/balance.
 * Las tablas estan en supabase/migracion_balance.sql.
 */

export type TipoTransaccion = 'ingreso' | 'gasto';
export type EstadoPago = 'completado' | 'pendiente' | 'consulta';
export type MedioPago = 'transferencia' | 'efectivo' | 'mercadopago' | 'tarjeta' | 'otro';

export type LineaDetalle = {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
};

export type Transaccion = {
  id: string;
  /** YYYY-MM-DD, sin hora: un ingreso es "del dia", no de un instante. */
  fecha: string;
  tipo: TipoTransaccion;
  cliente_id: string | null;
  cliente_proveedor: string;
  concepto: string;
  medio_pago: MedioPago;
  valor: number;
  estado_pago: EstadoPago;
  ref_ticket: string | null;
  detalle: LineaDetalle[];
};

export type Cliente = {
  id: string;
  nombre: string;
  /** Solo digitos, formato wa.me. */
  telefono: string | null;
  notas: string | null;
};

export const TIPOS: TipoTransaccion[] = ['ingreso', 'gasto'];

export const ESTADOS: { id: EstadoPago; label: string }[] = [
  { id: 'completado', label: 'Completado' },
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'consulta', label: 'Consulta' },
];

export const MEDIOS_PAGO: { id: MedioPago; label: string }[] = [
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'mercadopago', label: 'Mercado Pago' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'otro', label: 'Otro' },
];

export const etiquetaMedio = (m: MedioPago) => MEDIOS_PAGO.find((x) => x.id === m)?.label ?? m;
export const etiquetaEstado = (e: EstadoPago) => ESTADOS.find((x) => x.id === e)?.label ?? e;

/* ------------------------------------------------------------------ */
/* Fechas (siempre en hora local: el negocio opera en Argentina)       */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, '0');

export const aISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const esFechaISO = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export type PresetRango = 'mes' | '6m' | 'custom';
export type Rango = { desde: string; hasta: string };

export function rangoPreset(preset: Exclude<PresetRango, 'custom'>, hoy = new Date()): Rango {
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  const meses = preset === 'mes' ? 0 : 5;
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - meses, 1);
  return { desde: aISO(inicio), hasta: aISO(fin) };
}

/**
 * Ventana del grafico: el rango elegido, pero nunca menos de 6 meses. Con
 * "Este mes" una sola barra no muestra evolucion de nada.
 */
export function rangoGrafico(r: Rango): Rango {
  const [y, m] = r.hasta.split('-').map(Number);
  const seisAtras = aISO(new Date(y, m - 1 - 5, 1));
  return { desde: r.desde < seisAtras ? r.desde : seisAtras, hasta: r.hasta };
}

export const formatFecha = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* ------------------------------------------------------------------ */
/* Calculos                                                            */
/* ------------------------------------------------------------------ */

export const enRango = (t: Transaccion, r: Rango) => t.fecha >= r.desde && t.fecha <= r.hasta;

export type Resumen = { facturado: number; cobrado: number; porCobrar: number; gastos: number };

/**
 * - Facturado: ingresos confirmados (cobrados o no). Las "consulta" son
 *   cotizaciones abiertas, todavia no son una venta.
 * - Cobrado / Por cobrar: el split de lo facturado por estado.
 * - Gastos: todo gasto que no sea una consulta.
 */
export function resumir(ts: Transaccion[]): Resumen {
  const r: Resumen = { facturado: 0, cobrado: 0, porCobrar: 0, gastos: 0 };
  for (const t of ts) {
    if (t.estado_pago === 'consulta') continue;
    const v = Number(t.valor) || 0;
    if (t.tipo === 'gasto') {
      r.gastos += v;
      continue;
    }
    r.facturado += v;
    if (t.estado_pago === 'completado') r.cobrado += v;
    else r.porCobrar += v;
  }
  return r;
}

export type PuntoMensual = { mes: string; etiqueta: string } & Resumen;

/** Un punto por mes calendario del rango, incluidos los meses en cero. */
export function serieMensual(ts: Transaccion[], r: Rango): PuntoMensual[] {
  const [y0, m0] = r.desde.split('-').map(Number);
  const [y1, m1] = r.hasta.split('-').map(Number);

  const puntos: PuntoMensual[] = [];
  for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1); m === 12 ? (y++, (m = 1)) : m++) {
    const mes = `${y}-${pad(m)}`;
    const delMes = ts.filter((t) => t.fecha.startsWith(mes) && enRango(t, r));
    puntos.push({ mes, etiqueta: `${MESES[m - 1]} ${String(y).slice(2)}`, ...resumir(delMes) });
  }
  return puntos;
}

export const totalDetalle = (d: LineaDetalle[]) =>
  d.reduce((acc, l) => acc + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0), 0);

/* ------------------------------------------------------------------ */
/* Ticket por WhatsApp                                                 */
/* ------------------------------------------------------------------ */

/** Version texto del ticket, para mandarla por wa.me junto al PDF. */
export function textoTicket(t: Transaccion): string {
  const lineas = t.detalle.length
    ? t.detalle.map(
        (l) => `• ${l.cantidad} x ${l.descripcion} — ${formatARS(l.cantidad * l.precio_unitario)}`
      )
    : [`• ${t.concepto}`];

  return [
    `*Nutrirse — Ticket ${t.ref_ticket ?? ''}*`.trim(),
    `Fecha: ${formatFecha(t.fecha)}`,
    `Cliente: ${t.cliente_proveedor}`,
    '',
    ...lineas,
    '',
    `*Total: ${formatARS(Number(t.valor))}*`,
    `Pago: ${etiquetaMedio(t.medio_pago)} (${etiquetaEstado(t.estado_pago).toLowerCase()})`,
    '',
    '¡Gracias por tu compra!',
  ].join('\n');
}
