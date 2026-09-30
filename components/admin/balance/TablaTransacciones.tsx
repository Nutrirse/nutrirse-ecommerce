'use client';

import { useState } from 'react';
import { formatARS } from '@/lib/format';
import { ESTADOS, etiquetaMedio, formatFecha } from '@/lib/balance';
import type { EstadoPago, Transaccion } from '@/lib/balance';

type Props = {
  transacciones: Transaccion[];
  cargando: boolean;
  onEstado: (t: Transaccion, estado: EstadoPago) => void;
  onEditar: (t: Transaccion) => void;
  onEliminar: (t: Transaccion) => void;
  onTicket: (t: Transaccion) => void;
};

const COLOR_ESTADO: Record<EstadoPago, string> = {
  completado: 'border-[#2F7A4A]/30 bg-[#2F7A4A]/10 text-[#1f5a35]',
  pendiente: 'border-[#B8822F]/35 bg-[#B8822F]/10 text-[#7a531a]',
  consulta: 'border-carbon/15 bg-carbon/5 text-humo',
};

function SelectorEstado({ t, onEstado }: { t: Transaccion; onEstado: Props['onEstado'] }) {
  return (
    <select
      value={t.estado_pago}
      onChange={(e) => onEstado(t, e.target.value as EstadoPago)}
      aria-label={`Estado de ${t.concepto}`}
      className={`h-8 rounded-full border px-2.5 text-xs font-semibold outline-none ${COLOR_ESTADO[t.estado_pago]}`}
    >
      {ESTADOS.map((e) => (
        <option key={e.id} value={e.id}>{e.label}</option>
      ))}
    </select>
  );
}

function Valor({ t }: { t: Transaccion }) {
  const gasto = t.tipo === 'gasto';
  return (
    <span className={`font-semibold tabular-nums ${gasto ? 'text-[#b3261e]' : 'text-carbon'}`}>
      {gasto ? '−' : '+'}
      {formatARS(Number(t.valor))}
    </span>
  );
}

/** Editar / ticket / eliminar. Eliminar pide un segundo clic, sin confirm() nativo. */
function Acciones({ t, onEditar, onEliminar, onTicket }: Omit<Props, 'transacciones' | 'cargando' | 'onEstado'> & { t: Transaccion }) {
  const [confirmando, setConfirmando] = useState(false);
  const btn = 'rounded-full px-2.5 py-1 text-xs font-medium transition-colors';
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {t.tipo === 'ingreso' && (
        <button onClick={() => onTicket(t)} className={`${btn} text-[#1e6b32] hover:bg-[#1e6b32]/10`}>
          Ticket
        </button>
      )}
      <button onClick={() => onEditar(t)} className={`${btn} text-humo hover:bg-crema hover:text-carbon`}>
        Editar
      </button>
      {confirmando ? (
        <>
          <button onClick={() => onEliminar(t)} className={`${btn} bg-[#b3261e] text-white hover:bg-[#8f1f18]`}>
            Confirmar
          </button>
          <button onClick={() => setConfirmando(false)} className={`${btn} text-humo hover:bg-crema`}>
            No
          </button>
        </>
      ) : (
        <button onClick={() => setConfirmando(true)} className={`${btn} text-[#b3261e] hover:bg-[#b3261e]/10`}>
          Eliminar
        </button>
      )}
    </div>
  );
}

export default function TablaTransacciones(props: Props) {
  const { transacciones, cargando, onEstado } = props;

  if (!cargando && transacciones.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-carbon/15 bg-white px-4 py-10 text-center text-sm text-humo">
        No hay transacciones en el período.
      </p>
    );
  }

  return (
    <section className={`rounded-2xl border border-carbon/10 bg-white ${cargando ? 'opacity-60' : ''}`}>
      {/* Escritorio: grilla clasica */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-carbon/10 text-left text-[11px] uppercase tracking-wider text-humo">
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Cliente / Proveedor</th>
              <th className="px-4 py-3 font-semibold">Concepto</th>
              <th className="px-4 py-3 font-semibold">Medio de pago</th>
              <th className="px-4 py-3 text-right font-semibold">Valor</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.map((t) => (
              <tr key={t.id} className="border-b border-carbon/5 last:border-0 hover:bg-crema/50">
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-humo">{formatFecha(t.fecha)}</td>
                <td className="px-4 py-3 text-carbon">{t.cliente_proveedor}</td>
                <td className="max-w-[260px] px-4 py-3 text-carbon">
                  <span className="line-clamp-2">{t.concepto}</span>
                  {t.ref_ticket && <span className="text-[11px] text-humo/70">{t.ref_ticket}</span>}
                </td>
                <td className="px-4 py-3 text-humo">{etiquetaMedio(t.medio_pago)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right"><Valor t={t} /></td>
                <td className="px-4 py-3"><SelectorEstado t={t} onEstado={onEstado} /></td>
                <td className="px-4 py-3"><Acciones {...props} t={t} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular: tarjetas, igual que la grilla de productos */}
      <ul className="divide-y divide-carbon/5 md:hidden">
        {transacciones.map((t) => (
          <li key={t.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-carbon">{t.cliente_proveedor}</p>
                <p className="line-clamp-2 text-xs text-humo">{t.concepto}</p>
                <p className="mt-0.5 text-[11px] text-humo/70">
                  {formatFecha(t.fecha)} · {etiquetaMedio(t.medio_pago)}
                  {t.ref_ticket ? ` · ${t.ref_ticket}` : ''}
                </p>
              </div>
              <Valor t={t} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <SelectorEstado t={t} onEstado={onEstado} />
              <Acciones {...props} t={t} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
