import Hero from '@/components/Hero';
import HomeProducts from '@/components/HomeProducts';
import ShippingCalculator from '@/components/ShippingCalculator';
import { getProducts, CATALOG_REVALIDATE } from '@/lib/products';

// ISR: el catalogo se regenera cada hora en el edge de Vercel.
export const revalidate = 3600;
export const dynamic = 'force-static';

export default async function Home() {
  const products = await getProducts();

  return (
    <>
      <Hero />
      <HomeProducts products={products} />

      <section id="envios" className="scroll-mt-20 bg-hueso py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-tostado">Logística</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-tight text-carbon">
              De Salta a todo el país.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-humo">
              Trabajamos con Andreani, OCA y Correo Argentino, a domicilio o retiro
              en sucursal. Despacho dentro de las 24 h hábiles de confirmado el pedido.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-humo">
              {[
                'Embalaje reforzado para bolsas de 25 kg',
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
