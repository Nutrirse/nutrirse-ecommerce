import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase-admin';
import { PayloadError } from '@/lib/admin-products';
import { SELECT_CLIENTE, validarCliente } from '@/lib/admin-balance';
import type { Cliente } from '@/lib/balance';

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

export async function GET() {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  const { data, error } = await supabaseAdmin
    .from('clientes')
    .select(SELECT_CLIENTE)
    .order('nombre', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clientes: (data ?? []) as Cliente[] });
}

export async function POST(req: Request) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  let payload;
  try {
    payload = validarCliente(await req.json());
  } catch (e) {
    const msg = e instanceof PayloadError ? e.message : 'JSON inválido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('clientes')
    .insert(payload)
    .select(SELECT_CLIENTE)
    .single();

  if (error?.code === '23505') {
    return NextResponse.json({ error: 'Ya hay un cliente con ese teléfono.' }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cliente: data as Cliente }, { status: 201 });
}
