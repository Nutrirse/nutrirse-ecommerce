'use client';

import { useEffect } from 'react';

/** Estilos compartidos con components/admin/ProductoModal.tsx. */
export const input =
  'w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon outline-none transition-colors placeholder:text-humo/50 focus:border-[#143620]/40 focus:ring-2 focus:ring-[#143620]/12';
export const label = 'text-xs font-semibold uppercase tracking-wider text-tostado';

export const btnPrimario =
  'h-10 rounded-full bg-[#1e6b32] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#175427] disabled:opacity-50';
export const btnSecundario =
  'h-10 rounded-full border border-carbon/10 bg-white px-4 text-sm font-medium text-carbon transition-colors hover:bg-crema disabled:opacity-50';

/** Mismo cascaron visual que el modal de producto. */
export function ModalShell({
  titulo,
  onClose,
  ocupado = false,
  ancho = 'max-w-xl',
  pie,
  children,
}: {
  titulo: string;
  onClose: () => void;
  ocupado?: boolean;
  ancho?: string;
  pie?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ocupado) onClose();
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, ocupado]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-[#0b1c0f]/60 backdrop-blur-[2px]"
        onClick={ocupado ? undefined : onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`relative flex max-h-[92dvh] w-full ${ancho} flex-col overflow-hidden rounded-t-3xl bg-[#fdfbf7] shadow-[0_45px_90px_-35px_rgba(11,28,15,0.75)] sm:rounded-3xl`}
      >
        <div className="flex items-center justify-between border-b border-carbon/10 bg-gradient-to-r from-[#143620] to-[#0b1c0f] px-6 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#f5ebd9]">
            {titulo}
          </h2>
          <button
            onClick={onClose}
            disabled={ocupado}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#f5ebd9]/60 transition-colors hover:bg-white/10 hover:text-[#f5ebd9] disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {pie && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-carbon/10 bg-crema px-6 py-4">
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-[#b3261e]/20 bg-[#b3261e]/8 px-3.5 py-2.5 text-sm text-[#b3261e]">
      {children}
    </p>
  );
}
