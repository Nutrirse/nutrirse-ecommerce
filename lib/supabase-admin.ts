import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de escritura para el panel admin.
 *
 * IMPORTANTE: usa la service_role key, que ignora RLS. Este modulo NO puede
 * importarse desde un Client Component: solo desde Route Handlers o Server
 * Components. La guarda de abajo lo hace explotar si alguna vez termina en
 * el bundle del navegador, en vez de fallar en silencio.
 *
 * La `anon key` no sirve para escribir: la unica policy de `products` es un
 * SELECT de filas activas (ver supabase/schema.sql).
 */
if (typeof window !== 'undefined') {
  throw new Error('lib/supabase-admin solo puede usarse en el servidor.');
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isAdminConfigured = Boolean(url && serviceKey);

export const supabaseAdmin: SupabaseClient | null = isAdminConfigured
  ? createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

/** Bucket publico de imagenes de producto. Ver supabase/storage.sql. */
export const BUCKET = 'productos';

export const MAX_IMAGEN_BYTES = 5 * 1024 * 1024; // 5 MB
const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/* ------------------------------------------------------------------ */
/* Slugs                                                               */
/* ------------------------------------------------------------------ */

/** "Nuez Mariposa Extra" -> "nuez-mariposa-extra". Sin acentos ni simbolos. */
export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Devuelve un slug libre. `slug` tiene unique en la tabla, asi que sin esto
 * un segundo "Almendra" reventaria el insert con un 23505 poco explicativo.
 */
export async function slugLibre(base: string, ignorarId?: string): Promise<string> {
  const raiz = slugify(base) || 'producto';
  if (!supabaseAdmin) return raiz;

  const { data } = await supabaseAdmin
    .from('products')
    .select('id, slug')
    .like('slug', `${raiz}%`);

  const tomados = new Set(
    (data ?? []).filter((r) => r.id !== ignorarId).map((r) => r.slug as string)
  );
  if (!tomados.has(raiz)) return raiz;

  for (let i = 2; i < 200; i++) {
    const candidato = `${raiz}-${i}`;
    if (!tomados.has(candidato)) return candidato;
  }
  return `${raiz}-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

export type SubidaOk = { url: string; path: string };

/**
 * Sube una imagen al bucket `productos` y devuelve su URL publica.
 * El nombre lleva timestamp: sobrescribir el mismo path dejaria la imagen
 * vieja cacheada en el CDN de Supabase.
 */
export async function subirImagenProducto(
  file: File,
  slug: string
): Promise<SubidaOk> {
  if (!supabaseAdmin) throw new Error('Supabase admin no configurado.');

  if (!MIME_PERMITIDOS.includes(file.type)) {
    throw new Error(`Formato no permitido (${file.type || 'desconocido'}). Usá JPG, PNG, WEBP o AVIF.`);
  }
  if (file.size > MAX_IMAGEN_BYTES) {
    throw new Error(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 5 MB.`);
  }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${slugify(slug) || 'producto'}/${Date.now()}.${ext || 'jpg'}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });

  if (error) throw new Error(`No pudimos subir la imagen: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Extrae el path interno de una URL publica del bucket.
 * `https://xxx.supabase.co/storage/v1/object/public/productos/nuez/123.jpg`
 *   -> `nuez/123.jpg`. Devuelve null si la URL es externa (Unsplash, etc.).
 */
export function pathDesdeUrlPublica(url: string | null): string | null {
  if (!url) return null;
  const marca = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marca);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marca.length));
}

/**
 * Borra del bucket la imagen que apunta esa URL. No tira error si la URL es
 * externa o el objeto ya no existe: es limpieza best-effort, no debe tumbar
 * el borrado del producto.
 */
export async function borrarImagenPorUrl(url: string | null): Promise<void> {
  const path = pathDesdeUrlPublica(url);
  if (!path || !supabaseAdmin) return;
  await supabaseAdmin.storage.from(BUCKET).remove([path]);
}
