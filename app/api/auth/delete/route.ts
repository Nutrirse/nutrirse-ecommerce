import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase-auth/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * Derecho de supresion (art. 16, Ley 25.326): el usuario logueado borra su
 * propia cuenta. Solo POST y solo del mismo origen: un sitio ajeno no puede
 * disparar el borrado con la cookie de la victima.
 *
 * El id sale de la sesion validada con getUser(), nunca del body: nadie
 * puede pedir borrar a otro.
 *
 * Orden: primero el CRM (`clientes`), despues Auth. Al reves, si fallara el
 * CRM ya no habria forma de encontrar la fila por `auth_user_id`.
 * - Lead que entro solo por Google: la fila se borra. Sus transacciones, si
 *   las hubiera, quedan con el nombre guardado y `cliente_id` en null (FK
 *   on delete set null): los comprobantes fiscales se conservan.
 * - Cliente que el admin cargo a mano (origen 'admin'): es un cliente con
 *   cuenta corriente, no se borra; se le quita el email, el vinculo con la
 *   cuenta y el permiso de marketing.
 */
export async function POST(request: NextRequest) {
  const origen = request.headers.get('origin');
  if (!origen || origen !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.' },
      { status: 500 }
    );
  }

  const { supabase } = createSupabaseRoute(request);
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const user = data.user;
  if (!user) {
    return NextResponse.json({ error: 'No hay una sesión iniciada.' }, { status: 401 });
  }

  const { data: cliente, error: errLectura } = await supabaseAdmin
    .from('clientes')
    .select('id, origen')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (errLectura) {
    console.error('[auth/delete] clientes:', errLectura.message);
    return NextResponse.json({ error: 'No pudimos borrar tus datos. Probá de nuevo.' }, { status: 500 });
  }

  if (cliente) {
    const { error } =
      cliente.origen === 'google'
        ? await supabaseAdmin.from('clientes').delete().eq('id', cliente.id)
        : await supabaseAdmin
            .from('clientes')
            .update({ email: null, auth_user_id: null, acepta_marketing: false })
            .eq('id', cliente.id);
    if (error) {
      console.error('[auth/delete] clientes:', error.message);
      return NextResponse.json({ error: 'No pudimos borrar tus datos. Probá de nuevo.' }, { status: 500 });
    }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error('[auth/delete] auth:', error.message);
    return NextResponse.json({ error: 'No pudimos borrar tu cuenta. Probá de nuevo.' }, { status: 500 });
  }

  // La sesion ya no vale (el usuario no existe). Las cookies las limpia el
  // cliente con signOut({ scope: 'local' }), que no llama a la API.
  return NextResponse.json({ ok: true });
}
