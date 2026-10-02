'use client';

import { useState } from 'react';
import { leerJson, mensajeDeError } from '@/lib/fetch-json';
import type { Cliente } from '@/lib/balance';
import { ErrorBox, ModalShell, btnPrimario, btnSecundario, input, label } from './ui';

/**
 * Alta de cliente. Despues de guardar (o si el telefono ya estaba cargado)
 * el modal no se cierra solo: muestra el cliente con su numero CLI-XXXX y
 * ofrece `accion`, que el padre define ("Generar ticket" desde el panel,
 * "Usar en este ticket" desde el modal de venta).
 */
export default function ClienteModal({
  onClose,
  onCreado,
  onSinSesion,
  accion,
}: {
  onClose: () => void;
  /** Se llama apenas se guarda, para sumar el cliente a la lista del padre. */
  onCreado: (c: Cliente) => void;
  onSinSesion: () => void;
  accion: { texto: string; onClick: (c: Cliente) => void };
}) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [documento, setDocumento] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ cliente: Cliente; yaExistia: boolean } | null>(null);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, telefono, documento, notas }),
      });
      if (res.status === 401) return onSinSesion();

      // Telefono repetido: no es un error para el usuario, el cliente ya esta.
      if (res.status === 409) {
        const data = (await res.json().catch(() => null)) as { existente?: Cliente | null } | null;
        if (data?.existente) {
          setResultado({ cliente: data.existente, yaExistia: true });
          return;
        }
      }

      const data = await leerJson<{ cliente: Cliente }>(res);
      onCreado(data.cliente);
      setResultado({ cliente: data.cliente, yaExistia: false });
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos crear el cliente.'));
    } finally {
      setGuardando(false);
    }
  };

  if (resultado) {
    const { cliente: c, yaExistia } = resultado;
    return (
      <ModalShell
        titulo={yaExistia ? 'Cliente ya registrado' : 'Cliente creado'}
        onClose={onClose}
        ancho="max-w-md"
        pie={
          <>
            <button type="button" onClick={onClose} className={btnSecundario}>
              {yaExistia ? 'Volver' : 'Listo'}
            </button>
            <button type="button" onClick={() => accion.onClick(c)} className={btnPrimario}>
              {accion.texto} →
            </button>
          </>
        }
      >
        <div className="text-center">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl ${
              yaExistia ? 'bg-[#B8822F]/12 text-[#7a531a]' : 'bg-[#2F7A4A]/12 text-[#1f5a35]'
            }`}
            aria-hidden
          >
            {yaExistia ? 'i' : '✓'}
          </div>
          <p className="mt-3 text-sm text-humo">
            {yaExistia
              ? 'Ese teléfono ya está en la base. No hace falta cargarlo de nuevo:'
              : 'Quedó guardado con este número de cliente:'}
          </p>
          <p className="mt-3 inline-block rounded-full bg-[#143620] px-4 py-1.5 font-mono text-sm font-semibold tracking-wider text-[#f5ebd9]">
            {c.ref_cliente ?? 'Sin número'}
          </p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-lg font-semibold text-carbon">
            {c.nombre}
          </p>
          <p className="text-xs text-humo">
            {[c.telefono && `+${c.telefono}`, c.documento && `DNI/CUIT ${c.documento}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      titulo="Nuevo cliente"
      onClose={onClose}
      ocupado={guardando}
      ancho="max-w-md"
      pie={
        <>
          <button type="button" onClick={onClose} disabled={guardando} className={btnSecundario}>
            Cancelar
          </button>
          <button type="submit" form="form-cliente" disabled={guardando} className={btnPrimario}>
            {guardando ? 'Guardando…' : 'Crear cliente'}
          </button>
        </>
      }
    >
      <form id="form-cliente" onSubmit={guardar} className="space-y-4">
        <p className="rounded-xl bg-crema px-3 py-2 text-xs text-humo">
          Al guardar se le asigna un número de cliente automático (<span className="font-mono">CLI-0001</span>…).
        </p>
        <div>
          <label className={label} htmlFor="c-nombre">Nombre / Comercio</label>
          <input id="c-nombre" required maxLength={160} value={nombre} onChange={(e) => setNombre(e.target.value)} className={`mt-1.5 ${input}`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="c-tel">WhatsApp</label>
            <input
              id="c-tel"
              type="tel"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={`mt-1.5 ${input}`}
              placeholder="+54 9 387 538-3979"
            />
          </div>
          <div>
            <label className={label} htmlFor="c-doc">
              DNI / CUIT <span className="font-normal normal-case tracking-normal text-humo/60">(opcional)</span>
            </label>
            <input
              id="c-doc"
              inputMode="numeric"
              maxLength={13}
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              className={`mt-1.5 ${input}`}
              placeholder="20-12345678-9"
            />
          </div>
        </div>
        <p className="-mt-2 text-[11px] text-humo/60">
          WhatsApp con código de país: se usa para mandarle el ticket.
        </p>
        <div>
          <label className={label} htmlFor="c-notas">Notas</label>
          <textarea id="c-notas" rows={2} maxLength={500} value={notas} onChange={(e) => setNotas(e.target.value)} className={`mt-1.5 ${input} resize-y`} />
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
      </form>
    </ModalShell>
  );
}
