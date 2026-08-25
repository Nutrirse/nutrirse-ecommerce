'use client';

import { usePathname } from 'next/navigation';

/**
 * Esconde el chrome del sitio (navbar, footer, carrito, WhatsApp) dentro de
 * /admin. El layout raiz es un Server Component y no puede leer la ruta sin
 * volverse dinamico, lo que tiraria abajo el prerender estatico de la home.
 */
export default function SoloSitioPublico({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <>{children}</>;
}
