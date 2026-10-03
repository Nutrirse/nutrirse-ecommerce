'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useMemo, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useCart, selectCount } from '@/store/cart';
import { indiceCategorias, type Categoria } from '@/lib/categorias';
import { RUTAS, type Modo } from '@/lib/modo';
import { useModo } from '@/lib/use-modo';
import { createSupabaseBrowser } from '@/lib/supabase-auth/browser';
import { iniciarSesionGoogle } from './GoogleLoginButton';

/* ------------------------------------------------------------------ */
/* Estructura del mega menu                                            */
/* ------------------------------------------------------------------ */

type MenuItem = { label: string; cat: string };
type MenuGroup = { title: string; cat: string; items: MenuItem[] };

/**
 * Fallback del mega menu: la estructura que se usaba antes de que las
 * categorias fueran una tabla. Solo se muestra si `categorias` llega vacio
 * (Supabase sin configurar, o la migracion sin correr).
 */
const MEGA_FALLBACK: MenuGroup[][] = [
  // Columna 1
  [
    {
      title: 'Frutos Secos y Snacks',
      cat: 'frutos-secos',
      items: [
        { label: 'Mixes', cat: 'mixes' },
        { label: 'Snacks', cat: 'snacks' },
      ],
    },
    { title: 'Frutas Desecadas', cat: 'secos', items: [] },
  ],
  // Columna 2
  [
    { title: 'Aceites Naturales', cat: 'aceites', items: [] },
    { title: 'Chocolates y Confituras', cat: 'chocolates', items: [] },
  ],
  // Columna 3
  [
    // Una sola entrada: insumos, chocolates, coco y harinas viajan todas
    // bajo `reposteria` (ver lib/categorias.ts).
    { title: 'Repostería', cat: 'reposteria', items: [] },
  ],
  // Columna 4
  [
    { title: 'Semillas', cat: 'semillas', items: [] },
    { title: 'Granola y Cereales', cat: 'granola', items: [] },
  ],
];

/**
 * Productos apunta al catalogo del canal activo. Sin "Inicio": el logo ya
 * lleva a la home del canal y el link quedaba duplicado.
 */
const navDe = (modo: Modo) => [
  { label: 'Productos', href: RUTAS[modo].catalogo, mega: true },
  { label: 'Quiénes Somos', href: '/quienes-somos' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Política de Devolución', href: '/politica-de-devolucion' },
];

const AUTH_CONFIGURADO = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ------------------------------------------------------------------ */

/**
 * Reparte las categorias raiz en 4 columnas, cada una con sus hijas debajo.
 * El mega menu deja de ser una constante: lo define el admin desde el ABM.
 */
function columnasDesde(categorias: Categoria[]): MenuGroup[][] {
  const indice = indiceCategorias(categorias);
  const grupos: MenuGroup[] = indice.raices.map((raiz) => ({
    title: raiz.nombre,
    cat: raiz.slug,
    items: indice.hijas(raiz.slug).map((h) => ({ label: h.nombre, cat: h.slug })),
  }));

  if (grupos.length === 0) return MEGA_FALLBACK;

  // Reparto por columnas contando filas (titulo + hijas), no grupos: si no,
  // "Reposteria" con 4 hijas deja una columna larga y tres vacias.
  const COLUMNAS = 4;
  const filas = grupos.reduce((n, g) => n + 1 + g.items.length, 0);
  const tope = Math.ceil(filas / COLUMNAS);

  const columnas: MenuGroup[][] = [[]];
  let alto = 0;
  for (const g of grupos) {
    const suyo = 1 + g.items.length;
    if (alto > 0 && alto + suyo > tope && columnas.length < COLUMNAS) {
      columnas.push([]);
      alto = 0;
    }
    columnas[columnas.length - 1].push(g);
    alto += suyo;
  }
  return columnas;
}

export default function Navbar({ categorias = [] }: { categorias?: Categoria[] }) {
  const mega = useMemo(() => columnasDesde(categorias), [categorias]);

  const openCart = useCart((s) => s.open);
  const count = useCart(selectCount);
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ---------- Canal (minorista / mayorista) ---------- */
  const modo = useModo();
  const otroModo: Modo = modo === 'minorista' ? 'mayorista' : 'minorista';
  const catalogo = RUTAS[modo].catalogo;
  const NAV = navDe(modo);

  /* ---------- Sesion (gating de precios en los dos canales) ---------- */
  // Esto solo decide que boton se dibuja. Los precios los filtra el
  // servidor (lib/minorista.ts), no este estado.
  const [usuario, setUsuario] = useState<User | null>(null);
  const [entrando, setEntrando] = useState(false);
  useEffect(() => {
    if (!AUTH_CONFIGURADO) return;
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => setUsuario(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) =>
      setUsuario(sesion?.user ?? null)
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const entrar = async () => {
    setEntrando(true);
    // Vuelve a la misma pagina: ya con sesion, el servidor manda los precios.
    if (await iniciarSesionGoogle()) setEntrando(false);
  };
  const nombreUsuario =
    (usuario?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? usuario?.email;

  // Cierre diferido: evita que el menu parpadee al cruzar el gap
  // de 8px entre el trigger y el panel.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar todo al navegar.
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMegaOpen(false);
      setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  };

  // Transparente solo arriba de todo en las homes de canal, donde detras hay
  // hero verde oscuro. En el resto de las paginas el tope es crema, asi que
  // el navbar va siempre solido o el texto claro quedaria ilegible.
  const transparente =
    (pathname === '/mayorista' || pathname === '/minorista') && !scrolled && !megaOpen;

  const linkCls = 'text-[#f5ebd9]/80 hover:text-[#f5ebd9]';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        transparente
          ? 'bg-transparent'
          : 'bg-[#0b1c0f] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:h-20 sm:px-8">
        {/* ---------- Logo ---------- */}
        <Link href={RUTAS[modo].home} className="flex shrink-0 items-center" aria-label="Nutrirse - Inicio">
          <Image
            src="/Logo.png"
            alt="Nutrirse"
            width={220}
            height={220}
            priority
            className="h-12 w-auto object-contain transition-all duration-300 sm:h-14"
          />
        </Link>

        {/* ---------- Nav desktop ---------- */}
        <nav className="hidden items-center gap-7 text-sm lg:flex">
          {NAV.map((item) =>
            item.mega ? (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={openMega}
                onMouseLeave={closeMega}
              >
                <button
                  onClick={() => setMegaOpen((v) => !v)}
                  aria-expanded={megaOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-1.5 py-5 transition-colors ${linkCls}`}
                >
                  {item.label}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className={`transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link key={item.href} href={item.href} className={`transition-colors ${linkCls}`}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          {/* ---------- Cambiar modo ----------
              El texto nombra el destino, no el canal actual: "Cambiar a
              MINORISTA" se lee como accion; "Minorista" solo, como estado. */}
          <Link
            href={RUTAS[otroModo].home}
            className="hidden h-10 items-center gap-2 rounded-full border border-[#f5ebd9]/30 px-3.5 text-sm text-[#f5ebd9] transition-colors hover:border-[#d6b26a] hover:text-[#d6b26a] md:flex"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4" />
            </svg>
            <span>
              Cambiar a <b className="font-semibold uppercase tracking-wide">{otroModo}</b>
            </span>
          </Link>

          {/* ---------- Cuenta ---------- */}
          {AUTH_CONFIGURADO && (
            usuario ? (
              <form action="/auth/signout" method="post" className="hidden md:block">
                <button
                  title={`${nombreUsuario ?? ''} · Cerrar sesión`}
                  className="flex h-10 items-center gap-2 rounded-full px-3 text-sm text-[#f5ebd9]/80 transition-colors hover:bg-white/10 hover:text-[#f5ebd9]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d6b26a] text-xs font-semibold uppercase text-[#0b1c0f]">
                    {nombreUsuario?.charAt(0)}
                  </span>
                  Salir
                </button>
              </form>
            ) : (
              <button
                onClick={entrar}
                disabled={entrando}
                className="hidden h-10 items-center rounded-full bg-[#d6b26a] px-4 text-sm font-semibold text-[#0b1c0f] transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-70 md:flex"
              >
                {entrando ? 'Abriendo…' : 'Ingresar'}
              </button>
            )
          )}

          {/* ---------- Carrito ---------- */}
          <button
            onClick={openCart}
            aria-label="Abrir carrito"
            className="relative flex h-10 items-center gap-2 rounded-full bg-[#f5ebd9] px-4 text-sm font-medium text-[#0b1c0f] transition-all hover:scale-[1.03] active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="hidden sm:inline">Pedido</span>
            {mounted && count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-tostado px-1 text-[11px] font-semibold text-carbon">
                {count}
              </span>
            )}
          </button>

          {/* ---------- Burger ---------- */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#f5ebd9] transition-colors hover:bg-white/10 lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {/* ---------- Mega menú (desktop) ---------- */}
      <div
        onMouseEnter={openMega}
        onMouseLeave={closeMega}
        className={`absolute inset-x-0 top-full hidden origin-top border-t border-white/10 bg-[#0b1c0f] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)] transition-all duration-200 lg:block ${
          megaOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-10 px-8 py-10">
          {mega.map((col, ci) => (
            <div key={ci} className="space-y-7">
              {col.map((group) => (
                <div key={group.title}>
                  <Link
                    href={`${catalogo}?cat=${group.cat}`}
                    className="font-semibold text-[#f5ebd9] transition-colors hover:text-[#d6b26a]"
                  >
                    {group.title}
                  </Link>
                  {group.items.length > 0 && (
                    <ul className="mt-2.5 space-y-1.5">
                      {group.items.map((it) => (
                        <li key={it.cat}>
                          <Link
                            href={`${catalogo}?cat=${it.cat}`}
                            className="text-sm text-[#f5ebd9]/60 transition-colors hover:text-[#d6b26a]"
                          >
                            {it.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 bg-[#0f2716]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4 text-sm">
            <span className="text-[#f5ebd9]/50">
              {modo === 'mayorista'
                ? 'Venta exclusiva por mayor · Mínimo 5 kg'
                : 'Presentaciones chicas para tu casa'}
            </span>
            <Link href={catalogo} className="font-medium text-[#d6b26a] hover:underline">
              Ver todo el catálogo →
            </Link>
          </div>
        </div>
      </div>

      {/* ---------- Menú mobile ---------- */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-carbon/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-sm flex-col bg-hueso shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-nuez">
            Menú
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            className="flex h-9 w-9 items-center justify-center rounded-full text-humo hover:bg-crema"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="thin-scroll flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-5 space-y-2 border-b border-black/5 pb-5">
            <Link
              href={RUTAS[otroModo].home}
              className="flex items-center justify-between rounded-lg bg-crema px-3 py-3 text-sm font-medium text-carbon"
            >
              <span>
                Cambiar a <b className="uppercase tracking-wide">{otroModo}</b>
              </span>
              <span aria-hidden className="text-tostado">→</span>
            </Link>
            {AUTH_CONFIGURADO && (
              usuario ? (
                <form action="/auth/signout" method="post">
                  <button className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-humo hover:bg-crema">
                    Hola {nombreUsuario} · Cerrar sesión
                  </button>
                </form>
              ) : (
                <button
                  onClick={entrar}
                  disabled={entrando}
                  className="w-full rounded-lg bg-carbon px-3 py-3 text-sm font-semibold text-hueso disabled:opacity-70"
                >
                  {entrando ? 'Abriendo Google…' : 'Crear cuenta o Iniciar Sesión'}
                </button>
              )
            )}
          </div>

          <ul className="space-y-1">
            {NAV.filter((n) => !n.mega).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-carbon transition-colors hover:bg-crema"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-6 px-3 text-xs font-medium uppercase tracking-wider text-tostado">
            Productos
          </p>
          <div className="mt-3 space-y-5">
            {mega.flat().map((group) => (
              <div key={group.title} className="px-3">
                <Link href={`${catalogo}?cat=${group.cat}`} className="font-semibold text-carbon">
                  {group.title}
                </Link>
                {group.items.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {group.items.map((it) => (
                      <li key={it.cat}>
                        <Link href={`${catalogo}?cat=${it.cat}`} className="text-sm text-humo">
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </header>
  );
}
