import type { NextRequest } from 'next/server';
import { COOKIE_NEXT, createSupabaseRoute, rutaInterna } from '@/lib/supabase-auth/server';

export const dynamic = 'force-dynamic';

/**
 * Vuelta del OAuth de Google. Supabase redirige aca con `?code=` (flujo
 * PKCE); se canjea por la sesion y las cookies se escriben en el mismo
 * redirect que lleva al usuario de vuelta a donde estaba.
 *
 * Destino: `?next=` > cookie `nutrirse_next` > /minorista.
 *
 * El alta en `clientes` NO se hace aca: la hace el trigger
 * `on_auth_user_created_lead` (supabase/migracion_minorista.sql).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next =
    rutaInterna(searchParams.get('next')) ??
    rutaInterna(decodeURIComponentSeguro(request.cookies.get(COOKIE_NEXT)?.value)) ??
    '/minorista';

  const { supabase, responder } = createSupabaseRoute(request);

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = responder(`${origin}${next}`);
      res.cookies.delete(COOKIE_NEXT);
      return res;
    }
    console.error('[auth/callback]', error.message);
  } else {
    console.error('[auth/callback]', code ? 'Supabase no configurado' : 'Falta ?code=');
  }

  // Vuelve a la pagina de origen con el aviso, no siempre a /minorista.
  const fallo = new URL(next, origin);
  fallo.searchParams.set('error', 'login');
  const res = responder(fallo);
  res.cookies.delete(COOKIE_NEXT);
  return res;
}

function decodeURIComponentSeguro(v: string | undefined) {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return null;
  }
}
