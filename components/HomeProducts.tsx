'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

gsap.registerPlugin(ScrollTrigger);

/** Cuántos productos se muestran en la home antes del CTA al catálogo. */
export const HOME_LIMIT = 6;

export default function HomeProducts({ products }: { products: Product[] }) {
  const root = useRef<HTMLDivElement>(null);
  const destacados = products.slice(0, HOME_LIMIT);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from('.product-card', {
        y: 42,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: { each: 0.06, from: 'start' },
        scrollTrigger: { trigger: el, start: 'top 78%', once: true },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="catalogo" className="scroll-mt-24 bg-crema py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* ---------- Encabezado ---------- */}
        <header className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-tostado">
            Catálogo mayorista
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-tight text-carbon">
            Elegí la presentación y armá tu pedido.
          </h2>
        </header>

        {/* ---------- Grilla (solo destacados) ---------- */}
        <div ref={root} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destacados.map((p) => (
            // `products` completo va como relacionados: alimenta el bloque
            // "Productos similares" del quick view sin un fetch extra.
            <ProductCard key={p.id} product={p} related={products} />
          ))}
        </div>

        {destacados.length === 0 && (
          <p className="mt-16 text-center text-humo">Todavía no hay productos cargados.</p>
        )}

        {/* ---------- CTA al catálogo completo ---------- */}
        {products.length > HOME_LIMIT && (
          <div className="mt-14 flex justify-center">
            <Link
              href="/productos"
              className="inline-flex items-center rounded-full border border-carbon/15 bg-hueso px-9 py-4 text-sm font-medium text-carbon transition-all hover:border-carbon/40 hover:shadow-md active:scale-95"
            >
              Ver catálogo completo
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="ml-2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
