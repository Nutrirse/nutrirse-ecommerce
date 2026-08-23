import type { Metadata } from 'next';
import ProductGrid from '@/components/ProductGrid';
import { getProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Catálogo mayorista de frutos secos, desecados, semillas y más.',
};

export const revalidate = 3600;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const products = await getProducts();

  return (
    <div className="bg-crema pt-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-tostado">
          Catálogo mayorista
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-tight tracking-tight text-carbon">
          Todos los productos
        </h1>
        <p className="mt-2 max-w-xl text-humo">
          Elegí la presentación, sumá al pedido y cerralo por WhatsApp.
        </p>
      </div>

      <ProductGrid products={products} initialCat={cat ?? 'todos'} showHeading={false} />
    </div>
  );
}
