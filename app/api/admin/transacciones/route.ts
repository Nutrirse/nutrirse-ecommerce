import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase-admin';
import { PayloadError } from '@/lib/admin-products';
import { SELECT_TRANSACCION, validarTransaccion } from '@/lib/admin-balance';
import { esFechaISO } from '@/lib/balance';
import type { Transaccion } from '@/lib/balance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sinSesion() {
  return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
}

function sinConfig() {
  return NextResponse.json(
    { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.' },
    { status: 503 }
  );
}

/** `?desde=AAAA-MM-DD&hasta=AAAA-MM-DD`, ambos inclusive. */
export async function GET(req: Request) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  const params = new URL(req.url).searchParams;
  const desde = params.get('desde');
  const hasta = params.get('hasta');
  if (!esFechaISO(desde) || !esFechaISO(hasta) || desde > hasta) {
    return NextResponse.json({ error: 'Rango de fechas inválido.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('transacciones')
    .select(SELECT_TRANSACCION)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transacciones: (data ?? []) as Transaccion[] });
}

export async function POST(req: Request) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  let payload;
  try {
    payload = validarTransaccion(await req.json());
  } catch (e) {
    const msg = e instanceof PayloadError ? e.message : 'JSON inválido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Los ingresos omiten ref_ticket y toman el default de la secuencia
  // (NUT-000123). Los gastos no llevan ticket.
  const fila = payload.tipo === 'gasto' ? { ...payload, ref_ticket: null } : payload;

  const { data, error } = await supabaseAdmin
    .from('transacciones')
    .insert(fila)
    .select(SELECT_TRANSACCION)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaccion: data as Transaccion }, { status: 201 });
}
