'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/store/cart';
import { formatARS, formatPrecioUnitario } from '@/lib/format';
import ProductModal from './ProductModal';
import { imagenesDe } from '@/lib/imagenes';
import type { Product } from '@/types';

export default function ProductCard({
  product,
  related = [],
}: {
  product: Product;
  /** Catálogo completo: alimenta "Productos similares" del quick view. */
  related?: Product[];
}) {
  const variantes = product.precios_por_variante;
  const [variantId, setVariantId] = useState(variantes[0]?.id ?? '');
  const [added, setAdded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const variant = variantes.find((v) => v.id === variantId) ?? variantes[0];
  if (!variant) return null;

  // La card muestra la principal. El resto de la galeria vive en el quick
  // view; aca solo se avisa que hay mas de una foto.
  const galeria = imagenesDe(product);

  const esConsultar = variant.tipo === 'consultar';

  /* El mayorista compara por unidad de medida, no por bulto: toda variante
     con un divisor util lleva el precio unitario debajo del principal. */
  const porKg = formatPrecioUnitario(variant);

  const onAdd = () => {
    addItem(product, variant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const openModal = () => setModalOpen(true);

  return (
    <>
      <article className="product-card group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
        {/* ---------- Imagen: abre el quick view ---------- */}
        <button
          onClick={openModal}
          aria-label={`Ver detalles de ${product.nombre}`}
          className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl bg-gray-50"
        >
          {galeria[0] ? (
            <Image
              src={galeria[0]}
              alt={product.nombre}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-full w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-[family-name:var(--font-display)] text-6xl text-gray-200">
                {product.nombre.charAt(0)}
              </span>
            </div>
          )}

          {galeria.length > 1 && (
            <span className="pointer-events-none absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-carbon/70 px-2 py-0.5 text-[10px] font-medium text-white">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="13" height="13" rx="2" />
                <path d="M8 21h11a2 2 0 0 0 2-2V8" />
              </svg>
              {galeria.length}
            </span>
          )}

          <span className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-carbon/85 px-3 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Ver detalles
          </span>
        </button>

        {/* ---------- Cuerpo ---------- */}
        <div className="flex flex-1 flex-col px-4 pb-4">
          <button onClick={openModal} className="text-left">
            <h3 className="text-sm leading-snug text-gray-700 transition-colors hover:text-black">
              {product.nombre}
            </h3>
          </button>

          {product.descripcion && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">
              {product.descripcion}
            </p>
          )}

          {/* Selector de presentación */}
          <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Presentación">
            {variantes.map((v) => {
              const activo = v.id === variantId;
              return (
                <button
                  key={v.id}
                  role="radio"
                  aria-checked={activo}
                  onClick={() => setVariantId(v.id)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    activo
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800'
                  }`}
                >
                  {v.tipo === 'consultar' ? '+5 bultos' : v.label}
                </button>
              );
            })}
          </div>

          {/* Precio */}
          <div className="mt-auto pt-4">
            {esConsultar ? (
              <p className="text-base font-bold text-black">Precio a Consultar</p>
            ) : (
              <>
                <p className="text-xl font-bold text-black">{formatARS(variant.precio ?? 0)}</p>
                {porKg && <p className="text-[11px] text-gray-500">({porKg})</p>}
              </>
            )}
            <p className="mt-0.5 text-[11px] text-gray-400">{variant.label}</p>
          </div>

          {/* CTA a todo el ancho */}
          <button
            onClick={onAdd}
            className={`mt-3 w-full rounded-lg py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors active:scale-[0.98] ${
              added ? 'bg-[#1e7e34]' : 'bg-[#28a745] hover:bg-[#218838]'
            }`}
          >
            {added ? 'Agregado ✓' : esConsultar ? 'Consultar' : 'Agregar'}
          </button>
        </div>
      </article>

      {/* El modal se monta solo despues del primer clic: no paga costo
          de render por cada tarjeta de la grilla. */}
      {modalOpen && (
        <ProductModal product={product} related={related} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
