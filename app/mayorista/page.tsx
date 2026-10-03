import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import HomeProducts from '@/components/HomeProducts';
import LogisticsBanner from '@/components/LogisticsBanner';
import { getCatalogoMayorista } from '@/lib/catalogo';
import { getCategorias } from '@/lib/categorias-db';
import { getUsuario } from '@/lib/supabase-auth/server';

export const metadata: Metadata = {
  title: 'Venta Mayorista',
  alternates: { canonical: '/mayorista' },
};

// Depende de la cookie de sesion (gating de precios): no puede ser ISR. Si
// se cacheara, el primer visitante logueado le dejaria los precios a todos.
export const dynamic = 'force-dynamic';

/** Home del canal mayorista (B2B). Antes vivia en `/`; ahora la raiz es el splash. */
export default async function MayoristaHome() {
  // Las categorias alimentan los CTA del Hero: si el admin renombra un slug
  // desde el ABM, los botones siguen apuntando al filtro correcto.
  const usuario = await getUsuario();
  const [products, categorias] = await Promise.all([
    getCatalogoMayorista({ conPrecios: Boolean(usuario) }),
    getCategorias(),
  ]);

  return (
    <>
      <Hero categorias={categorias} />
      <HomeProducts products={products} hasSession={Boolean(usuario)} />
      {/* El cotizador por CP vive adentro del banner (ancla #envios). */}
      <LogisticsBanner />
    </>
  );
}
