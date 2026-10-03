import type { Metadata } from 'next';
import CatalogView from '@/components/CatalogView';
import SesionMinorista from '@/components/SesionMinorista';
import { getCatalogoMinorista } from '@/lib/minorista';
import { getCategorias } from '@/lib/categorias-db';
import { getUsuario } from '@/lib/supabase-auth/server';

export const metadata: Metadata = {
  title: 'Catálogo Minorista',
  description:
    'Catálogo minorista completo de Nutrirse: frutos secos, frutas desecadas y semillas en ' +
    'presentaciones chicas para tu casa. Envíos desde Salta a todo el país.',
  alternates: { canonical: '/minorista/productos' },
};

// Gating de precios por sesion: dinamica, igual que /minorista.
export const dynamic = 'force-dynamic';

/** Catalogo completo del canal minorista (filtros + buscador). Par de /productos. */
export default async function MinoristaProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const usuario = await getUsuario();
  const [products, categorias] = await Promise.all([
    getCatalogoMinorista({ conPrecios: Boolean(usuario) }),
    getCategorias(),
  ]);

  return (
    <div id="catalogo" className="min-h-dvh scroll-mt-24 bg-crema pt-28">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-5 sm:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-tostado">
            Tienda minorista
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-tight text-carbon">
            Todos los productos
          </h1>
          <p className="mt-3 max-w-xl text-humo">
            Filtrá por categoría, precio o marca. Elegí la presentación y sumá al pedido.
          </p>
        </div>

        <SesionMinorista usuario={usuario} next="/minorista/productos" />
      </div>

      {/* `key`: el buscador del hero y el mega menu navegan a esta misma ruta
          con otro ?q= / ?cat=. Sin remontar, CatalogView se quedaria con el
          estado viejo. */}
      <CatalogView
        key={`${cat ?? ''}|${q ?? ''}`}
        products={products}
        categorias={categorias}
        initialCat={cat ?? 'todos'}
        initialQuery={q ?? ''}
        hasSession={Boolean(usuario)}
        canal="minorista"
      />
    </div>
  );
}
