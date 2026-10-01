import type { Metadata } from 'next';
import CatalogView from '@/components/CatalogView';
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
    <div className="min-h-dvh bg-crema pt-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-tostado">
          Tienda minorista
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-tight text-carbon">
          Para tu casa
        </h1>

        {usuario ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-humo">
            <p>Hola {nombre}, ya ves los precios minoristas.</p>
            <form action="/auth/signout" method="post">
              <button className="text-sm underline underline-offset-2 hover:text-carbon">
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-4 max-w-sm">
            <p className="mb-3 text-humo">
              Entrá con tu cuenta de Google para ver precios y recibir ofertas.
            </p>
            <GoogleLoginButton />
            {error === 'login' && (
              <p className="mt-2 text-sm text-red-600">No pudimos iniciar sesión. Probá de nuevo.</p>
            )}
          </div>
        )}
      </div>

      <CatalogView
        products={products}
        categorias={categorias}
        initialCat={cat ?? 'todos'}
        initialQuery={q ?? ''}
        preciosOcultos={!usuario}
      />
    </div>
  );
}
