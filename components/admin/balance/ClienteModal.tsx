'use client';

import { useState } from 'react';
import { leerJson, mensajeDeError } from '@/lib/fetch-json';
import type { Cliente } from '@/lib/balance';
import { ErrorBox, ModalShell, btnPrimario, btnSecundario, input, label } from './ui';

export default function ClienteModal({
  onClose,
  onCreado,
  onSinSesion,
}: {
  onClose: () => void;
  onCreado: (c: Cliente) => void;
  onSinSesion: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, telefono, notas }),
      });
      if (res.status === 401) return onSinSesion();
      const data = await leerJson<{ cliente: Cliente }>(res);
      onCreado(data.cliente);
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos crear el cliente.'));
    } finally {
      setGuardando(false);
    }
  };

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
        <div>
          <label className={label} htmlFor="c-nombre">Nombre / Comercio</label>
          <input id="c-nombre" required maxLength={160} value={nombre} onChange={(e) => setNombre(e.target.value)} className={`mt-1.5 ${input}`} />
        </div>
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
          <p className="mt-1 text-[11px] text-humo/60">
            Con código de país. Se usa para mandarle el ticket por WhatsApp.
          </p>
        </div>
        <div>
          <label className={label} htmlFor="c-notas">Notas</label>
          <textarea id="c-notas" rows={2} maxLength={500} value={notas} onChange={(e) => setNotas(e.target.value)} className={`mt-1.5 ${input} resize-y`} />
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
      </form>
    </ModalShell>
  );
}
