'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { guardarModo, leerModoGuardado, modoDeRuta, type Modo } from './modo';

/**
 * Canal activo para los componentes cliente (navbar, footer, Quienes Somos).
 * La ruta manda (`/minorista`, `/mayorista`, `/productos`); en las paginas
 * neutras se usa el ultimo canal visitado. Default: mayorista.
 *
 * El valor guardado se lee recien en el efecto (localStorage no existe en el
 * SSR), asi que el primer render de una pagina neutra es mayorista.
 */
export function useModo(): Modo {
  const modoRuta = modoDeRuta(usePathname());
  const [guardado, setGuardado] = useState<Modo | null>(null);

  useEffect(() => {
    if (modoRuta) guardarModo(modoRuta);
    else setGuardado(leerModoGuardado());
  }, [modoRuta]);

  return modoRuta ?? guardado ?? 'mayorista';
}
