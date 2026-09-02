import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase-admin';
import {
  mensajeDePg,
  PayloadError,
  refrescarCategorias,
  validarCategoria,
  type CategoriaAdmin,
} from '@/lib/admin-categorias';
import { CATEGORIAS_SELECT } from '@/lib/categorias-db';
import type { Categoria } from '@/lib/categorias';

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

/**
 * Listado con el conteo de productos por categoria. El conteo es lo que
 * habilita el warning del borrado, asi que viaja siempre.
 */
export async function GET() {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  const [cats, prods] = await Promise.all([
    supabaseAdmin
      .from('categories')
      .select(CATEGORIAS_SELECT)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
    // Se cuenta en memoria y no con un group by por PostgREST: son decenas
    // de filas, y asi el endpoint no depende de una vista ni de un rpc.
    supabaseAdmin.from('products').select('categoria'),
  ]);

  if (cats.error) {
    return NextResponse.json({ error: mensajeDePg(cats.error) }, { status: 500 });
  }
  if (prods.error) {
    return NextResponse.json({ error: prods.error.message }, { status: 500 });
  }

  const uso = new Map<string, number>();
  for (const p of (prods.data ?? []) as { categoria: string | null }[]) {
    if (p.categoria) uso.set(p.categoria, (uso.get(p.categoria) ?? 0) + 1);
  }

  const categories: CategoriaAdmin[] = ((cats.data ?? []) as Categoria[]).map((c) => ({
    ...c,
    productos: uso.get(c.slug) ?? 0,
  }));

  // `sueltos`: productos con una categoria que no existe en la tabla. Solo
  // puede pasar si alguien escribio en la base sin la FK puesta.
  const conocidos = new Set(categories.map((c) => c.slug));
  const sueltos = [...uso.entries()]
    .filter(([slug]) => !conocidos.has(slug))
    .map(([slug, productos]) => ({ slug, productos }));

  return NextResponse.json({ categories, sueltos });
}

export async function POST(req: Request) {
  if (!(await haySesionAdmin())) return sinSesion();
  if (!isAdminConfigured || !supabaseAdmin) return sinConfig();

  let payload;
  try {
    payload = validarCategoria(await req.json());
  } catch (e) {
    const msg = e instanceof PayloadError ? e.message : 'JSON inválido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert(payload)
    .select(CATEGORIAS_SELECT)
    .single();

  if (error) {
    // 409 y no 500: es un conflicto de datos del admin, no una falla.
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: mensajeDePg(error) }, { status });
  }

  refrescarCategorias();
  return NextResponse.json(
    { category: { ...(data as Categoria), productos: 0 } satisfies CategoriaAdmin },
    { status: 201 }
  );
}
