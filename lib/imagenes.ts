import type { Product } from '@/types';

/** Tope de fotos por producto. Lo replican la UI y el check de la base. */
export const MAX_IMAGENES = 3;

/**
 * Galeria normalizada de un producto, siempre en orden y sin repetidos.
 *
 * Convive con datos de tres epocas: filas viejas que solo tienen
 * `imagen_url`, filas nuevas con `imagenes`, y el fallback estatico que no
 * conoce el campo. Nadie deberia leer `p.imagenes` directo.
 */
export function imagenesDe(p: Pick<Product, 'imagen_url' | 'imagenes'>): string[] {
  const galeria = Array.isArray(p.imagenes) ? p.imagenes.filter(Boolean) : [];
  const todas = galeria.length > 0 ? galeria : p.imagen_url ? [p.imagen_url] : [];
  return [...new Set(todas)].slice(0, MAX_IMAGENES);
}

/** ¿Vale la pena montar el slider? */
export function tieneGaleria(p: Pick<Product, 'imagen_url' | 'imagenes'>): boolean {
  return imagenesDe(p).length > 1;
}
