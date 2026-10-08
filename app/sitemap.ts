import type { MetadataRoute } from 'next';
import { getCategoriasParaSitemap, type CategoriaSitemap } from '@/lib/products';
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
 * Lo que si se mapea desde Supabase son las categorias con stock activo,
 * por canal: cada tienda lista solo las categorias con al menos un producto
 * activo y visible en ella (`/productos?cat=...` y
 * `/minorista/productos?cat=...`). Su `lastModified` sale del `updated_at`
 * de los productos que contienen.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [mayorista, minorista] = await Promise.all([
    getCategoriasParaSitemap('mayorista'),
    getCategoriasParaSitemap('minorista'),
  ]);

  // La fecha mas reciente de cada catalogo sirve para su home y su listado.
  const ultimaDe = (categorias: CategoriaSitemap[]) =>
    categorias.reduce<Date | null>(
      (max, c) => (!max || c.lastModified > max ? c.lastModified : max),
      null
    ) ?? new Date();
  const ultima: Record<string, Date> = {
    '/mayorista': ultimaDe(mayorista),
    '/productos': ultimaDe(mayorista),
    '/minorista': ultimaDe(minorista),
    '/minorista/productos': ultimaDe(minorista),
  };

  const estaticas: MetadataRoute.Sitemap = ESTATICAS.map((p) => ({
    url: `${SITE_URL}${p.ruta}`,
    lastModified: ultima[p.ruta] ?? new Date(),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const porCategoria = (base: string, categorias: CategoriaSitemap[]): MetadataRoute.Sitemap =>
    categorias.map((c) => ({
      url: `${SITE_URL}${base}?cat=${encodeURIComponent(c.categoria)}`,
      lastModified: c.lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [
    ...estaticas,
    ...porCategoria('/productos', mayorista),
    ...porCategoria('/minorista/productos', minorista),
  ];
}
