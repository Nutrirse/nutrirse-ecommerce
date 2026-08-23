'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/store/cart';
import { formatPrecio } from '@/lib/format';
import type { Product } from '@/types';

export default function ProductCard({ product }: { product: Product }) {
  const variantes = product.precios_por_variante;
  const [variantId, setVariantId] = useState(variantes[0]?.id ?? '');
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const variant = variantes.find((v) => v.id === variantId) ?? variantes[0];
  if (!variant) return null;

  const onAdd = () => {
    addItem(product, variant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="product-card group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-hueso transition-shadow duration-300 hover:shadow-[0_18px_50px_-24px_rgba(107,68,35,0.45)]">
      <div className="relative aspect-4/3 overflow-hidden bg-crema">
        {product.imagen_url ? (
          <Image
            src={product.imagen_url}
            alt={product.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-[family-name:var(--font-display)] text-5xl text-nuez/15">
              {product.nombre.charAt(0)}
            </span>
          </div>
        )}
        {product.categoria && (
          <span className="absolute left-3 top-3 rounded-full bg-hueso/90 px-3 py-1 text-[10px] uppercase tracking-wider text-humo backdrop-blur">
            {product.categoria.replace('-', ' ')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight text-carbon">
          {product.nombre}
        </h3>
        {product.descripcion && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-humo">
            {product.descripcion}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Presentación">
          {variantes.map((v) => {
            const active = v.id === variantId;
            return (
              <button
                key={v.id}
                role="radio"
                aria-checked={active}
                onClick={() => setVariantId(v.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-carbon bg-carbon text-hueso'
                    : 'border-black/10 text-humo hover:border-carbon/30 hover:text-carbon'
                }`}
              >
                {v.tipo === 'consultar' ? '+5 bolsas' : v.label}
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-humo">{variant.label}</p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-nuez">
              {formatPrecio(variant.precio)}
            </p>
          </div>

          <button
            onClick={onAdd}
            className={`h-11 shrink-0 rounded-full px-5 text-sm font-medium transition-all active:scale-95 ${
              added ? 'bg-oliva text-hueso' : 'bg-carbon text-hueso hover:scale-[1.03]'
            }`}
          >
            {added ? 'Agregado ✓' : variant.tipo === 'consultar' ? 'Consultar' : 'Añadir'}
          </button>
        </div>
      </div>
    </article>
  );
}
