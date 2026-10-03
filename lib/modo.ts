/**
 * Canal de venta elegido en el splash. La ruta manda (`/minorista`,
 * `/mayorista`, `/productos`); en las paginas neutras (contacto, quienes
 * somos...) se usa el ultimo modo visitado, guardado en localStorage.
 */
export type Modo = 'minorista' | 'mayorista';

const CLAVE = 'nutrirse:modo';

export function modoDeRuta(pathname: string | null): Modo | null {
  if (!pathname) return null;
  if (pathname.startsWith('/minorista')) return 'minorista';
  if (pathname.startsWith('/mayorista') || pathname.startsWith('/productos')) return 'mayorista';
  return null;
}

export function leerModoGuardado(): Modo | null {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === 'minorista' || v === 'mayorista' ? v : null;
  } catch {
    return null;
  }
}

export function guardarModo(modo: Modo) {
  try {
    localStorage.setItem(CLAVE, modo);
  } catch {
    // Modo privado o storage bloqueado: solo se pierde el recuerdo.
  }
}

/** Home y catalogo de cada canal. */
export const RUTAS: Record<Modo, { home: string; catalogo: string }> = {
  mayorista: { home: '/mayorista', catalogo: '/productos' },
  minorista: { home: '/minorista', catalogo: '/minorista/productos' },
};
