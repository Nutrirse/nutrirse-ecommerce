import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import HomeProducts from '@/components/HomeProducts';
import LogisticsBanner from '@/components/LogisticsBanner';
import { getCatalogoMinorista } from '@/lib/minorista';
import { getCategorias } from '@/lib/categorias-db';
import { getUsuario } from '@/lib/supabase-auth/server';
import { RUTAS } from '@/lib/modo';

export const metadata: Metadata = {
  title: 'Tienda Minorista',
  description:
    'Frutos secos, frutas desecadas y semillas en presentaciones chicas para tu casa. ' +
    'Envíos desde Salta a todo el país.',
  alternates: { canonical: '/minorista' },
};

// Depende de la cookie de sesion: no puede ser ISR. Si se cacheara, el
// primer visitante logueado le dejaria los precios a todos los anonimos.
export const dynamic = 'force-dynamic';

/**
 * Home del canal minorista. Misma arquitectura que /mayorista: hero,
 * destacados (HomeProducts) con CTA al catalogo completo y banner de envios.
 * El catalogo con filtros vive en /minorista/productos.
 * El gating (precios en null sin sesion + login en las cards) es el mismo
 * de los dos canales (lib/catalogo.ts). El bloque de sesion (SesionMinorista)
 * vive solo en /minorista/productos: esta home queda identica a /mayorista.
 */
export default async function MinoristaPage() {
  const usuario = await getUsuario();
  const [products, categorias] = await Promise.all([
    getCatalogoMinorista({ conPrecios: Boolean(usuario) }),
    getCategorias(),
  ]);

  return (
    <>
      <Hero categorias={categorias} catalogo={RUTAS.minorista.catalogo} canal="para tu casa" />

      <HomeProducts
        products={products}
        hasSession={Boolean(usuario)}
        catalogo={RUTAS.minorista.catalogo}
        eyebrow="Tienda minorista"
        titulo="Para tu casa"
      />

      {/* El cotizador por CP vive adentro del banner (ancla #envios). */}
      <LogisticsBanner />
    </>
  );
}
