'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-auth/browser';

/**
 * Link discreto "Eliminar mi cuenta y mis datos" con confirmacion en dos
 * pasos (sin window.confirm). Borra en /api/auth/delete, limpia la sesion
 * local y vuelve al inicio.
 */
export default function EliminarCuenta({ className = '' }: { className?: string }) {
  const [paso, setPaso] = useState<'inicio' | 'confirmar' | 'borrando'>('inicio');
  const [error, setError] = useState<string | null>(null);

  const borrar = async () => {
    setPaso('borrando');
    setError(null);
    try {
      const res = await fetch('/api/auth/delete', { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'No pudimos borrar tu cuenta. Probá de nuevo.');
      }
      // El usuario ya no existe en Supabase: solo quedan las cookies locales.
      await createSupabaseBrowser().auth.signOut({ scope: 'local' });
      window.location.assign('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos borrar tu cuenta. Probá de nuevo.');
      setPaso('confirmar');
    }
  };

  if (paso === 'inicio') {
    return (
      <button
        type="button"
        onClick={() => setPaso('confirmar')}
        className={`text-xs text-current opacity-60 underline-offset-2 hover:underline hover:opacity-100 ${className}`}
      >
        Eliminar mi cuenta y mis datos
      </button>
    );
  }

  return (
    <div className={`text-xs ${className}`} role="alertdialog" aria-label="Confirmar eliminación de cuenta">
      <p className="leading-relaxed opacity-80">
        Se borran tu cuenta y tus datos de contacto. No se puede deshacer.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={borrar}
          disabled={paso === 'borrando'}
          className="font-semibold text-red-600 hover:underline disabled:cursor-wait disabled:opacity-60"
        >
          {paso === 'borrando' ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
        <button
          type="button"
          onClick={() => setPaso('inicio')}
          disabled={paso === 'borrando'}
          className="opacity-70 hover:opacity-100"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
}
