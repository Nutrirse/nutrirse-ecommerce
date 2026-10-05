import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import HomeProducts from '@/components/HomeProducts';
import LogisticsBanner from '@/components/LogisticsBanner';
import { getCatalogoMinorista } from '@/lib/minorista';
import { getCategorias } from '@/lib/categorias-db';
import { RUTAS } from '@/lib/modo';

export const metadata: Metadata = {
  title: 'Tienda Minorista',
  description:
    'Frutos secos, frutas desecadas y semillas en presentaciones chicas para tu casa. ' +
    'Envíos desde Salta a todo el país.',
  alternates: { canonical: '/minorista' },
};

// Ya no depende de la sesion (precios publicos), pero sigue dinamica: un
// precio que el admin cambia se ve al instante, sin esperar el ISR.
export const dynamic = 'force-dynamic';

/**
 * Home del canal minorista. Misma arquitectura que /mayorista: hero,
 * destacados (HomeProducts) con CTA al catalogo completo y banner de envios.
 * El catalogo con filtros vive en /minorista/productos.
 * Precios publicos: sin gating por sesion (el candado es solo mayorista).
 * El bloque de sesion (SesionMinorista) vive solo en /minorista/productos:
 * esta home queda identica a /mayorista.
 */
export default async function MinoristaPage() {
  const [products, categorias] = await Promise.all([
    getCatalogoMinorista(),
    getCategorias(),
  ]);

  return (
    <>
      <Hero categorias={categorias} catalogo={RUTAS.minorista.catalogo} canal="para tu casa" />

      <HomeProducts
        products={products}
        preciosVisibles
        catalogo={RUTAS.minorista.catalogo}
        eyebrow="Tienda minorista"
        titulo="Para tu casa"
      />

      {/* El cotizador por CP vive adentro del banner (ancla #envios). */}
      <LogisticsBanner />
    </>
  );
}
