'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart, selectCount } from '@/store/cart';

export default function Header() {
  const open = useCart((s) => s.open);
  const count = useCart(selectCount);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Solo el home arranca con el hero verde oscuro detras: ahi el header
  // va en claro. En el resto de las paginas el tope ya es crema.
  const overHero = pathname === '/' && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-black/5 bg-hueso/85 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className={`font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight transition-colors ${
            overHero ? 'text-[#f5ebd9]' : 'text-nuez'
          }`}
        >
          Nutrirse<span className="text-tostado">.</span>
        </Link>

        <nav
          className={`hidden items-center gap-8 text-sm transition-colors md:flex ${
            overHero ? 'text-[#f5ebd9]/75' : 'text-humo'
          }`}
        >
          <Link href="/#catalogo" className={overHero ? 'hover:text-[#f5ebd9]' : 'hover:text-carbon'}>
            Catálogo
          </Link>
          <Link href="/#envios" className={overHero ? 'hover:text-[#f5ebd9]' : 'hover:text-carbon'}>
            Envíos
          </Link>
          <Link href="/checkout" className={overHero ? 'hover:text-[#f5ebd9]' : 'hover:text-carbon'}>
            Pedido
          </Link>
        </nav>

        <button
          onClick={open}
          aria-label="Abrir carrito"
          className={`relative flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all hover:scale-[1.03] active:scale-95 ${
            overHero ? 'bg-[#f5ebd9] text-[#0b1c0f]' : 'bg-carbon text-hueso'
          }`}
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
      </div>
    </header>
  );
}
