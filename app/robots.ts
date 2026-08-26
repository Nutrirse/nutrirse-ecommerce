import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Se sirve en /robots.txt.
 *
 * Va como `robots.ts` y no como un .txt estatico porque el archivo tiene que
 * apuntar al sitemap con el dominio real, que sale de NEXT_PUBLIC_SITE_URL.
 * Hardcodearlo en un .txt significa que al cambiar de dominio el sitemap
 * queda apuntando al viejo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',      // panel de catalogo
          '/api/',       // endpoints, no son contenido
          '/checkout',   // paso de compra: no aporta nada en resultados
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
