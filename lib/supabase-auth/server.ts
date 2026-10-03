import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

/**
 * Cookie con la ruta a la que volver despues del OAuth. La escribe
 * `iniciarSesionGoogle` (components/GoogleLoginButton.tsx) antes de salir
 * hacia Google y la lee /auth/callback. Es el plan B por si Supabase
 * descarta el `?next=` del redirectTo (ver middleware.ts).
 */
export const COOKIE_NEXT = 'nutrirse_next';

/** Solo rutas internas: evita usar el callback como open redirect. */
export function rutaInterna(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  return ruta.startsWith('/') && !ruta.startsWith('//') && !ruta.startsWith('/\\') ? ruta : null;
}

function credenciales() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

/**
 * Cliente con la sesion del usuario final (login con Google). No confundir
 * con lib/supabase.ts (catalogo anonimo) ni con lib/supabase-admin.ts
 * (service_role). Para Server Components: solo lee la sesion.
 */
export async function createSupabaseServer() {
  const cred = credenciales();
  if (!cred) return null;

  const cookieStore = await cookies();
  return createServerClient(cred.url, cred.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Desde un Server Component no se pueden escribir cookies. El
          // middleware ya refresco la sesion, asi que se puede ignorar.
        }
      },
    },
  });
}

/**
 * Cliente para Route Handlers que escriben la sesion (callback, signout).
 * Las cookies que pide escribir Supabase se juntan y se copian a mano en el
 * redirect con `responder()`: no dependemos de que Next mezcle las de
 * `cookies()` con un NextResponse creado aparte.
 */
export function createSupabaseRoute(request: NextRequest) {
  const cred = credenciales();
  const pendientes: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = cred
    ? createServerClient(cred.url, cred.anonKey, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (lista) => {
            pendientes.push(...lista);
          },
        },
      })
    : null;

  const responder = (destino: string | URL, init?: { status?: number }) => {
    const res = NextResponse.redirect(destino, init?.status ?? 307);
    pendientes.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  };

  return { supabase, responder };
}

/**
 * Usuario logueado o null. Usa getUser() y no getSession(): getUser valida
 * el JWT contra Supabase; getSession solo lee la cookie, que el cliente
 * puede falsificar. Es lo que decide si se mandan precios al navegador.
 */
export async function getUsuario(): Promise<User | null> {
  const supabase = await createSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
