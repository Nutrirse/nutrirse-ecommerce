'use client';

import { useState } from 'react';
import { WHATSAPP_NUMBER, sanitizeWhatsAppNumber } from '@/lib/whatsapp';

type Campos = {
  nombre: string;
  asunto: string;
  mensaje: string;
};

const VACIO: Campos = { nombre: '', asunto: '', mensaje: '' };

const ASUNTOS = [
  'Pedido mayorista',
  'Cotización por volumen',
  'Consulta de stock',
  'Lista de precios',
  'Otro',
];

/** Arma el texto del mensaje con la sintaxis de negritas de WhatsApp. */
function buildMensaje({ nombre, asunto, mensaje }: Campos): string {
  return [
    '*CONSULTA DESDE LA WEB* 🌰',
    '━━━━━━━━━━━━━━━',
    `*Nombre:* ${nombre.trim()}`,
    `*Asunto:* ${asunto.trim()}`,
    '',
    mensaje.trim(),
  ].join('\n');
}

const inputBase =
  'w-full rounded-xl border border-black/10 bg-hueso px-4 py-3 text-sm text-carbon outline-none transition-colors placeholder:text-humo/50 focus:border-nuez/40 focus:ring-2 focus:ring-nuez/15';

export default function ContactWhatsAppForm() {
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof Campos) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCampos((c) => ({ ...c, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!campos.nombre.trim() || !campos.asunto.trim() || !campos.mensaje.trim()) {
      setError('Completá nombre, asunto y mensaje para poder escribirnos.');
      return;
    }
    setError(null);

    const url = `https://wa.me/${sanitizeWhatsAppNumber(WHATSAPP_NUMBER)}?text=${encodeURIComponent(
      buildMensaje(campos)
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-3xl border border-black/5 bg-hueso p-7 shadow-[0_30px_60px_-45px_rgba(28,26,23,0.55)] sm:p-9"
    >
      <p className="font-[family-name:var(--font-hand)] text-[clamp(1.6rem,3vw,2.1rem)] leading-none text-tostado">
        Escribinos
      </p>
      <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-carbon">
        Mensaje directo a WhatsApp
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-humo">
        Completá los datos y se abre el chat con el mensaje ya escrito. No hace falta que
        copies nada.
      </p>

      <div className="mt-7 space-y-4">
        <div>
          <label htmlFor="nombre" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-tostado">
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            autoComplete="name"
            value={campos.nombre}
            onChange={set('nombre')}
            placeholder="Nombre y comercio"
            className={inputBase}
          />
        </div>

        <div>
          <label htmlFor="asunto" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-tostado">
            Asunto
          </label>
          <select id="asunto" name="asunto" value={campos.asunto} onChange={set('asunto')} className={inputBase}>
            <option value="">Elegí un asunto</option>
            {ASUNTOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mensaje" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-tostado">
            Mensaje
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            rows={5}
            value={campos.mensaje}
            onChange={set('mensaje')}
            placeholder="Contanos qué productos te interesan y en qué cantidades."
            className={`${inputBase} resize-y`}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-[#b3261e]/8 px-4 py-3 text-sm text-[#b3261e]">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-semibold text-[#0b1c0f] shadow-[0_12px_30px_-12px_rgba(37,211,102,0.9)] transition-transform hover:scale-[1.02] active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22z" />
        </svg>
        Enviar mensaje
      </button>

      <p className="mt-3 text-center text-xs text-humo/70">
        Se abre WhatsApp en una pestaña nueva.
      </p>
    </form>
  );
}
