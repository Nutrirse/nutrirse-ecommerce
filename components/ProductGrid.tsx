'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  products: Product[];
  /** Categoria preseleccionada (ej. la que llega por ?cat= del mega menu). */
  initialCat?: string;
  /** Oculta el encabezado cuando la pagina ya trae su propio titulo. */
  showHeading?: boolean;
};

export default function ProductGrid({ products, initialCat = 'todos', showHeading = true }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [cat, setCat] = useState<string>(initialCat);

  const categorias = useMemo(() => {
    const propias = Array.from(
      new Set(products.map((p) => p.categoria).filter(Boolean) as string[])
    );
    // Si la categoria pedida por URL no existe en el catalogo, igual se
    // muestra como chip activo para que el filtro no mienta.
    if (initialCat !== 'todos' && !propias.includes(initialCat)) propias.push(initialCat);
    return ['todos', ...propias];
  }, [products, initialCat]);

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
          {showHeading ? (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-tostado">
                Catálogo mayorista
              </p>
              <h2 className="max-w-lg font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.02] tracking-tight text-carbon">
                Elegí la presentación y armá tu pedido.
              </h2>
            </div>
          ) : (
            <span />
          )}

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
