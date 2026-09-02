import Hero from '@/components/Hero';
import HomeProducts from '@/components/HomeProducts';
import LogisticsBanner from '@/components/LogisticsBanner';
import { getProducts } from '@/lib/products';
import { getCategorias } from '@/lib/categorias-db';

// ISR: el catalogo se regenera cada hora en el edge de Vercel.
export const revalidate = 3600;
export const dynamic = 'force-static';

export default async function Home() {
  // Las categorias alimentan los CTA del Hero: si el admin renombra un slug
  // desde el ABM, los botones siguen apuntando al filtro correcto.
  const [products, categorias] = await Promise.all([getProducts(), getCategorias()]);

  return (
    <>
      <Hero categorias={categorias} />
      <HomeProducts products={products} />
      {/* El cotizador por CP vive adentro del banner (ancla #envios). */}
      <LogisticsBanner />
    </>
  );
}
