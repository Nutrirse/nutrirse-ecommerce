import { revalidatePath } from 'next/cache';
import { slugCategoria } from './categorias';
import type { Categoria } from './categorias';

/** Fila del listado del panel: la categoria + cuantos productos la usan. */
export type CategoriaAdmin = Categoria & { productos: number };

/**
 * Traduce los errores de Postgres que el ABM puede provocar a algo que el
 * admin entienda. Sin esto, un slug repetido llega a la UI como
 * "duplicate key value violates unique constraint".
 */
export function mensajeDePg(e: { code?: string; message: string }): string {
  if (e.code === '23505') return 'Ya existe una categoría con ese slug.';
  if (e.code === '23514') return 'El slug solo admite minúsculas, números y guiones.';
  if (e.code === '23503') return 'La categoría padre elegida no existe.';
  if (e.code === '42P01') {
    return 'Falta correr supabase/migracion_categorias.sql en el proyecto de Supabase.';
  }
  return e.message;
}

/**
 * Validacion del payload del ABM de categorias. Igual que con productos: el
 * panel es de confianza, pero escribe con la service_role key, que ignora
 * RLS y los checks los paga el catalogo publico.
 */

export type CategoriaPayload = {
  nombre: string;
  slug: string;
  padre_slug: string | null;
  orden: number;
};

export class PayloadError extends Error {}

/** Mismo formato que exige el check de la tabla. */
const FORMATO_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function nombreValido(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!s) throw new PayloadError('La categoría necesita un nombre.');
  if (s.length > 80) throw new PayloadError('El nombre supera los 80 caracteres.');
  return s;
}

/**
 * Slug explicito o derivado del nombre. Se valida contra el mismo regex que
 * la base para que el error salga como mensaje y no como un 23514 crudo.
 */
function slugValido(slugCrudo: unknown, nombre: string): string {
  const s = slugCrudo == null || String(slugCrudo).trim() === ''
    ? slugCategoria(nombre)
    : slugCategoria(String(slugCrudo));

  if (!s) throw new PayloadError('No pudimos generar un slug para ese nombre.');
  if (!FORMATO_SLUG.test(s)) {
    throw new PayloadError('El slug solo admite minúsculas, números y guiones.');
  }
  return s;
}

function padreValido(v: unknown, slugPropio: string): string | null {
  if (v == null || String(v).trim() === '') return null;
  const s = slugCategoria(String(v));
  if (!s) return null;
  if (s === slugPropio) throw new PayloadError('Una categoría no puede ser su propio padre.');
  return s;
}

export function validarCategoria(body: unknown): CategoriaPayload {
  const o = (body ?? {}) as Record<string, unknown>;
  const nombre = nombreValido(o.nombre);
  const slug = slugValido(o.slug, nombre);
  return {
    nombre,
    slug,
    padre_slug: padreValido(o.padre_slug, slug),
    orden: Number.isFinite(Number(o.orden)) ? Math.trunc(Number(o.orden)) : 100,
  };
}

/** PATCH: solo los campos presentes. */
export function validarCategoriaParcial(
  body: unknown,
  slugActual: string
): Partial<CategoriaPayload> {
  const o = (body ?? {}) as Record<string, unknown>;
  const out: Partial<CategoriaPayload> = {};

  if ('nombre' in o) out.nombre = nombreValido(o.nombre);
  // El slug nuevo puede venir vacio: en ese caso se rederiva del nombre.
  if ('slug' in o) out.slug = slugValido(o.slug, out.nombre ?? slugActual);
  if ('padre_slug' in o) out.padre_slug = padreValido(o.padre_slug, out.slug ?? slugActual);
  if ('orden' in o) out.orden = Math.trunc(Number(o.orden) || 0);

  if (Object.keys(out).length === 0) throw new PayloadError('No hay cambios para guardar.');
  return out;
}

/**
 * Purga el ISR de todo lo que muestra categorias: el mega menu vive en el
 * layout, asi que un rename tiene que invalidar tambien las paginas que lo
 * heredan.
 */
export function refrescarCategorias(): void {
  revalidatePath('/', 'layout');
  revalidatePath('/productos');
}
