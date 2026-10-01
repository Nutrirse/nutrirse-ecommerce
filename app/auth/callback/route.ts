import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-auth/server';

export const dynamic = 'force-dynamic';

/**
 * Vuelta del OAuth de Google. Supabase redirige aca con `?code=` (flujo
 * PKCE) y se canjea por la sesion, que queda en cookies.
 *
 * El alta en `clientes` NO se hace aca: la hace el trigger
 * `on_auth_user_created_lead` (supabase/migracion_minorista.sql).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Solo rutas internas: evita usar el callback como open redirect.
  const pedido = searchParams.get('next') ?? '/minorista';
  const next = pedido.startsWith('/') && !pedido.startsWith('//') ? pedido : '/minorista';

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = supabase
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error('Supabase no configurado') };
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error('[auth/callback]', error.message);
  }

  return NextResponse.redirect(`${origin}/minorista?error=login`);
}
