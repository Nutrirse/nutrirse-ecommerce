'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { guardarConsentimiento, leerConsentimiento, type Consentimiento } from '@/lib/consentimiento';

/**
 * Aviso de cookies flotante abajo. Se decide en el efecto (localStorage no
 * existe en el servidor): asi no aparece un frame del banner a quien ya
 * eligio. Una vez que acepta o rechaza, no vuelve a salir.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!leerConsentimiento()) setVisible(true);
  }, []);

  if (!visible) return null;

  const elegir = (v: Consentimiento) => {
    guardarConsentimiento(v);
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-black/10 bg-hueso/95 p-4 shadow-[0_20px_50px_-20px_rgba(28,26,23,0.45)] backdrop-blur sm:bottom-5 sm:p-5"
    >
      <p className="text-sm leading-relaxed text-humo">
        Usamos cookies propias para que el sitio funcione y, si aceptás, de{' '}
        <strong className="text-carbon">Google Analytics</strong> y el{' '}
        <strong className="text-carbon">Píxel de Meta</strong> para medir visitas y mejorar nuestros
        anuncios.{' '}
        <Link href="/politica-de-privacidad" className="text-nuez underline underline-offset-2">
          Más información
        </Link>
      </p>
      <div className="mt-3 flex gap-2 sm:justify-end">
        <button
          onClick={() => elegir('rechazadas')}
          className="flex-1 rounded-full border border-black/15 px-5 py-2 text-sm font-medium text-carbon transition-colors hover:bg-black/5 sm:flex-none"
        >
          Rechazar
        </button>
        <button
          onClick={() => elegir('aceptadas')}
          className="flex-1 rounded-full bg-carbon px-5 py-2 text-sm font-semibold text-hueso transition-opacity hover:opacity-90 sm:flex-none"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
