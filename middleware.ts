import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Dos trabajos:
 *
 * 1. Rescatar un `?code=` de OAuth que cayo fuera de /auth/callback. Si el
 *    redirectTo no esta en la allowlist de Supabase (Auth > URL
 *    Configuration > Redirect URLs), Supabase vuelve al Site URL (`/`) con
 *    el code y nadie lo canjea: el usuario queda en el splash y sin sesion.
 *    Aca se reenvia al callback; el destino sale de la cookie
 *    `nutrirse_next` que dejo el boton de login.
 *
 * 2. Refrescar el token de Supabase Auth antes de que lo lea el Server
 *    Component. Sin esto, la sesion expira a la hora y el usuario vuelve a
 *    ver el boton de login aunque siga "logueado" en Google.
 *
 * El matcher lo limita a la raiz y los catalogos, que son lo unico que lee
 * la sesion (gating de precios). Admin y las paginas informativas no pagan
 * el round-trip.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const code = searchParams.get('code');
  if (code) {
    const destino = new URL('/auth/callback', request.url);
    destino.searchParams.set('code', code);
    // Solo si no es la raiz: `/` es el fallback de Supabase, no el origen real.
    if (pathname !== '/') destino.searchParams.set('next', pathname);
    return NextResponse.redirect(destino);
  }

  // El splash es estatico y no lee la sesion: no hace falta refrescarla.
  if (pathname === '/') return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/', '/minorista/:path*', '/mayorista/:path*', '/productos/:path*'],
};
