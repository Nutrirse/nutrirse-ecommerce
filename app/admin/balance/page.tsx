'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import KpiCards from '@/components/admin/balance/KpiCards';
import EvolucionChart from '@/components/admin/balance/EvolucionChart';
import FiltroFechas from '@/components/admin/balance/FiltroFechas';
import TablaTransacciones from '@/components/admin/balance/TablaTransacciones';
import TransaccionModal from '@/components/admin/balance/TransaccionModal';
import type { ModoTransaccion } from '@/components/admin/balance/TransaccionModal';
import ClienteModal from '@/components/admin/balance/ClienteModal';
import TicketModal from '@/components/admin/balance/TicketModal';
import { PAGE_STYLE_REPORTE, ReporteFinanciero } from '@/components/admin/balance/Imprimibles';
import { btnPrimario, btnSecundario } from '@/components/admin/balance/ui';
import { leerJson, mensajeDeError } from '@/lib/fetch-json';
import { enRango, formatFecha, rangoGrafico, rangoPreset, resumir, serieMensual } from '@/lib/balance';
import type { Cliente, EstadoPago, PresetRango, Rango, Transaccion } from '@/lib/balance';

type Toast = { id: number; texto: string; tipo: 'ok' | 'error' };

const ordenar = (ts: Transaccion[]) =>
  [...ts].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));

export default function BalancePage() {
  const [sesion, setSesion] = useState<'cargando' | 'si' | 'no'>('cargando');

  const [preset, setPreset] = useState<PresetRango>('mes');
  const [rango, setRango] = useState<Rango>(() => rangoPreset('mes'));

  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [modalTx, setModalTx] = useState<ModoTransaccion | null>(null);
  const [modalCliente, setModalCliente] = useState(false);
  const [ticket, setTicket] = useState<Transaccion | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((texto: string, tipo: Toast['tipo'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, texto, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tipo === 'ok' ? 2200 : 5000);
  }, []);

  const sinSesion = useCallback(() => setSesion('no'), []);

  /* ---- Sesion: misma cookie que el panel de catalogo ---- */
  useEffect(() => {
    fetch('/api/admin/login')
      .then((r) => leerJson<{ autenticado?: boolean }>(r))
      .then((d) => setSesion(d.autenticado ? 'si' : 'no'))
      .catch(() => setSesion('no'));
  }, []);

  /* ---- Datos ----
     Se trae la ventana del grafico (>= 6 meses), que siempre contiene al
     rango de la tabla y los KPIs: una sola consulta alimenta todo. */
  const ventana = useMemo(() => rangoGrafico(rango), [rango]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const res = await fetch(`/api/admin/transacciones?desde=${ventana.desde}&hasta=${ventana.hasta}`, {
        cache: 'no-store',
      });
      if (res.status === 401) return sinSesion();
      const data = await leerJson<{ transacciones: Transaccion[] }>(res);
      setTransacciones(data.transacciones);
    } catch (e) {
      setErrorCarga(mensajeDeError(e, 'No pudimos cargar las transacciones.'));
    } finally {
      setCargando(false);
    }
  }, [ventana, sinSesion]);

  const cargarClientes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/clientes', { cache: 'no-store' });
      if (res.status === 401) return sinSesion();
      const data = await leerJson<{ clientes: Cliente[] }>(res);
      setClientes(data.clientes);
    } catch (e) {
      push(mensajeDeError(e, 'No pudimos cargar los clientes.'), 'error');
    }
  }, [sinSesion, push]);

  useEffect(() => {
    if (sesion === 'si') void cargar();
  }, [sesion, cargar]);

  useEffect(() => {
    if (sesion === 'si') void cargarClientes();
  }, [sesion, cargarClientes]);

  /* ---- Derivados ---- */
  const delPeriodo = useMemo(() => transacciones.filter((t) => enRango(t, rango)), [transacciones, rango]);
  const resumen = useMemo(() => resumir(delPeriodo), [delPeriodo]);
  const serie = useMemo(() => serieMensual(transacciones, ventana), [transacciones, ventana]);

  const etiquetaPeriodo =
    preset === 'mes' ? 'este mes' : preset === '6m' ? 'últimos 6 meses' : `${formatFecha(rango.desde)} – ${formatFecha(rango.hasta)}`;

  const elegirPreset = (p: PresetRango) => {
    setPreset(p);
    if (p !== 'custom') setRango(rangoPreset(p));
  };

  /* ---- Acciones ---- */
  const cambiarEstado = async (t: Transaccion, estado: EstadoPago) => {
    const previo = transacciones;
    setTransacciones((ts) => ts.map((x) => (x.id === t.id ? { ...x, estado_pago: estado } : x)));
    try {
      const res = await fetch(`/api/admin/transacciones/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_pago: estado }),
      });
      if (res.status === 401) return sinSesion();
      const data = await leerJson<{ transaccion: Transaccion }>(res);
      setTransacciones((ts) => ts.map((x) => (x.id === t.id ? data.transaccion : x)));
      push('Estado actualizado');
    } catch (e) {
      setTransacciones(previo);
      push(mensajeDeError(e, 'No pudimos cambiar el estado.'), 'error');
    }
  };

  const eliminar = async (t: Transaccion) => {
    const previo = transacciones;
    setTransacciones((ts) => ts.filter((x) => x.id !== t.id));
    try {
      const res = await fetch(`/api/admin/transacciones/${t.id}`, { method: 'DELETE' });
      if (res.status === 401) return sinSesion();
      await leerJson(res);
      push('Transacción eliminada');
    } catch (e) {
      setTransacciones(previo);
      push(mensajeDeError(e, 'No pudimos eliminar la transacción.'), 'error');
    }
  };

  const alGuardar = (t: Transaccion, esNueva: boolean) => {
    setTransacciones((ts) => ordenar(esNueva ? [t, ...ts] : ts.map((x) => (x.id === t.id ? t : x))));
    setModalTx(null);
    push(esNueva ? 'Transacción registrada' : 'Cambios guardados');
    // Una venta recien creada abre directo su ticket: es para lo que se creo.
    if (esNueva && t.tipo === 'ingreso') setTicket(t);
  };

  const telefonoDe = (t: Transaccion) => clientes.find((c) => c.id === t.cliente_id)?.telefono ?? null;

  /* ---- Reporte PDF ---- */
  const refReporte = useRef<HTMLDivElement>(null);
  const imprimirReporte = useReactToPrint({
    contentRef: refReporte,
    documentTitle: `Reporte Nutrirse ${rango.desde} a ${rango.hasta}`,
    pageStyle: PAGE_STYLE_REPORTE,
  });

  /* ---- Render ---- */
  if (sesion === 'cargando') {
    return <div className="flex min-h-dvh items-center justify-center bg-crema text-sm text-humo">Cargando…</div>;
  }

  if (sesion === 'no') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-crema px-5 text-center">
        <p className="text-sm text-humo">Tu sesión de admin expiró o no iniciaste sesión.</p>
        <Link href="/admin" className={`${btnPrimario} inline-flex items-center`}>
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-crema">
      <header className="sticky top-0 z-30 border-b border-carbon/10 bg-hueso/95 backdrop-blur">
        <div className="h-1 bg-gradient-to-r from-[#143620] via-tostado to-[#143620]" aria-hidden />
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-3.5">
          <div className="mr-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-tostado">Nutrirse</p>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-carbon">
              Balance
            </h1>
            <Link href="/admin" className="text-xs text-humo hover:text-carbon">← Volver al catálogo</Link>
          </div>

          <button onClick={() => setModalTx({ modo: 'gasto' })} className={btnSecundario}>
            + Nuevo gasto
          </button>
          <button onClick={() => setModalCliente(true)} className={btnSecundario}>
            + Nuevo cliente
          </button>
          <button onClick={() => setModalTx({ modo: 'venta' })} className={btnPrimario}>
            Generar ticket de venta
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-5 px-5 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FiltroFechas
            preset={preset}
            rango={rango}
            onPreset={elegirPreset}
            onRango={setRango}
          />
          <div className="flex gap-2">
            <button onClick={() => void cargar()} disabled={cargando} className={btnSecundario}>
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </button>
            <button onClick={() => imprimirReporte()} className={btnSecundario}>
              Exportar reporte PDF
            </button>
          </div>
        </div>

        {errorCarga && (
          <p className="rounded-xl border border-[#b3261e]/20 bg-[#b3261e]/8 px-4 py-3 text-sm text-[#b3261e]">
            {errorCarga}
          </p>
        )}

        <KpiCards resumen={resumen} etiquetaPeriodo={etiquetaPeriodo} />
        <EvolucionChart datos={serie} />

        <div>
          <h2 className="mb-2 text-sm font-semibold text-carbon">
            Transacciones <span className="font-normal text-humo">· {delPeriodo.length}</span>
          </h2>
          <TablaTransacciones
            transacciones={delPeriodo}
            cargando={cargando}
            onEstado={(t, e) => void cambiarEstado(t, e)}
            onEditar={(t) => setModalTx({ modo: 'editar', transaccion: t })}
            onEliminar={(t) => void eliminar(t)}
            onTicket={setTicket}
          />
        </div>
      </main>

      {/* Fuente del PDF: oculta en pantalla. react-to-print clona el nodo
          interno, no el contenedor, asi que el display:none no viaja. */}
      <div style={{ display: 'none' }}>
        <ReporteFinanciero ref={refReporte} rango={rango} resumen={resumen} transacciones={delPeriodo} />
      </div>

      {modalTx && (
        <TransaccionModal
          {...modalTx}
          clientes={clientes}
          onClose={() => setModalTx(null)}
          onGuardada={alGuardar}
          onSinSesion={sinSesion}
        />
      )}

      {modalCliente && (
        <ClienteModal
          onClose={() => setModalCliente(false)}
          onCreado={(c) => {
            setClientes((cs) => [...cs, c].sort((a, b) => a.nombre.localeCompare(b.nombre)));
            setModalCliente(false);
            push(`Cliente “${c.nombre}” creado`);
          }}
          onSinSesion={sinSesion}
        />
      )}

      {ticket && <TicketModal t={ticket} telefono={telefonoDe(ticket)} onClose={() => setTicket(null)} />}

      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <p
            key={t.id}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              t.tipo === 'ok' ? 'bg-[#143620]' : 'bg-[#b3261e]'
            }`}
          >
            {t.texto}
          </p>
        ))}
      </div>
    </div>
  );
}
