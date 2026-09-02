import { supabase, isSupabaseConfigured } from './supabase';
import { CATEGORIAS_BASE, etiquetaCategoria, normalizarCategoria } from './categorias';
import type { Categoria } from './categorias';

/**
 * Lectura publica de la tabla `categories`. La consumen el mega menu del
 * Navbar (via app/layout.tsx) y el filtro del catalogo.
 *
 * Se cachea con el mismo ISR que el catalogo: las categorias cambian menos
 * que los precios, y `refrescarCatalogo()` purga las dos cosas juntas.
 */
export const CATEGORIAS_SELECT = 'id, nombre, slug, padre_slug, orden';

/**
 * Fallback sin base: reconstruye el arbol desde los mapas hardcodeados de
 * lib/categorias.ts. Sirve en entornos sin Supabase (preview, `npm run dev`
 * sin .env) y si la migracion todavia no se corrio.
 */
function categoriasFallback(): Categoria[] {
  return CATEGORIAS_BASE.map((slug, i) => {
    const padre = normalizarCategoria(slug);
    return {
      id: `fallback-${slug}`,
      nombre: etiquetaCategoria(slug),
      slug,
      padre_slug: padre === slug ? null : padre,
      orden: (i + 1) * 10,
    };
  });
}

export async function getCategorias(): Promise<Categoria[]> {
  if (!isSupabaseConfigured || !supabase) return categoriasFallback();

  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORIAS_SELECT)
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) {
    // Tipico si la migracion no corrio todavia: la tabla no existe. La web
    // no se cae por eso, sigue con el menu hardcodeado.
    console.error('[categorias] supabase error:', error.message);
    return categoriasFallback();
  }
  // Tabla creada pero vacia: mejor el menu viejo que un menu sin nada.
  const filas = (data ?? []) as Categoria[];
  return filas.length > 0 ? filas : categoriasFallback();
}
