'use client';

import { useState } from 'react';
import { leerJson, mensajeDeError } from '@/lib/fetch-json';
import { formatARS } from '@/lib/format';
import { ESTADOS, MEDIOS_PAGO, UNIDADES, aISO, cantidadConUnidad, totalDetalle } from '@/lib/balance';
import type { Cliente, EstadoPago, LineaDetalle, MedioPago, TipoTransaccion, Transaccion, Unidad } from '@/lib/balance';
import ClienteModal from './ClienteModal';
import { ErrorBox, ModalShell, btnPrimario, btnSecundario, input, label } from './ui';

/**
 * Alta de gasto, alta de venta (ticket) o edicion de cualquier transaccion.
 * El `tipo` lo fija el modo: editar no cambia un gasto en ingreso.
 */
export type ModoTransaccion =
  | { modo: 'gasto' }
  | { modo: 'venta'; clienteId?: string }
  | { modo: 'editar'; transaccion: Transaccion };

type Props = ModoTransaccion & {
  clientes: Cliente[];
  onClose: () => void;
  onGuardada: (t: Transaccion, esNueva: boolean) => void;
  /** Alta rapida desde "+ Crear nuevo cliente": el padre lo suma a su lista. */
  onClienteCreado: (c: Cliente) => void;
  onSinSesion: () => void;
};

const LINEA_VACIA: LineaDetalle = { descripcion: '', cantidad: 1, unidad: 'kg', precio_unitario: 0 };

/** Un gasto viejo (sin detalle) se abre como una sola linea con su concepto. */
function lineasIniciales(previa: Transaccion | null): LineaDetalle[] {
  if (previa?.detalle?.length) return previa.detalle;
  if (previa?.tipo === 'gasto') {
    return [{ descripcion: previa.concepto, cantidad: 1, unidad: 'unidad', precio_unitario: Number(previa.valor) }];
  }
  return [LINEA_VACIA];
}

/** El concepto de un gasto sale de sus lineas: "50 bolsas harina, 200 kg pasas". */
function conceptoDeLineas(lineas: LineaDetalle[]): string {
  const s = lineas.map((l) => `${cantidadConUnidad(l)} ${l.descripcion.trim()}`).join(', ');
  return s.length > 300 ? `${s.slice(0, 297)}…` : s;
}

export default function TransaccionModal(props: Props) {
  const { clientes, onClose, onGuardada, onClienteCreado, onSinSesion } = props;
  const previa = props.modo === 'editar' ? props.transaccion : null;
  const tipo: TipoTransaccion = previa?.tipo ?? (props.modo === 'gasto' ? 'gasto' : 'ingreso');
  const esVenta = tipo === 'ingreso';

  const clienteInicial =
    previa?.cliente_id ?? (props.modo === 'venta' ? props.clienteId : undefined) ?? '';

  const [fecha, setFecha] = useState(previa?.fecha ?? aISO(new Date()));
  const [clienteId, setClienteId] = useState(clienteInicial);
  const [nombre, setNombre] = useState(
    previa?.cliente_proveedor ?? clientes.find((c) => c.id === clienteInicial)?.nombre ?? ''
  );
  const [concepto, setConcepto] = useState(previa?.concepto ?? 'Venta mayorista');
  const [medio, setMedio] = useState<MedioPago>(previa?.medio_pago ?? 'transferencia');
  const [estado, setEstado] = useState<EstadoPago>(previa?.estado_pago ?? (esVenta ? 'pendiente' : 'completado'));
  const [entregado, setEntregado] = useState(previa?.monto_entregado != null ? String(previa.monto_entregado) : '');
  const [lineas, setLineas] = useState<LineaDetalle[]>(() => lineasIniciales(previa));
  const [valorManual, setValorManual] = useState(previa ? String(previa.valor) : '');
  const [nuevoCliente, setNuevoCliente] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineasValidas = lineas.filter((l) => l.descripcion.trim());
  // El total sale de las lineas: no se tipea dos veces. Una venta sin
  // detalle (cobro suelto) todavia admite el valor a mano.
  const conDetalle = !esVenta || lineasValidas.length > 0;
  const valor = conDetalle ? totalDetalle(lineasValidas) : Number(valorManual) || 0;
  const montoEntregado = Number(entregado) || 0;

  const elegirCliente = (id: string) => {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    if (c) setNombre(c.nombre);
  };

  const setLinea = (i: number, cambios: Partial<LineaDetalle>) =>
    setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...cambios } : l)));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!esVenta && lineasValidas.length === 0) {
      return setError('Cargá al menos una línea con descripción.');
    }
    if (estado === 'parcial' && (montoEntregado <= 0 || montoEntregado > valor)) {
      return setError('El monto entregado tiene que ser mayor a 0 y no superar el total.');
    }

    setGuardando(true);
    const body = {
      fecha,
      tipo,
      cliente_id: esVenta ? clienteId || null : null,
      cliente_proveedor: nombre.trim(),
      concepto: esVenta ? concepto.trim() : conceptoDeLineas(lineasValidas),
      medio_pago: medio,
      valor,
      estado_pago: estado,
      monto_entregado: estado === 'parcial' ? montoEntregado : null,
      detalle: lineasValidas,
    };

    try {
      const res = await fetch(previa ? `/api/admin/transacciones/${previa.id}` : '/api/admin/transacciones', {
        method: previa ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) return onSinSesion();
      const data = await leerJson<{ transaccion: Transaccion }>(res);
      onGuardada(data.transaccion, !previa);
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos guardar la transacción.'));
    } finally {
      setGuardando(false);
    }
  };

  const titulo = previa
    ? `Editar ${esVenta ? 'ingreso' : 'gasto'}`
    : esVenta
      ? 'Generar ticket de venta'
      : 'Nuevo gasto';

  return (
    <>
      <ModalShell
        titulo={titulo}
        onClose={onClose}
        // Con el alta de cliente encima, Escape y el fondo solo cierran ese.
        ocupado={guardando || nuevoCliente}
        ancho="max-w-2xl"
        pie={
          <>
            <button type="button" onClick={onClose} disabled={guardando} className={btnSecundario}>
              Cancelar
            </button>
            <button type="submit" form="form-transaccion" disabled={guardando} className={btnPrimario}>
              {guardando ? 'Guardando…' : previa ? 'Guardar cambios' : esVenta ? 'Crear ticket' : 'Registrar gasto'}
            </button>
          </>
        }
      >
        <form id="form-transaccion" onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="t-fecha">Fecha</label>
            <input id="t-fecha" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className={`mt-1.5 ${input}`} />
          </div>

          {esVenta && (
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <label className={label} htmlFor="t-cliente">Cliente registrado</label>
                <button
                  type="button"
                  onClick={() => setNuevoCliente(true)}
                  className="text-xs font-medium text-[#1e6b32] hover:underline"
                >
                  + Crear nuevo cliente
                </button>
              </div>
              <select id="t-cliente" value={clienteId} onChange={(e) => elegirCliente(e.target.value)} className={`mt-1.5 ${input}`}>
                <option value="">— Sin vincular —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ref_cliente ? `${c.ref_cliente} · ` : ''}{c.nombre}{c.telefono ? ` · ${c.telefono}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={esVenta ? 'sm:col-span-2' : ''}>
            <label className={label} htmlFor="t-nombre">{esVenta ? 'Nombre en el ticket' : 'Proveedor'}</label>
            <input
              id="t-nombre"
              required
              maxLength={160}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={`mt-1.5 ${input}`}
              placeholder={esVenta ? 'Almacén Don José' : 'Distribuidora del Norte'}
            />
          </div>

          {esVenta && (
            <div className="sm:col-span-2">
              <label className={label} htmlFor="t-concepto">Concepto</label>
              <input
                id="t-concepto"
                required
                maxLength={300}
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className={`mt-1.5 ${input}`}
                placeholder="Venta mayorista"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <p className={label}>{esVenta ? 'Detalle del pedido' : 'Detalle del gasto'}</p>
            <LineasEditor
              lineas={lineas}
              placeholder={esVenta ? 'Almendra pelada' : 'Bolsas de harina 000'}
              onCambiar={setLinea}
              onQuitar={(i) => setLineas((ls) => ls.filter((_, j) => j !== i))}
              onAgregar={() => setLineas((ls) => [...ls, LINEA_VACIA])}
            />
          </div>

          <div>
            <label className={label} htmlFor="t-valor">Valor total</label>
            {conDetalle ? (
              <p id="t-valor" className="mt-1.5 flex h-[38px] items-center text-lg font-semibold tabular-nums text-carbon">
                {formatARS(valor)}
              </p>
            ) : (
              <input
                id="t-valor"
                type="number"
                min={0}
                step="any"
                required
                value={valorManual}
                onChange={(e) => setValorManual(e.target.value)}
                className={`mt-1.5 ${input}`}
                placeholder="0"
              />
            )}
          </div>

          <div>
            <label className={label} htmlFor="t-medio">Medio de pago</label>
            <select id="t-medio" value={medio} onChange={(e) => setMedio(e.target.value as MedioPago)} className={`mt-1.5 ${input}`}>
              {MEDIOS_PAGO.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <p className={label}>Estado de pago</p>
            <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Estado de pago">
              {ESTADOS.filter((s) => esVenta || s.id !== 'parcial').map((s) => {
                const activo = estado === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    onClick={() => setEstado(s.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      activo
                        ? 'border-[#143620] bg-[#143620] text-[#f5ebd9]'
                        : 'border-carbon/10 bg-white text-humo hover:border-carbon/30 hover:text-carbon'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {estado === 'parcial' && (
            <div className="grid gap-4 rounded-2xl border border-[#B8822F]/25 bg-[#B8822F]/6 p-4 sm:col-span-2 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="t-entregado">Entregó a cuenta</label>
                <input
                  id="t-entregado"
                  type="number"
                  min={0}
                  max={valor || undefined}
                  step="any"
                  required
                  autoFocus
                  value={entregado}
                  onChange={(e) => setEntregado(e.target.value)}
                  className={`mt-1.5 ${input}`}
                  placeholder="0"
                />
              </div>
              <div>
                <p className={label}>Saldo pendiente</p>
                <p className="mt-1.5 flex h-[38px] items-center font-semibold tabular-nums text-[#7a531a]">
                  {formatARS(Math.max(0, valor - montoEntregado))}
                </p>
              </div>
            </div>
          )}

          {error && <div className="sm:col-span-2"><ErrorBox>{error}</ErrorBox></div>}
        </form>
      </ModalShell>

      {nuevoCliente && (
        <ClienteModal
          onClose={() => setNuevoCliente(false)}
          onCreado={onClienteCreado}
          onSinSesion={onSinSesion}
          accion={{
            texto: 'Usar en este ticket',
            onClick: (c) => {
              setClienteId(c.id);
              setNombre(c.nombre);
              setNuevoCliente(false);
            },
          }}
        />
      )}
    </>
  );
}

/** Lineas dinamicas: descripcion, cantidad, unidad y valor unitario. */
function LineasEditor({
  lineas,
  placeholder,
  onCambiar,
  onQuitar,
  onAgregar,
}: {
  lineas: LineaDetalle[];
  placeholder: string;
  onCambiar: (i: number, cambios: Partial<LineaDetalle>) => void;
  onQuitar: (i: number) => void;
  onAgregar: () => void;
}) {
  // Mobile: la descripcion ocupa la fila entera y los numeros van debajo.
  const grilla =
    'grid grid-cols-[64px_88px_1fr_28px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_68px_88px_112px_28px]';
  const encabezado = 'text-[10px] font-semibold uppercase tracking-wider text-humo/70';

  return (
    <div className="mt-1.5 space-y-2">
      <div className={`${grilla} hidden sm:grid`} aria-hidden>
        <span className={encabezado}>Descripción</span>
        <span className={`${encabezado} text-right`}>Cant.</span>
        <span className={encabezado}>Unidad</span>
        <span className={`${encabezado} text-right`}>Valor unit.</span>
        <span />
      </div>

      {lineas.map((l, i) => (
        <div key={i} className="rounded-xl border border-carbon/5 bg-white/60 p-2 sm:border-0 sm:bg-transparent sm:p-0">
          <div className={grilla}>
            <input
              aria-label={`Descripción línea ${i + 1}`}
              value={l.descripcion}
              onChange={(e) => onCambiar(i, { descripcion: e.target.value })}
              className={`${input} col-span-4 sm:col-span-1`}
              placeholder={placeholder}
            />
            <input
              aria-label={`Cantidad línea ${i + 1}`}
              type="number"
              min={0}
              step="any"
              value={l.cantidad}
              onChange={(e) => onCambiar(i, { cantidad: Number(e.target.value) })}
              className={`${input} text-right`}
            />
            <select
              aria-label={`Unidad línea ${i + 1}`}
              value={l.unidad ?? 'unidad'}
              onChange={(e) => onCambiar(i, { unidad: e.target.value as Unidad })}
              className={`${input} px-2`}
            >
              {UNIDADES.map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
            <input
              aria-label={`Valor unitario línea ${i + 1}`}
              type="number"
              min={0}
              step="any"
              value={l.precio_unitario}
              onChange={(e) => onCambiar(i, { precio_unitario: Number(e.target.value) })}
              className={`${input} text-right`}
              placeholder="$ por unidad"
            />
            <button
              type="button"
              aria-label={`Quitar línea ${i + 1}`}
              onClick={() => onQuitar(i)}
              disabled={lineas.length === 1}
              className="h-7 w-7 rounded-full text-humo hover:bg-[#b3261e]/10 hover:text-[#b3261e] disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ×
            </button>
          </div>
          {l.descripcion.trim() && (
            <p className="mt-1 text-right text-[11px] tabular-nums text-humo sm:pr-9">
              Subtotal {formatARS((Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0))}
            </p>
          )}
        </div>
      ))}

      <button type="button" onClick={onAgregar} className="text-sm font-medium text-[#1e6b32] hover:underline">
        + Agregar línea
      </button>
    </div>
  );
}
