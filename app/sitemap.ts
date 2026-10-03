import type { MetadataRoute } from 'next';
import { getCategoriasParaSitemap } from '@/lib/products';
import { SITE_URL } from '@/lib/site';

// Se regenera con el mismo ritmo que el catalogo (app/page.tsx).
export const revalidate = 3600;

/** Paginas fijas. `priority` es relativa entre URLs del propio sitio. */
const ESTATICAS: Array<{
  ruta: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { ruta: '/', changeFrequency: 'yearly', priority: 1 },
  { ruta: '/mayorista', changeFrequency: 'weekly', priority: 0.9 },
  { ruta: '/minorista', changeFrequency: 'weekly', priority: 0.9 },
  { ruta: '/minorista/productos', changeFrequency: 'daily', priority: 0.8 },
  { ruta: '/productos', changeFrequency: 'daily', priority: 0.9 },
  { ruta: '/quienes-somos', changeFrequency: 'yearly', priority: 0.6 },
  { ruta: '/contacto', changeFrequency: 'yearly', priority: 0.6 },
  { ruta: '/politica-de-devolucion', changeFrequency: 'yearly', priority: 0.4 },
];

/**
 * Se sirve en /sitemap.xml.
 *
 * NOTA sobre los productos: no se listan uno por uno a proposito. Hoy no
 * existe una ruta `/productos/[slug]` — el detalle vive en un modal sobre
 * el catalogo, sin URL propia. Meter URLs de producto en el sitemap las
 * mandaria a un 404 y eso penaliza el rastreo del sitio entero.
 *
 * Lo que si se mapea desde Supabase son las categorias con stock activo:
 * son URLs reales (`/productos?cat=...`) y su `lastModified` sale del
 * `updated_at` de los productos que contienen.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categorias = await getCategoriasParaSitemap();

  // La fecha mas reciente de todo el catalogo sirve para la home mayorista y el listado.
  const ultimaDelCatalogo =
    categorias.reduce<Date | null>(
      (max, c) => (!max || c.lastModified > max ? c.lastModified : max),
      null
    ) ?? new Date();

  const estaticas: MetadataRoute.Sitemap = ESTATICAS.map((p) => ({
    url: `${SITE_URL}${p.ruta}`,
    lastModified: p.ruta === '/mayorista' || p.ruta === '/productos' ? ultimaDelCatalogo : new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const porCategoria: MetadataRoute.Sitemap = categorias.map((c) => ({
    url: `${SITE_URL}/productos?cat=${encodeURIComponent(c.categoria)}`,
    lastModified: c.lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...estaticas, ...porCategoria];
}
