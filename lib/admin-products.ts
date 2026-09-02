import { revalidatePath } from 'next/cache';
import { MAX_IMAGENES } from './imagenes';
import type { Variant } from '@/types';

/**
 * Validacion del payload que manda el panel. El cliente admin es de
 * confianza, pero la service_role key ignora RLS: si algo llega mal formado
 * lo escribe igual y rompe el catalogo publico (`precios_por_variante` se
 * mapea sin defensa en lib/products.ts).
 */

export type ProductoPayload = {
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  imagen_url: string | null;
  imagenes: string[];
  activo: boolean;
  orden: number;
  precios_por_variante: Variant[];
};

export class PayloadError extends Error {}

function texto(v: unknown, campo: string, max = 200, obligatorio = false): string | null {
  if (v == null || v === '') {
    if (obligatorio) throw new PayloadError(`Falta ${campo}.`);
    return null;
  }
  const s = String(v).trim();
  if (obligatorio && !s) throw new PayloadError(`Falta ${campo}.`);
  if (s.length > max) throw new PayloadError(`${campo} supera los ${max} caracteres.`);
  return s || null;
}

/** Solo http(s). Evita guardar `javascript:` o `data:` en el src de <Image>. */
function urlImagen(v: unknown): string | null {
  const s = texto(v, 'imagen', 600);
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) throw new PayloadError('La URL de imagen debe empezar con http(s).');
  return s;
}

/**
 * Galeria: hasta MAX_IMAGENES urls http(s), en orden y sin repetidos.
 * La posicion 0 es la principal.
 */
export function validarImagenes(v: unknown): string[] {
  if (v == null) return [];
  if (!Array.isArray(v)) throw new PayloadError('Las imágenes deben venir como lista.');

  const urls = v
    .map((raw) => (raw == null ? '' : String(raw).trim()))
    .filter((s) => s.length > 0);

  const unicas = [...new Set(urls)];
  if (unicas.length > MAX_IMAGENES) {
    throw new PayloadError(`Máximo ${MAX_IMAGENES} imágenes por producto.`);
  }
  for (const u of unicas) {
    if (u.length > 600) throw new PayloadError('Una de las URLs de imagen es demasiado larga.');
    if (!/^https?:\/\//i.test(u)) {
      throw new PayloadError('La URL de imagen debe empezar con http(s).');
    }
  }
  return unicas;
}

export function validarVariantes(v: unknown): Variant[] {
  if (!Array.isArray(v) || v.length === 0) {
    throw new PayloadError('El producto necesita al menos una variante.');
  }
  if (v.length > 12) throw new PayloadError('Máximo 12 variantes por producto.');

  const ids = new Set<string>();
  return v.map((raw, i) => {
    const o = (raw ?? {}) as Record<string, unknown>;
    const id = String(o.id ?? '').trim();
    const label = String(o.label ?? '').trim();
    if (!id) throw new PayloadError(`La variante #${i + 1} no tiene id.`);
    if (!label) throw new PayloadError(`La variante "${id}" no tiene nombre.`);
    if (ids.has(id)) throw new PayloadError(`El id de variante "${id}" está repetido.`);
    ids.add(id);

    const tipo = o.tipo === 'consultar' ? 'consultar' : 'precio';

    // `consultar` fuerza precio null: un numero ahi se mostraria en la web
    // aunque la variante diga "a cotizar".
    let precio: number | null = null;
    if (tipo === 'precio') {
      const n = Number(o.precio);
      if (!Number.isFinite(n) || n < 0) {
        throw new PayloadError(`El precio de "${label}" no es un número válido.`);
      }
      precio = Math.round(n);
    }

    const peso = Number(o.peso_kg);
    if (!Number.isFinite(peso) || peso <= 0) {
      throw new PayloadError(`El peso de "${label}" debe ser mayor a 0.`);
    }

    return { id, label, tipo, precio, peso_kg: peso } as Variant;
  });
}

/**
 * Resuelve el par galeria + principal desde el body.
 *
 * La principal es siempre la primera de la galeria. Si el body trae solo
 * `imagen_url` (clientes viejos, o el PATCH inline de la grilla), se la trata
 * como una galeria de una sola foto.
 */
function conImagenPrincipal(o: Record<string, unknown>): {
  imagen_url: string | null;
  imagenes: string[];
} {
  const galeria =
    'imagenes' in o ? validarImagenes(o.imagenes) : ([urlImagen(o.imagen_url)].filter(Boolean) as string[]);

  return { imagen_url: galeria[0] ?? null, imagenes: galeria };
}

/** Payload completo (POST de alta). */
export function validarProducto(body: unknown): ProductoPayload {
  const o = (body ?? {}) as Record<string, unknown>;
  return {
    nombre: texto(o.nombre, 'el nombre', 160, true)!,
    categoria: texto(o.categoria, 'la categoría', 80),
    descripcion: texto(o.descripcion, 'la descripción', 2000),
    ...conImagenPrincipal(o),
    activo: o.activo !== false,
    orden: Number.isFinite(Number(o.orden)) ? Math.trunc(Number(o.orden)) : 0,
    precios_por_variante: validarVariantes(o.precios_por_variante),
  };
}

/** Payload parcial (PATCH desde la grilla: un precio, el estado, etc.). */
export function validarParcial(body: unknown): Partial<ProductoPayload> {
  const o = (body ?? {}) as Record<string, unknown>;
  const out: Partial<ProductoPayload> = {};

  if ('nombre' in o) out.nombre = texto(o.nombre, 'el nombre', 160, true)!;
  if ('categoria' in o) out.categoria = texto(o.categoria, 'la categoría', 80);
  if ('descripcion' in o) out.descripcion = texto(o.descripcion, 'la descripción', 2000);
  // `imagenes` e `imagen_url` viajan juntas o no viajan: la base tiene un
  // check que exige imagenes[1] = imagen_url, y un PATCH que toque solo una
  // de las dos lo violaria.
  if ('imagenes' in o || 'imagen_url' in o) Object.assign(out, conImagenPrincipal(o));
  if ('activo' in o) out.activo = Boolean(o.activo);
  if ('orden' in o) out.orden = Math.trunc(Number(o.orden) || 0);
  if ('precios_por_variante' in o) {
    out.precios_por_variante = validarVariantes(o.precios_por_variante);
  }

  if (Object.keys(out).length === 0) throw new PayloadError('No hay cambios para guardar.');
  return out;
}

/**
 * Purga el ISR del catalogo. Sin esto un cambio de precio tarda hasta
 * `revalidate = 3600` en verse en la web (app/page.tsx, app/productos).
 */
export function refrescarCatalogo(): void {
  revalidatePath('/');
  revalidatePath('/productos');
}
