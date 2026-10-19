'use client';

import { useEffect, useState } from 'react';

const CLAVE = 'nutrirse:popup-andreani';

/**
 * Pop-up de la promo Andreani, solo en /minorista y /minorista/productos
 * (lo montan esas paginas). Se decide en el efecto (localStorage no existe
 * en el servidor) y, una vez cerrado, no vuelve a salir.
 */
export default function AndreaniPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let visto = false;
    try {
      visto = localStorage.getItem(CLAVE) === '1';
    } catch {
      // Storage bloqueado: se muestra, y al cerrar solo se pierde el recuerdo.
    }
    if (visto) return;
    // Un respiro para que primero se vea la pagina.
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible]);

  const cerrar = () => {
    try {
      localStorage.setItem(CLAVE, '1');
    } catch {
      // Modo privado: igual se cierra.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={cerrar} aria-hidden className="absolute inset-0 bg-carbon/50 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="andreani-popup-titulo"
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-hueso shadow-[0_30px_80px_-20px_rgba(28,26,23,0.55)]"
      >
        <button
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-humo transition-colors hover:bg-black/5 hover:text-carbon"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-crema px-7 pb-6 pt-9 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-sm" aria-hidden>
            🚚
          </span>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-tostado">
            Promo envíos
          </p>
          <h2
            id="andreani-popup-titulo"
            className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight text-carbon"
          >
            ¡20% de descuento en envíos con Andreani para todo el país (fuera de Salta Capital)!
          </h2>
        </div>

        <div className="px-7 pb-7 pt-5 text-center">
          <p className="text-sm leading-relaxed text-humo">
            Elegí Andreani al cerrar tu pedido y el descuento se aplica sobre el costo de envío.
          </p>
          <button
            onClick={cerrar}
            autoFocus
            className="mt-5 w-full rounded-full bg-carbon py-3 text-sm font-semibold text-hueso transition-opacity hover:opacity-90"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
