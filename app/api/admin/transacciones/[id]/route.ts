import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase-admin';
import { PayloadError } from '@/lib/admin-products';
import { SELECT_TRANSACCION, validarParcialTransaccion } from '@/lib/admin-balance';
import type { Transaccion } from '@/lib/balance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

function sinSesion() {
  return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
}

function sinConfig() {
  return NextResponse.json(
    { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.' },
    { status: 503 }
  );
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  const { id } = await params;

  let cambios;
  try {
    cambios = validarParcialTransaccion(await req.json());
  } catch (e) {
    const msg = e instanceof PayloadError ? e.message : 'JSON inválido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Un ingreso que pasa a gasto pierde el ticket: no fue una venta.
  const patch: Record<string, unknown> = { ...cambios };
  if (cambios.tipo === 'gasto') patch.ref_ticket = null;

  const { data, error } = await supabaseAdmin
    .from('transacciones')
    .update(patch)
    .eq('id', id)
    .select(SELECT_TRANSACCION)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Transacción no encontrada.' }, { status: 404 });
  return NextResponse.json({ transaccion: data as Transaccion });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  const { id } = await params;
  const { error } = await supabaseAdmin.from('transacciones').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
