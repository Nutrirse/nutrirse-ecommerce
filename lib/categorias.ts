/**
 * Nombres visibles de las categorias del catalogo.
 *
 * En la base los productos guardan slugs (`secos`, `reposteria-harinas`).
 * Mostrarlos crudos daba etiquetas como "secos" en el filtro, que no le
 * dice nada al comprador. Este mapa es la unica fuente del nombre visible;
 * el slug sigue siendo lo que viaja en `?cat=`.
 */
export const ETIQUETA_CATEGORIA: Record<string, string> = {
  'frutos-secos': 'Frutos Secos',
  mixes: 'Mixes de Frutos Secos',
  snacks: 'Snacks',
  secos: 'Frutas Desecadas',
  semillas: 'Semillas',
  aceites: 'Aceites Naturales',
  chocolates: 'Chocolates y Confituras',
  reposteria: 'Repostería',
  granola: 'Granola y Cereales',
  todos: 'Todos',
};

/** Prefijo de las subcategorias que se unificaron bajo "Repostería". */
const PREFIJO_REPOSTERIA = 'reposteria';

/**
 * Categorias dadas de baja del menu que igual tienen productos vivos en la
 * base. Sin este alias el producto queda huerfano: `CatalogView` arma los
 * chips desde `p.categoria`, asi que volveria a aparecer un chip
 * "Infusiones" y el mega menu no tendria como enlazarlo.
 *
 * - `infusiones`  -> Flor de Jamaica, un desecado.
 * - `suplementos` -> Psylium molido, cascara de semilla de Plantago.
 *
 * Es solo de presentacion: el slug fino sigue intacto en la base.
 */
const ALIAS_CATEGORIA: Record<string, string> = {
  infusiones: 'secos',
  suplementos: 'semillas',
};

/**
 * Colapsa las subcategorias de reposteria (`reposteria-insumos`,
 * `-chocolates`, `-coco`, `-harinas`) en una sola: el mega menu y el filtro
 * muestran "Repostería" y nada mas. Los productos conservan su slug fino en
 * la base, asi que no hace falta migrar nada.
 */
export const normalizarCategoria = (cat: string) =>
  cat.startsWith(PREFIJO_REPOSTERIA) ? PREFIJO_REPOSTERIA : ALIAS_CATEGORIA[cat] ?? cat;

/** Nombre visible de un slug. Si no esta mapeado, se muestra legible. */
export const etiquetaCategoria = (cat: string) =>
  ETIQUETA_CATEGORIA[normalizarCategoria(cat)] ??
  cat.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/** ¿El producto entra en el filtro elegido? "reposteria" abarca sus hijas. */
export const esDeCategoria = (categoriaProducto: string | null, filtro: string) => {
  if (filtro === 'todos') return true;
  if (!categoriaProducto) return false;
  return normalizarCategoria(categoriaProducto) === normalizarCategoria(filtro);
};

/* ------------------------------------------------------------------ */
/* Categorias creables desde el panel                                  */
/* ------------------------------------------------------------------ */

/**
 * Slug de una categoria escrita a mano en el panel: "Frutas Confitadas"
 * -> "frutas-confitadas". Gemelo de `slugify()` de lib/supabase-admin, pero
 * este vive en un modulo que si puede importar el navegador.
 */
export const slugCategoria = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/** Las del mega menu. `todos` es un filtro, no una categoria real. */
export const CATEGORIAS_BASE = Object.keys(ETIQUETA_CATEGORIA).filter((c) => c !== 'todos');

/**
 * Categorias que el panel ofrece en el selector: las del menu mas las que
 * ya existen en la base (incluidas las que el admin creo a mano). Asi una
 * categoria nueva queda disponible para el resto de los productos sin
 * pasar por el codigo.
 */
export function categoriasDisponibles(
  productos: { categoria: string | null }[]
): string[] {
  const usadas = productos
    .map((p) => p.categoria)
    .filter((c): c is string => Boolean(c));
  return [...new Set([...CATEGORIAS_BASE, ...usadas])].sort((a, b) =>
    etiquetaCategoria(a).localeCompare(etiquetaCategoria(b), 'es')
  );
}
