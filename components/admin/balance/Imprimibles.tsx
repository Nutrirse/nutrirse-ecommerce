'use client';

/* eslint-disable @next/next/no-img-element --
   <img> plano a proposito: react-to-print clona el nodo en un iframe y el
   lazy-loading de next/image puede dejar el logo en blanco en el PDF. */

import { formatARS } from '@/lib/format';
import { NEGOCIO, SITE_URL } from '@/lib/site';
import { etiquetaEstado, etiquetaMedio, formatFecha, totalDetalle } from '@/lib/balance';
import type { Rango, Resumen, Transaccion } from '@/lib/balance';

/** Estilos de pagina que recibe useReactToPrint. */
export const PAGE_STYLE_REPORTE =
  '@page { size: A4; margin: 14mm } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }';
export const PAGE_STYLE_TICKET =
  '@page { size: A5; margin: 10mm } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }';

function Encabezado({ titulo, sub }: { titulo: string; sub: string }) {
  return (
    <header className="flex items-center justify-between border-b-2 border-[#143620] pb-4">
      <img src="/Logo.png" alt="Nutrirse" className="h-14 w-auto" />
      <div className="text-right">
        <p className="text-lg font-bold text-[#143620]">{titulo}</p>
        <p className="text-xs text-gray-600">{sub}</p>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Reporte financiero oficial                                          */
/* ------------------------------------------------------------------ */

export function ReporteFinanciero({
  ref,
  rango,
  resumen,
  transacciones,
}: {
  ref: React.Ref<HTMLDivElement>;
  rango: Rango;
  resumen: Resumen;
  transacciones: Transaccion[];
}) {
  const ingresos = transacciones.filter((t) => t.tipo === 'ingreso' && t.estado_pago !== 'consulta');
  const gastos = transacciones.filter((t) => t.tipo === 'gasto' && t.estado_pago !== 'consulta');
  const balance = resumen.cobrado - resumen.gastos;

  const Tabla = ({ filas, titulo }: { filas: Transaccion[]; titulo: string }) => (
    <section className="mt-6">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#143620]">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="text-xs text-gray-500">Sin movimientos.</p>
      ) : (
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#143620] text-left text-white">
              <th className="px-2 py-1.5">Fecha</th>
              <th className="px-2 py-1.5">Ref.</th>
              <th className="px-2 py-1.5">Cliente / Proveedor</th>
              <th className="px-2 py-1.5">Concepto</th>
              <th className="px-2 py-1.5">Medio</th>
              <th className="px-2 py-1.5">Estado</th>
              <th className="px-2 py-1.5 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((t, i) => (
              <tr key={t.id} className={i % 2 ? 'bg-gray-50' : ''} style={{ breakInside: 'avoid' }}>
                <td className="px-2 py-1">{formatFecha(t.fecha)}</td>
                <td className="px-2 py-1">{t.ref_ticket ?? '—'}</td>
                <td className="px-2 py-1">{t.cliente_proveedor}</td>
                <td className="px-2 py-1">{t.concepto}</td>
                <td className="px-2 py-1">{etiquetaMedio(t.medio_pago)}</td>
                <td className="px-2 py-1">{etiquetaEstado(t.estado_pago)}</td>
                <td className="px-2 py-1 text-right tabular-nums">{formatARS(Number(t.valor))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-400 font-bold">
              <td colSpan={6} className="px-2 py-1.5 text-right">Total</td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatARS(filas.reduce((a, t) => a + Number(t.valor), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );

  return (
    <div ref={ref} className="bg-white p-2 font-sans text-gray-900">
      <Encabezado
        titulo="Reporte financiero"
        sub={`Período: ${formatFecha(rango.desde)} al ${formatFecha(rango.hasta)}`}
      />

      <div className="mt-5 grid grid-cols-5 gap-2 text-center">
        {[
          ['Facturado', resumen.facturado],
          ['Cobrado', resumen.cobrado],
          ['Por cobrar', resumen.porCobrar],
          ['Gastos', resumen.gastos],
          ['Balance (cobrado − gastos)', balance],
        ].map(([t, v]) => (
          <div key={t as string} className="rounded border border-gray-300 p-2">
            <p className="text-[10px] uppercase text-gray-500">{t}</p>
            <p className="mt-1 text-sm font-bold tabular-nums">{formatARS(v as number)}</p>
          </div>
        ))}
      </div>

      <Tabla filas={ingresos} titulo="Ingresos" />
      <Tabla filas={gastos} titulo="Gastos" />

      <footer className="mt-8 border-t border-gray-300 pt-2 text-[10px] text-gray-500">
        Nutrirse · {NEGOCIO.ciudad}, {NEGOCIO.provincia} · {NEGOCIO.email} · Emitido el{' '}
        {new Date().toLocaleDateString('es-AR')}. Documento interno, no válido como factura.
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ticket de venta                                                     */
/* ------------------------------------------------------------------ */

export function TicketVenta({
  ref,
  t,
  telefono,
}: {
  ref?: React.Ref<HTMLDivElement>;
  t: Transaccion;
  telefono?: string | null;
}) {
  const lineas = t.detalle.length
    ? t.detalle
    : [{ descripcion: t.concepto, cantidad: 1, precio_unitario: Number(t.valor) }];
  const subtotal = totalDetalle(lineas);

  return (
    <div ref={ref} className="mx-auto max-w-[420px] bg-white p-5 font-sans text-gray-900">
      <div className="text-center">
        <img src="/Logo.png" alt="Nutrirse" className="mx-auto h-16 w-auto" />
        <p className="mt-1 text-[11px] text-gray-500">
          {NEGOCIO.ciudad}, {NEGOCIO.provincia} · {NEGOCIO.telefono}
        </p>
        <p className="text-[11px] text-gray-500">{SITE_URL.replace(/^https?:\/\//, '')}</p>
      </div>

      <div className="mt-4 border-y border-dashed border-gray-400 py-3 text-xs">
        <div className="flex justify-between">
          <span className="font-bold">Ticket {t.ref_ticket ?? ''}</span>
          <span>{formatFecha(t.fecha)}</span>
        </div>
        <p className="mt-1">Cliente: <b>{t.cliente_proveedor}</b></p>
        {telefono && <p>Tel.: +{telefono}</p>}
      </div>

      <table className="mt-3 w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="pb-1 font-medium">Detalle</th>
            <th className="pb-1 text-right font-medium">Cant.</th>
            <th className="pb-1 text-right font-medium">Importe</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((l, i) => (
            <tr key={i} className="align-top">
              <td className="py-0.5 pr-2">
                {l.descripcion}
                <span className="block text-[10px] text-gray-500">{formatARS(l.precio_unitario)} c/u</span>
              </td>
              <td className="py-0.5 text-right tabular-nums">{l.cantidad}</td>
              <td className="py-0.5 text-right tabular-nums">{formatARS(l.cantidad * l.precio_unitario)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 border-t border-dashed border-gray-400 pt-3 text-sm">
        {Math.abs(subtotal - Number(t.valor)) > 0.5 && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatARS(subtotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold">
          <span>TOTAL</span>
          <span className="tabular-nums">{formatARS(Number(t.valor))}</span>
        </div>
        <p className="mt-1 text-xs text-gray-600">
          Pago: {etiquetaMedio(t.medio_pago)} · {etiquetaEstado(t.estado_pago)}
        </p>
      </div>

      <p className="mt-5 text-center text-[11px] text-gray-500">
        ¡Gracias por elegir Nutrirse! · Comprobante no válido como factura.
      </p>
    </div>
  );
}
