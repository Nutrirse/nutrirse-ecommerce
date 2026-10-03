import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-auth/server';

export const dynamic = 'force-dynamic';

/**
 * POST y no GET: un <img src> o un prefetch no deben poder cerrar la sesion.
 * Vuelve a la pagina desde la que se cerro (mismo origen); si no se puede
 * saber, al splash.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  await supabase?.auth.signOut();

  const actual = new URL(request.url);
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
  return NextResponse.redirect(destino, { status: 303 });
}
