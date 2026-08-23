'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCart } from '@/store/cart';
import { formatARS } from '@/lib/format';
import ShippingCalculator from './ShippingCalculator';
import type { Product } from '@/types';

type Props = {
  product: Product;
  open: boolean;
  onClose: () => void;
};

export default function ProductModal({ product, open, onClose }: Props) {
  const variantes = product.precios_por_variante;
  const [variantId, setVariantId] = useState(variantes[0]?.id ?? '');
  const [cantidad, setCantidad] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  const variant = variantes.find((v) => v.id === variantId) ?? variantes[0];
  const esConsultar = variant?.tipo === 'consultar';

  /* ---- Bloqueo de scroll + foco ---- */
  useEffect(() => {
    if (!open) return;

    prevFocus.current = document.activeElement as HTMLElement | null;
    // Compensa el ancho de la scrollbar para que la pagina no salte.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
      prevFocus.current?.focus();
    };
  }, [open]);

  /* ---- Escape + focus trap ---- */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  /* ---- Reset al cerrar ---- */
  useEffect(() => {
    if (open) return;
    setCantidad(1);
    setAdded(false);
  }, [open]);

  if (!variant) return null;

  const onAdd = () => {
    addItem(product, variant, cantidad);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 700);
  };

  const totalLinea = (variant.precio ?? 0) * cantidad;

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-200 ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onKeyDown={onKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-carbon/55 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Panel */}
      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`modal-title-${product.id}`}
          className={`relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-all duration-300 sm:rounded-2xl ${
            open ? 'translate-y-0 sm:scale-100' : 'translate-y-8 sm:scale-95'
          }`}
        >
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="thin-scroll grid overflow-y-auto md:grid-cols-2">
            {/* ---------- Izquierda: imagen ---------- */}
            <div className="relative aspect-square bg-gray-50 md:aspect-auto md:min-h-[520px]">
              {product.imagen_url ? (
                <Image
                  src={product.imagen_url}
                  alt={product.nombre}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-8"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="font-[family-name:var(--font-display)] text-8xl text-gray-200">
                    {product.nombre.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* ---------- Derecha: info ---------- */}
            <div className="flex flex-col p-6 sm:p-8">
              {product.categoria && (
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-tostado">
                  {product.categoria.replace(/-/g, ' ')}
                </p>
              )}

              <h2
                id={`modal-title-${product.id}`}
                className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-black"
              >
                {product.nombre}
              </h2>

              {product.descripcion && (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{product.descripcion}</p>
              )}

              {/* Variantes */}
              <div className="mt-6">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Presentación
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Presentación">
                  {variantes.map((v) => {
                    const activo = v.id === variantId;
                    return (
                      <button
                        key={v.id}
                        role="radio"
                        aria-checked={activo}
                        onClick={() => setVariantId(v.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          activo
                            ? 'border-[#28a745] bg-[#28a745] text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Precio */}
              <div className="mt-6 border-y border-gray-100 py-5">
                {esConsultar ? (
                  <>
                    <p className="text-2xl font-bold text-black">Precio a Consultar</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Cotizamos por volumen al cerrar el pedido por WhatsApp.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-black">{formatARS(variant.precio ?? 0)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {variant.label} · {variant.peso_kg} kg por unidad
                    </p>
                  </>
                )}
              </div>

              {/* Cantidad */}
              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-700">Cantidad</span>
                <div className="flex items-center rounded-full border border-gray-200">
                  <button
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    aria-label="Restar"
                    className="h-10 w-10 rounded-full text-gray-500 transition-colors hover:text-black"
                  >
                    −
                  </button>
                  <span className="w-9 text-center text-sm font-semibold tabular-nums">{cantidad}</span>
                  <button
                    onClick={() => setCantidad((c) => c + 1)}
                    aria-label="Sumar"
                    className="h-10 w-10 rounded-full text-gray-500 transition-colors hover:text-black"
                  >
                    +
                  </button>
                </div>
              </div>

              {!esConsultar && cantidad > 1 && (
                <p className="mt-2 text-right text-sm text-gray-500">
                  Subtotal: <span className="font-semibold text-black">{formatARS(totalLinea)}</span>
                </p>
              )}

              {/* CTA */}
              <button
                onClick={onAdd}
                className={`mt-5 w-full rounded-lg py-4 text-base font-bold uppercase tracking-wide text-white transition-colors active:scale-[0.99] ${
                  added ? 'bg-[#1e7e34]' : 'bg-[#28a745] hover:bg-[#218838]'
                }`}
              >
                {added ? 'Agregado ✓' : esConsultar ? 'Agregar y consultar' : 'Agregar al carrito'}
              </button>

              {/* Cotizador de envío */}
              <div className="mt-7 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Calculá el envío
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Despachamos desde Salta Capital. La cotización usa el peso del carrito.
                </p>
                <ShippingCalculator compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
