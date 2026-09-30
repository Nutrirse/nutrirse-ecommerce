import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import {
  supabaseAdmin,
  isAdminConfigured,
  slugLibre,
  borrarImagenesPorUrl,
} from '@/lib/supabase-admin';
import { PayloadError, refrescarCatalogo, validarParcial } from '@/lib/admin-products';
import type { Product } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SELECT =
  'id, slug, nombre, descripcion, composicion, nota_venta, imagen_url, imagenes, categoria, precios_por_variante, activo, orden, updated_at';

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

  // Galeria previa: las fotos que el admin saco hay que borrarlas del bucket
  // despues del update, o quedan pesando para siempre sin que nada las
  // referencie.
  let galeriaPrevia: string[] = [];
  if (cambios.imagenes) {
    const { data: previo } = await supabaseAdmin
      .from('products')
      .select('imagenes, imagen_url')
      .eq('id', id)
      .maybeSingle();
    const p = previo as { imagenes?: string[] | null; imagen_url?: string | null } | null;
    galeriaPrevia = p?.imagenes?.length ? p.imagenes : p?.imagen_url ? [p.imagen_url] : [];
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
    .eq('id', id)
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });

  if (galeriaPrevia.length > 0) {
    const vigentes = new Set(cambios.imagenes ?? []);
    await borrarImagenesPorUrl(galeriaPrevia.filter((u) => !vigentes.has(u)));
  }

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
    .select('imagen_url, imagenes')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort: si falla, queda un huerfano en Storage pero el producto
  // ya no esta. No tiene sentido revertir el delete por esto.
  const fila = previo as { imagen_url?: string | null; imagenes?: string[] | null } | null;
  await borrarImagenesPorUrl([fila?.imagen_url ?? null, ...(fila?.imagenes ?? [])]);

  refrescarCatalogo();
  return NextResponse.json({ ok: true });
}
