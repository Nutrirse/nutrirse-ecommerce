'use client';

import { useState } from 'react';
import { leerJson, mensajeDeError } from '@/lib/fetch-json';
import { formatARS } from '@/lib/format';
import { ESTADOS, MEDIOS_PAGO, aISO, totalDetalle } from '@/lib/balance';
import type { Cliente, EstadoPago, LineaDetalle, MedioPago, TipoTransaccion, Transaccion } from '@/lib/balance';
import { ErrorBox, ModalShell, btnPrimario, btnSecundario, input, label } from './ui';

/**
 * Alta de gasto, alta de venta (ticket) o edicion de cualquier transaccion.
 * El `tipo` lo fija el modo: editar no cambia un gasto en ingreso.
 */
export type ModoTransaccion =
  | { modo: 'gasto' }
  | { modo: 'venta' }
  | { modo: 'editar'; transaccion: Transaccion };

type Props = ModoTransaccion & {
  clientes: Cliente[];
  onClose: () => void;
  onGuardada: (t: Transaccion, esNueva: boolean) => void;
  onSinSesion: () => void;
};

const LINEA_VACIA: LineaDetalle = { descripcion: '', cantidad: 1, precio_unitario: 0 };

export default function TransaccionModal(props: Props) {
  const { clientes, onClose, onGuardada, onSinSesion } = props;
  const previa = props.modo === 'editar' ? props.transaccion : null;
  const tipo: TipoTransaccion = previa?.tipo ?? (props.modo === 'gasto' ? 'gasto' : 'ingreso');
  const esVenta = tipo === 'ingreso';

  const [fecha, setFecha] = useState(previa?.fecha ?? aISO(new Date()));
  const [clienteId, setClienteId] = useState(previa?.cliente_id ?? '');
  const [nombre, setNombre] = useState(previa?.cliente_proveedor ?? '');
  const [concepto, setConcepto] = useState(previa?.concepto ?? (esVenta ? 'Venta mayorista' : ''));
  const [medio, setMedio] = useState<MedioPago>(previa?.medio_pago ?? 'transferencia');
  const [estado, setEstado] = useState<EstadoPago>(previa?.estado_pago ?? (esVenta ? 'pendiente' : 'completado'));
  const [lineas, setLineas] = useState<LineaDetalle[]>(
    previa?.detalle?.length ? previa.detalle : esVenta ? [LINEA_VACIA] : []
  );
  const [valorManual, setValorManual] = useState(previa ? String(previa.valor) : '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // En una venta con detalle, el total sale de las lineas: no se tipea dos veces.
  const conDetalle = esVenta && lineas.some((l) => l.descripcion.trim());
  const valor = conDetalle ? totalDetalle(lineas) : Number(valorManual) || 0;

  const elegirCliente = (id: string) => {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    if (c) setNombre(c.nombre);
  };

  const setLinea = (i: number, cambios: Partial<LineaDetalle>) =>
    setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...cambios } : l)));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const body = {
      fecha,
      tipo,
      cliente_id: esVenta ? clienteId || null : null,
      cliente_proveedor: nombre.trim(),
      concepto: concepto.trim(),
      medio_pago: medio,
      valor,
      estado_pago: estado,
      detalle: esVenta ? lineas.filter((l) => l.descripcion.trim()) : [],
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
    <ModalShell
      titulo={titulo}
      onClose={onClose}
      ocupado={guardando}
      ancho={esVenta ? 'max-w-2xl' : 'max-w-xl'}
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
            <label className={label} htmlFor="t-cliente">Cliente registrado</label>
            <select id="t-cliente" value={clienteId} onChange={(e) => elegirCliente(e.target.value)} className={`mt-1.5 ${input}`}>
              <option value="">— Sin vincular —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.telefono ? ` · ${c.telefono}` : ''}
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

        <div className="sm:col-span-2">
          <label className={label} htmlFor="t-concepto">Concepto</label>
          <input
            id="t-concepto"
            required
            maxLength={300}
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className={`mt-1.5 ${input}`}
            placeholder={esVenta ? 'Venta mayorista' : 'Compra de mercadería, flete, alquiler…'}
          />
        </div>

        {esVenta && (
          <div className="sm:col-span-2">
            <p className={label}>Detalle del pedido</p>
            <div className="mt-1.5 space-y-2">
              {lineas.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_110px_32px] items-center gap-2">
                  <input
                    aria-label={`Producto línea ${i + 1}`}
                    value={l.descripcion}
                    onChange={(e) => setLinea(i, { descripcion: e.target.value })}
                    className={input}
                    placeholder="Almendra 5 kg"
                  />
                  <input
                    aria-label={`Cantidad línea ${i + 1}`}
                    type="number"
                    min={0}
                    step="any"
                    value={l.cantidad}
                    onChange={(e) => setLinea(i, { cantidad: Number(e.target.value) })}
                    className={`${input} text-right`}
                  />
                  <input
                    aria-label={`Precio unitario línea ${i + 1}`}
                    type="number"
                    min={0}
                    step="any"
                    value={l.precio_unitario}
                    onChange={(e) => setLinea(i, { precio_unitario: Number(e.target.value) })}
                    className={`${input} text-right`}
                  />
                  <button
                    type="button"
                    aria-label="Quitar línea"
                    onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))}
                    className="h-8 w-8 rounded-full text-humo hover:bg-[#b3261e]/10 hover:text-[#b3261e]"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLineas((ls) => [...ls, LINEA_VACIA])}
                className="text-sm font-medium text-[#1e6b32] hover:underline"
              >
                + Agregar línea
              </button>
            </div>
          </div>
        )}

        <div>
          <label className={label} htmlFor="t-valor">Valor total</label>
          {conDetalle ? (
            <p id="t-valor" className="mt-1.5 flex h-[38px] items-center font-semibold tabular-nums text-carbon">
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

        <div>
          <label className={label} htmlFor="t-estado">Estado</label>
          <select id="t-estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoPago)} className={`mt-1.5 ${input}`}>
            {ESTADOS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {error && <div className="sm:col-span-2"><ErrorBox>{error}</ErrorBox></div>}
      </form>
    </ModalShell>
  );
}
