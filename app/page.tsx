import Hero from '@/components/Hero';
import HomeProducts from '@/components/HomeProducts';
import LogisticsBanner from '@/components/LogisticsBanner';
import { getProducts } from '@/lib/products';

// ISR: el catalogo se regenera cada hora en el edge de Vercel.
export const revalidate = 3600;
export const dynamic = 'force-static';

export default async function Home() {
  const products = await getProducts();

  return (
    <>
      <Hero />
      <HomeProducts products={products} />
      {/* El cotizador por CP vive adentro del banner (ancla #envios). */}
      <LogisticsBanner />
    </>
  );
}
