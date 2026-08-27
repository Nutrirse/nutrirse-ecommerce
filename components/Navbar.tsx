'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCart, selectCount } from '@/store/cart';

/* ------------------------------------------------------------------ */
/* Estructura del mega menu                                            */
/* ------------------------------------------------------------------ */

type MenuItem = { label: string; cat: string };
type MenuGroup = { title: string; cat: string; items: MenuItem[] };

const MEGA: MenuGroup[][] = [
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
    { title: 'Aceites y Condimentos', cat: 'aceites', items: [] },
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
    { title: 'Suplementos', cat: 'suplementos', items: [] },
    { title: 'Granola y Cereales', cat: 'granola', items: [] },
    { title: 'Infusiones', cat: 'infusiones', items: [] },
  ],
];

const NAV = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos', mega: true },
  { label: 'Quiénes Somos', href: '/quienes-somos' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Política de Devolución', href: '/politica-de-devolucion' },
];

/* ------------------------------------------------------------------ */

export default function Navbar() {
  const openCart = useCart((s) => s.open);
  const count = useCart(selectCount);
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Transparente solo arriba de todo en el home, donde detras hay hero
  // verde oscuro. En el resto de las paginas el tope es crema, asi que el
  // navbar va siempre solido o el texto claro quedaria ilegible.
  const transparente = pathname === '/' && !scrolled && !megaOpen;

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
        <Link href="/" className="flex shrink-0 items-center" aria-label="Nutrirse - Inicio">
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
          {MEGA.map((col, ci) => (
            <div key={ci} className="space-y-7">
              {col.map((group) => (
                <div key={group.title}>
                  <Link
                    href={`/productos?cat=${group.cat}`}
                    className="font-semibold text-[#f5ebd9] transition-colors hover:text-[#d6b26a]"
                  >
                    {group.title}
                  </Link>
                  {group.items.length > 0 && (
                    <ul className="mt-2.5 space-y-1.5">
                      {group.items.map((it) => (
                        <li key={it.cat}>
                          <Link
                            href={`/productos?cat=${it.cat}`}
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
            <span className="text-[#f5ebd9]/50">Venta exclusiva por mayor · Mínimo 5 kg</span>
            <Link href="/productos" className="font-medium text-[#d6b26a] hover:underline">
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
            {MEGA.flat().map((group) => (
              <div key={group.title} className="px-3">
                <Link href={`/productos?cat=${group.cat}`} className="font-semibold text-carbon">
                  {group.title}
                </Link>
                {group.items.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {group.items.map((it) => (
                      <li key={it.cat}>
                        <Link href={`/productos?cat=${it.cat}`} className="text-sm text-humo">
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
