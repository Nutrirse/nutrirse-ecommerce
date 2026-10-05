import type { Metadata } from 'next';
import CatalogView from '@/components/CatalogView';
import { getCatalogoMayorista } from '@/lib/catalogo';
import { getCategorias } from '@/lib/categorias-db';
import { getUsuario } from '@/lib/supabase-auth/server';

export const metadata: Metadata = {
  title: 'Catálogo Mayorista',
  description:
    'Catálogo mayorista completo de Nutrirse: frutos secos, frutas desecadas, semillas, ' +
    'granolas e insumos de repostería. Precios por 5 kg, bulto cerrado y volumen, con envío ' +
    'desde Salta a todo el país.',
  // Sin esto hereda el canonical del layout ('/') y las dos URLs competirían.
  alternates: { canonical: '/productos' },
  openGraph: {
    title: 'Catálogo Mayorista | Nutrirse',
    description:
      'Frutos secos, desecados y semillas por mayor. Mínimo 5 kg, envíos a todo el país.',
    url: '/productos',
    type: 'website',
  },
};

// Gating de precios por sesion: dinamica, igual que /mayorista.
export const dynamic = 'force-dynamic';

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const usuario = await getUsuario();
  const [products, categorias] = await Promise.all([
    getCatalogoMayorista({ conPrecios: Boolean(usuario) }),
    getCategorias(),
  ]);

  return (
    <div className="min-h-dvh bg-crema pt-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-tostado">
          Catálogo mayorista
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-tight text-carbon">
          Todos los productos
        </h1>
        <p className="mt-3 max-w-xl text-humo">
          Filtrá por categoría, precio o marca. Elegí la presentación y sumá al pedido.
        </p>
      </div>

      <CatalogView
        products={products}
        categorias={categorias}
        initialCat={cat ?? 'todos'}
        initialQuery={q ?? ''}
        preciosVisibles={Boolean(usuario)}
      />
    </div>
  );
}
