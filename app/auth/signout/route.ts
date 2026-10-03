import type { NextRequest } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase-auth/server';

export const dynamic = 'force-dynamic';

/**
 * POST y no GET: un <img src> o un prefetch no deben poder cerrar la sesion.
 * Vuelve a la pagina desde la que se cerro (mismo origen); si no se puede
 * saber, al splash.
 */
export async function POST(request: NextRequest) {
  const { supabase, responder } = createSupabaseRoute(request);
  await supabase?.auth.signOut();

  const actual = request.nextUrl;
  let destino = new URL('/', actual);
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const r = new URL(referer);
      if (r.origin === actual.origin) destino = r;
    } catch {
      // Referer mal formado: queda el splash.
    }
  }
  // Las cookies borradas por signOut viajan en este mismo redirect.
  return responder(destino, { status: 303 });
}
