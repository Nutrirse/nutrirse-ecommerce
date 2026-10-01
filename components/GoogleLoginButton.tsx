'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-auth/browser';

/**
 * Login con Google via Supabase Auth. Al volver, /auth/callback canjea el
 * code por la sesion y redirige a `next` (por defecto, la pagina actual).
 */
export default function GoogleLoginButton({
  texto = 'Inicia sesión con Google para ver precios',
  next,
  compacto = false,
}: {
  texto?: string;
  /** Ruta interna a la que volver despues del login. */
  next?: string;
  compacto?: boolean;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setCargando(true);
    setError(null);
    const destino = next ?? `${window.location.pathname}${window.location.search}`;
    const { error } = await createSupabaseBrowser().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destino)}`,
        queryParams: { prompt: 'select_account' },
      },
    });
    // Si no hubo error el navegador ya esta saliendo hacia Google.
    if (error) {
      setError('No pudimos abrir Google. Probá de nuevo.');
      setCargando(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={login}
        disabled={cargando}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70 ${
          compacto ? 'px-3 py-2.5 text-xs' : 'px-4 py-3.5 text-sm'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden className="shrink-0">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {cargando ? 'Abriendo Google…' : texto}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
