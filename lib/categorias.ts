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
  aceites: 'Aceites y Condimentos',
  chocolates: 'Chocolates y Confituras',
  reposteria: 'Repostería',
  granola: 'Granola y Cereales',
  infusiones: 'Infusiones',
  suplementos: 'Suplementos',
  todos: 'Todos',
};

/** Prefijo de las subcategorias que se unificaron bajo "Repostería". */
const PREFIJO_REPOSTERIA = 'reposteria';

/**
 * Colapsa las subcategorias de reposteria (`reposteria-insumos`,
 * `-chocolates`, `-coco`, `-harinas`) en una sola: el mega menu y el filtro
 * muestran "Repostería" y nada mas. Los productos conservan su slug fino en
 * la base, asi que no hace falta migrar nada.
 */
export const normalizarCategoria = (cat: string) =>
  cat.startsWith(PREFIJO_REPOSTERIA) ? PREFIJO_REPOSTERIA : cat;

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
