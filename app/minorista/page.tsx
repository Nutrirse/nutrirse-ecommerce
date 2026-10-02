import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import CatalogView from '@/components/CatalogView';
import LogisticsBanner from '@/components/LogisticsBanner';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { getCatalogoMinorista } from '@/lib/minorista';
import { getCategorias } from '@/lib/categorias-db';
import { getUsuario } from '@/lib/supabase-auth/server';

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
 * Home + catalogo del canal minorista. Misma UI que el mayorista (hero,
 * filtros, grilla, banner de envios); cambian solo tres cosas:
 *   - el titulo ("Para tu casa"),
 *   - los datos: `precios_minoristas` en vez de las variantes por bulto,
 *   - el gating: sin sesion los precios llegan en null desde el servidor
 *     (lib/minorista.ts) y las cards muestran el login con Google.
 */
export default async function MinoristaPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string; error?: string }>;
}) {
  const { cat, q, error } = await searchParams;
  const usuario = await getUsuario();
  const [products, categorias] = await Promise.all([
    getCatalogoMinorista({ conPrecios: Boolean(usuario) }),
    getCategorias(),
  ]);

  const nombre =
    (usuario?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? usuario?.email;

  return (
    <>
      <Hero categorias={categorias} catalogo="/minorista" canal="para tu casa" />

      <section id="catalogo" className="scroll-mt-24 bg-crema pt-20 sm:pt-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Mismo encabezado que HomeProducts del mayorista. */}
          <header className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-tostado">
                Tienda minorista
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-hand)] text-[clamp(2.6rem,7vw,5rem)] font-semibold leading-[1.05] text-carbon">
                Para tu casa
              </h2>
            </div>

            {usuario ? (
              <div className="flex items-center gap-3 text-sm text-humo">
                <p>Hola {nombre}, ya ves los precios minoristas.</p>
                <form action="/auth/signout" method="post">
                  <button className="underline underline-offset-2 hover:text-carbon">Cerrar sesión</button>
                </form>
              </div>
            ) : (
              <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-hueso p-4">
                <p className="mb-3 text-sm text-humo">
                  Creá tu cuenta con Google para ver precios y recibir ofertas.
                </p>
                <GoogleLoginButton next="/minorista#catalogo" />
                {error === 'login' && (
                  <p className="mt-2 text-sm text-red-600">No pudimos iniciar sesión. Probá de nuevo.</p>
                )}
              </div>
            )}
          </header>
        </div>

        {/* `key`: el buscador del hero navega a esta misma ruta con otro
            ?q=. Sin remontar, CatalogView se quedaria con el estado viejo. */}
        <CatalogView
          key={`${cat ?? ''}|${q ?? ''}`}
          products={products}
          categorias={categorias}
          initialCat={cat ?? 'todos'}
          initialQuery={q ?? ''}
          preciosOcultos={!usuario}
          canal="minorista"
        />
      </section>

      {/* El cotizador por CP vive adentro del banner (ancla #envios). */}
      <LogisticsBanner />
    </>
  );
}
