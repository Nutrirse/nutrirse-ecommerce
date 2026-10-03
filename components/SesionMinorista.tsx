import type { User } from '@supabase/supabase-js';
import GoogleLoginButton from './GoogleLoginButton';

/**
 * Saludo + cerrar sesion, o la invitacion a loguearse con Google. Lo usan
 * la home minorista y su catalogo. Es solo UI: los precios los oculta el
 * servidor (lib/minorista.ts) cuando no hay sesion.
 */
export default function SesionMinorista({
  usuario,
  next,
  error = false,
}: {
  usuario: User | null;
  /** A donde vuelve el callback de OAuth. */
  next: string;
  error?: boolean;
}) {
  if (usuario) {
    const nombre =
      (usuario.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? usuario.email;
    return (
      <div className="flex items-center gap-3 text-sm text-humo">
        <p>Hola {nombre}, ya ves los precios minoristas.</p>
        <form action="/auth/signout" method="post">
          <button className="underline underline-offset-2 hover:text-carbon">Cerrar sesión</button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-hueso p-4">
      <p className="mb-3 text-sm text-humo">
        Creá tu cuenta con Google para ver precios y recibir ofertas.
      </p>
      <GoogleLoginButton next={next} />
      {error && (
        <p className="mt-2 text-sm text-red-600">No pudimos iniciar sesión. Probá de nuevo.</p>
      )}
    </div>
  );
}
