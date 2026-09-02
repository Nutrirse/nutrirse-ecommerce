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


/* ================================================================== */
/* Categorias como entidad real (tabla `categories`)                   */
/*                                                                     */
/* Todo lo de arriba es el fallback: los mapas hardcodeados que se      */
/* usaban antes de que existiera la tabla. Siguen vivos porque         */
/* lib/fallback-products.ts y los entornos sin Supabase configurado    */
/* no tienen de donde leer, pero la fuente de verdad es la base.       */
/* ================================================================== */

export type Categoria = {
  id: string;
  nombre: string;
  slug: string;
  /** null = categoria raiz (la que entra al mega menu). */
  padre_slug: string | null;
  orden: number;
};

/**
 * Vista consultable del arbol de categorias. La arman igual el servidor
 * (Navbar via layout) y el cliente (CatalogView, panel admin) con las filas
 * que devuelve la API, para que los dos resuelvan etiquetas y filtros con
 * la misma regla.
 *
 * Con `cats` vacio cae al comportamiento viejo (mapas hardcodeados), asi la
 * web sigue en pie si la tabla todavia no se migro.
 */
export type IndiceCategorias = {
  /** Todas, ordenadas por `orden` y nombre. */
  todas: Categoria[];
  /** Solo las raices, ordenadas. Es la estructura del mega menu. */
  raices: Categoria[];
  /** Hijas directas de un slug, ordenadas. */
  hijas: (slug: string) => Categoria[];
  /** Nombre visible de un slug. Nunca devuelve vacio. */
  etiqueta: (slug: string) => string;
  /** Raiz de un slug: `reposteria-harinas` -> `reposteria`. */
  raiz: (slug: string) => string;
  /** ¿El producto entra en el filtro? Una raiz abarca a sus hijas. */
  incluye: (categoriaProducto: string | null, filtro: string) => boolean;
  /**
   * Encuentra la categoria vigente a partir de una referencia fija escrita
   * en el codigo (los slides del Hero). Devuelve null si no existe ninguna.
   */
  resolver: (ref: RefCategoria) => Categoria | null;
};

/**
 * Referencia estable a una categoria desde codigo. El slug puede cambiar
 * (el admin lo renombra desde el ABM), asi que se guardan las dos claves y
 * se resuelve por la que siga viva.
 */
export type RefCategoria = {
  /** Slug con el que nacio la categoria en la migracion. */
  slug: string;
  /** Nombre visible con el que nacio. Es la segunda clave de busqueda. */
  nombre: string;
};

/** Compara nombres ignorando tildes, mayusculas y espacios de sobra. */
const clave = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const porOrden = (a: Categoria, b: Categoria) =>
  a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es');

export function indiceCategorias(cats: Categoria[] = []): IndiceCategorias {
  const todas = [...cats].sort(porOrden);
  const porSlug = new Map(todas.map((c) => [c.slug, c]));
  // Un nombre repetido no deberia existir, pero si pasa gana el primero por
  // `orden`: es el que el menu muestra mas arriba.
  const porNombre = new Map<string, Categoria>();
  for (const c of todas) if (!porNombre.has(clave(c.nombre))) porNombre.set(clave(c.nombre), c);
  const vacio = todas.length === 0;

  const raiz = (slug: string): string => {
    if (vacio) return normalizarCategoria(slug);
    return porSlug.get(slug)?.padre_slug ?? slug;
  };

  return {
    todas,
    raices: todas.filter((c) => c.padre_slug === null),
    hijas: (slug) => todas.filter((c) => c.padre_slug === slug),
    etiqueta: (slug) => porSlug.get(slug)?.nombre ?? etiquetaCategoria(slug),
    raiz,
    /**
     * Orden de busqueda: primero el slug (lo normal), despues el nombre
     * visible (el admin renombro el slug pero no el rotulo). Si las dos
     * fallan, null: quien llama decide como degradar, y nunca se arma un
     * `?cat=` que apunte a una categoria inexistente.
     */
    resolver: ({ slug, nombre }) => porSlug.get(slug) ?? porNombre.get(clave(nombre)) ?? null,
    incluye: (categoriaProducto, filtro) => {
      if (filtro === 'todos') return true;
      if (!categoriaProducto) return false;
      if (vacio) return esDeCategoria(categoriaProducto, filtro);
      // Coincide la categoria exacta o su raiz: filtrar por "Repostería"
      // trae tambien harinas, coco e insumos.
      return (
        categoriaProducto === filtro ||
        raiz(categoriaProducto) === filtro ||
        raiz(categoriaProducto) === raiz(filtro)
      );
    },
  };
}
