import Hero from '@/components/Hero';
import HomeProducts from '@/components/HomeProducts';
import LogisticsBanner from '@/components/LogisticsBanner';
import ShippingCalculator from '@/components/ShippingCalculator';
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
      <LogisticsBanner />

      <section id="envios" className="scroll-mt-24 bg-hueso py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-tostado">
              Costos de envío
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-hand)] text-[clamp(2.4rem,5.5vw,3.8rem)] font-semibold leading-[1.05] text-carbon">
              Calculá tu envío
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-humo">
              Trabajamos con Andreani, OCA y Correo Argentino, a domicilio o retiro
              en sucursal. Despacho dentro de las 24 h hábiles de confirmado el pedido.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-humo">
              {[
                'Embalaje reforzado para bultos completos',
                'Seguimiento por número de guía',
                'Retiro sin cargo en depósito (Salta Capital)',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tostado" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:pl-6">
            <ShippingCalculator />
          </div>
        </div>
      </section>
    </>
  );
}
