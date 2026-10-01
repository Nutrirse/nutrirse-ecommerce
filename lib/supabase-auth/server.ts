import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

/**
 * Cliente con la sesion del usuario final (login con Google). No confundir
 * con lib/supabase.ts (catalogo anonimo) ni con lib/supabase-admin.ts
 * (service_role). Solo Server Components y Route Handlers.
 */
export async function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
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
