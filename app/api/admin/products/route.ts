import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import { supabaseAdmin, isAdminConfigured, slugLibre } from '@/lib/supabase-admin';
import { PayloadError, refrescarCatalogo, validarProducto } from '@/lib/admin-products';
import type { Product } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SELECT =
  'id, slug, nombre, descripcion, composicion, nota_venta, imagen_url, imagenes, categoria, precios_por_variante, activo, visible_mayorista, visible_minorista, orden, updated_at';

function sinSesion() {
  return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
}

function sinConfig() {
  return NextResponse.json(
    { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.' },
    { status: 503 }
  );
}

/**
 * Catalogo completo para el panel: incluye los productos inactivos, que la
 * lectura publica (policy RLS `activo = true`) no devuelve.
 */
export async function GET() {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  const { data, error } = await supabaseAdmin
    .from('products')
    .select(SELECT)
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: (data ?? []) as Product[] });
}

export async function POST(req: Request) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  let payload;
  try {
    payload = validarProducto(await req.json());
  } catch (e) {
    const msg = e instanceof PayloadError ? e.message : 'JSON inválido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const slug = await slugLibre(payload.nombre);

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({ ...payload, slug })
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  refrescarCatalogo();
  return NextResponse.json({ product: data as Product }, { status: 201 });
}
