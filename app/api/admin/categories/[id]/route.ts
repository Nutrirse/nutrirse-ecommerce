import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase-admin';
import {
  mensajeDePg,
  PayloadError,
  refrescarCategorias,
  validarCategoriaParcial,
  type CategoriaAdmin,
} from '@/lib/admin-categorias';
import { refrescarCatalogo } from '@/lib/admin-products';
import { CATEGORIAS_SELECT } from '@/lib/categorias-db';
import type { Categoria } from '@/lib/categorias';

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

async function contarProductos(slug: string): Promise<number> {
  if (!supabaseAdmin) return 0;
  const { count } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('categoria', slug);
  return count ?? 0;
}

/**
 * Renombrar / mover / reordenar.
 *
 * El slug se puede cambiar sin tocar los productos: la FK
 * `products_categoria_fkey` es ON UPDATE CASCADE, asi que Postgres reetiqueta
 * las filas de `products` (y las categorias hijas) en la misma sentencia.
 * Por eso no hay codigo de cascada aca: hacerlo a mano abriria una ventana
 * en la que los productos apuntan a un slug que ya no existe.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  const { id } = await params;

  const { data: previo, error: errorPrevio } = await supabaseAdmin
    .from('categories')
    .select(CATEGORIAS_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (errorPrevio) {
    return NextResponse.json({ error: mensajeDePg(errorPrevio) }, { status: 500 });
  }
  if (!previo) {
    return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
  }

  const actual = previo as Categoria;

  let cambios;
  try {
    cambios = validarCategoriaParcial(await req.json(), actual.slug);
  } catch (e) {
    const msg = e instanceof PayloadError ? e.message : 'JSON inválido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Un ciclo directo lo corta el check de la tabla, pero el de dos saltos
  // (A hija de B y B hija de A) no: se valida aca.
  if (cambios.padre_slug) {
    const { data: padre } = await supabaseAdmin
      .from('categories')
      .select('slug, padre_slug')
      .eq('slug', cambios.padre_slug)
      .maybeSingle();

    if (!padre) {
      return NextResponse.json({ error: 'La categoría padre no existe.' }, { status: 400 });
    }
    const slugFinal = cambios.slug ?? actual.slug;
    if ((padre as Categoria).padre_slug === slugFinal) {
      return NextResponse.json(
        { error: 'No se puede: esa categoría ya es hija de esta.' },
        { status: 400 }
      );
    }
    // Jerarquia de un solo nivel, como el mega menu. Una hija de una hija no
    // se mostraria en ningun lado.
    if ((padre as Categoria).padre_slug !== null) {
      return NextResponse.json(
        { error: `"${(padre as Categoria).slug}" ya es una subcategoría: no puede tener hijas.` },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(cambios)
    .eq('id', id)
    .select(CATEGORIAS_SELECT)
    .single();

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: mensajeDePg(error) }, { status });
  }

  const actualizada = data as Categoria;
  const productos = await contarProductos(actualizada.slug);

  // El slug viaja en `?cat=` y en el JSON-LD del catalogo: si cambio, hay que
  // purgar tambien las paginas de producto, no solo el menu.
  refrescarCategorias();
  if (cambios.slug && cambios.slug !== actual.slug) refrescarCatalogo();

  return NextResponse.json({
    category: { ...actualizada, productos } satisfies CategoriaAdmin,
    /** Cuantos productos arrastro el CASCADE. La UI lo muestra en el toast. */
    reetiquetados: cambios.slug && cambios.slug !== actual.slug ? productos : 0,
  });
}

/**
 * Borrado explicito.
 *
 * Sin `?forzar=1` responde 409 con el conteo de productos afectados: es el
 * warning que pide el panel antes de dejar productos sin categoria. Con
 * `forzar` borra, y la FK (ON DELETE SET NULL) les pone `categoria = null`.
 * Las categorias hijas quedan como raices por el mismo motivo.
 */
export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  const { id } = await params;
  const forzar = new URL(req.url).searchParams.get('forzar') === '1';

  const { data: previo } = await supabaseAdmin
    .from('categories')
    .select(CATEGORIAS_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (!previo) {
    return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 });
  }
  const cat = previo as Categoria;

  const productos = await contarProductos(cat.slug);
  const { count: hijas } = await supabaseAdmin
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('padre_slug', cat.slug);

  if (!forzar && (productos > 0 || (hijas ?? 0) > 0)) {
    return NextResponse.json(
      {
        error: 'La categoría está en uso.',
        productos,
        hijas: hijas ?? 0,
        /** La UI usa esto para armar el texto del confirm. */
        requiereConfirmacion: true,
      },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: mensajeDePg(error) }, { status: 500 });

  refrescarCategorias();
  if (productos > 0) refrescarCatalogo();

  return NextResponse.json({ ok: true, productos, hijas: hijas ?? 0 });
}
