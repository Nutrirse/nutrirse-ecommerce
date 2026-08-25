import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import {
  supabaseAdmin,
  isAdminConfigured,
  slugLibre,
  borrarImagenPorUrl,
} from '@/lib/supabase-admin';
import { PayloadError, refrescarCatalogo, validarParcial } from '@/lib/admin-products';
import type { Product } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SELECT =
  'id, slug, nombre, descripcion, imagen_url, categoria, precios_por_variante, activo, orden, updated_at';

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

/** Edicion parcial: la usa tanto la grilla (un campo) como el modal (todo). */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  const { id } = await params;

  let cambios;
  try {
    cambios = validarParcial(await req.json());
  } catch (e) {
    const msg = e instanceof PayloadError ? e.message : 'JSON inválido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Renombrar tiene que arrastrar el slug: es la URL publica del producto.
  const patch: Record<string, unknown> = { ...cambios };
  if (cambios.nombre) patch.slug = await slugLibre(cambios.nombre, id);

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
    .eq('id', id)
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });

  refrescarCatalogo();
  return NextResponse.json({ product: data as Product });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  const { id } = await params;

  // Se lee la fila antes de borrarla para poder limpiar la imagen del bucket.
  const { data: previo } = await supabaseAdmin
    .from('products')
    .select('imagen_url')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort: si falla, queda un huerfano en Storage pero el producto
  // ya no esta. No tiene sentido revertir el delete por esto.
  await borrarImagenPorUrl((previo?.imagen_url as string | null) ?? null);

  refrescarCatalogo();
  return NextResponse.json({ ok: true });
}
