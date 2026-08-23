'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

gsap.registerPlugin(ScrollTrigger);

export default function ProductGrid({ products }: { products: Product[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [cat, setCat] = useState<string>('todos');

  const categorias = useMemo(
    () => ['todos', ...Array.from(new Set(products.map((p) => p.categoria).filter(Boolean) as string[]))],
    [products]
  );

  const visibles = useMemo(
    () => (cat === 'todos' ? products : products.filter((p) => p.categoria === cat)),
    [products, cat]
  );

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
  }, [visibles.length]);

  return (
    <section id="catalogo" className="scroll-mt-20 bg-crema py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-tostado">
              Catálogo mayorista
            </p>
            <h2 className="max-w-lg font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.02] tracking-tight text-carbon">
              Elegí la presentación y armá tu pedido.
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-4 py-2 text-xs font-medium capitalize transition-colors ${
                  cat === c
                    ? 'border-carbon bg-carbon text-hueso'
                    : 'border-black/10 text-humo hover:border-carbon/30 hover:text-carbon'
                }`}
              >
                {c.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div ref={root} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {visibles.length === 0 && (
          <p className="mt-16 text-center text-humo">No hay productos en esta categoría.</p>
        )}
      </div>
    </section>
  );
}
