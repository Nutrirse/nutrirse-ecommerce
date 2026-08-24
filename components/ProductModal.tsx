'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCart } from '@/store/cart';
import { formatARS } from '@/lib/format';
import ShippingCalculator from './ShippingCalculator';
import type { Product } from '@/types';

type Props = {
  product: Product;
  onClose: () => void;
};

const SALIDA_MS = 320;

export default function ProductModal({ product, onClose }: Props) {
  const variantes = product.precios_por_variante;
  const [variantId, setVariantId] = useState(variantes[0]?.id ?? '');
  const [cantidad, setCantidad] = useState(1);
  const [added, setAdded] = useState(false);
  // `shown` maneja la animacion de entrada/salida del panel.
  const [shown, setShown] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const salidaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const variant = variantes.find((v) => v.id === variantId) ?? variantes[0];
  const esConsultar = variant?.tipo === 'consultar';

  /* ---- Entrada: se pinta cerrado y en el frame siguiente se abre,
         asi la transicion CSS tiene un estado inicial del que partir. ---- */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---- Bloqueo de scroll + foco ---- */
  useEffect(() => {
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
      if (salidaTimer.current) clearTimeout(salidaTimer.current);
    };
  }, []);

  /* ---- Cierre: anima hacia afuera y recien despues desmonta ---- */
  const requestClose = useCallback(() => {
    setShown(false);
    salidaTimer.current = setTimeout(onClose, SALIDA_MS);
  }, [onClose]);

  /* ---- Escape + focus trap ---- */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        requestClose();
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
    [requestClose]
  );

  if (!variant) return null;

  const onAdd = () => {
    addItem(product, variant, cantidad);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      requestClose();
    }, 700);
  };

  const totalLinea = (variant.precio ?? 0) * cantidad;

  return (
    <div className="fixed inset-0 z-[60]" onKeyDown={onKeyDown}>
      {/* Backdrop */}
      <div
        onClick={requestClose}
        aria-hidden
        className={`absolute inset-0 bg-carbon/55 backdrop-blur-sm transition-opacity duration-300 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel:
          - desktop -> drawer lateral desde la derecha, alto completo
          - mobile  -> sheet desde abajo                                */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${product.id}`}
        className={`absolute inset-x-0 bottom-0 h-[92dvh] rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:inset-x-auto md:right-0 md:top-0 md:h-dvh md:w-[85vw] md:max-w-6xl md:rounded-none ${
          shown
            ? 'translate-y-0 md:translate-x-0 md:translate-y-0'
            : 'translate-y-full md:translate-x-full md:translate-y-0'
        }`}
      >
        {/* Fuera del contenedor con scroll: queda siempre visible */}
        <button
          ref={closeRef}
          onClick={requestClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-md transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Contenedor de scroll del drawer. En desktop es grilla 50/50:
            la columna izquierda queda `sticky` y la derecha es la unica
            que corre bajo el cursor. */}
        <div className="thin-scroll h-full overflow-y-auto overscroll-contain md:grid md:grid-cols-2">
          {/* ---------- Izquierda: imagen, fija ---------- */}
          <div className="relative aspect-square w-full bg-gray-50 md:sticky md:top-0 md:aspect-auto md:h-dvh md:self-start">
            {product.imagen_url ? (
              <Image
                src={product.imagen_url}
                alt={product.nombre}
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                priority
                className="object-contain p-8 md:p-14"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-[family-name:var(--font-display)] text-8xl text-gray-200 md:text-[11rem]">
                  {product.nombre.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* ---------- Derecha: info, scrollea ---------- */}
          <div className="flex flex-col p-6 sm:p-10">
            {product.categoria && (
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-tostado">
                {product.categoria.replace(/-/g, ' ')}
              </p>
            )}

            <h2
              id={`modal-title-${product.id}`}
              className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-black"
            >
              {product.nombre}
            </h2>

            {product.descripcion && (
              <p className="mt-3 text-base leading-relaxed text-gray-600">{product.descripcion}</p>
            )}

            {/* Variantes */}
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                      className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
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
            <div className="mt-8 border-y border-gray-100 py-6">
              {esConsultar ? (
                <>
                  <p className="text-3xl font-bold text-black">Precio a Consultar</p>
                  <p className="mt-1.5 text-sm text-gray-500">
                    Cotizamos por volumen al cerrar el pedido por WhatsApp.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold text-black">{formatARS(variant.precio ?? 0)}</p>
                  <p className="mt-1.5 text-sm text-gray-500">
                    {variant.label} · {variant.peso_kg} kg por unidad
                  </p>
                </>
              )}
            </div>

            {/* Cantidad */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-700">Cantidad</span>
              <div className="flex items-center rounded-full border border-gray-200">
                <button
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  aria-label="Restar"
                  className="h-11 w-11 rounded-full text-gray-500 transition-colors hover:text-black"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums">{cantidad}</span>
                <button
                  onClick={() => setCantidad((c) => c + 1)}
                  aria-label="Sumar"
                  className="h-11 w-11 rounded-full text-gray-500 transition-colors hover:text-black"
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
              className={`mt-6 w-full rounded-lg py-4 text-base font-bold uppercase tracking-wide text-white transition-colors active:scale-[0.99] ${
                added ? 'bg-[#1e7e34]' : 'bg-[#28a745] hover:bg-[#218838]'
              }`}
            >
              {added ? 'Agregado ✓' : esConsultar ? 'Agregar y consultar' : 'Agregar al carrito'}
            </button>

            {/* Cotizador de envío */}
            <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Calculá el envío
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Despachamos desde Salta Capital. La cotización usa el peso del carrito.
              </p>
              <ShippingCalculator compact />
            </div>

            <p className="mt-8 text-xs text-gray-400">
              Venta exclusiva por mayor · Los precios no incluyen IVA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
