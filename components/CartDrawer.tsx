'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  useCart,
  selectSubtotal,
  selectCount,
  selectPesoTotal,
  selectTieneConsultar,
} from '@/store/cart';
import { formatARS, formatPrecio } from '@/lib/format';

export default function CartDrawer() {
  const { items, isOpen, close, removeItem, setCantidad } = useCart();
  const subtotal = useCart(selectSubtotal);
  const count = useCart(selectCount);
  const peso = useCart(selectPesoTotal);
  const hayConsultar = useCart(selectTieneConsultar);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  if (!mounted) return null;

  return (
    <>
      <div
        onClick={close}
        aria-hidden
        className={`fixed inset-0 z-50 bg-carbon/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de pedido"
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-hueso shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-black/5 px-6 py-5">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-carbon">
              Tu pedido
            </h2>
            <p className="text-xs text-humo">
              {count} {count === 1 ? 'ítem' : 'ítems'} · {peso} kg
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Cerrar carrito"
            className="flex h-9 w-9 items-center justify-center rounded-full text-humo transition-colors hover:bg-crema hover:text-carbon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="thin-scroll flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm text-humo">Todavía no agregaste productos.</p>
              <button
                onClick={close}
                className="mt-4 rounded-full border border-black/10 px-5 py-2 text-sm text-carbon transition-colors hover:bg-crema"
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-crema">
                    {i.imagen_url ? (
                      <Image src={i.imagen_url} alt={i.nombre} fill sizes="80px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-2xl text-nuez/20">
                        {i.nombre.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <p className="truncate text-sm font-medium text-carbon">{i.nombre}</p>
                      <button
                        onClick={() => removeItem(i.key)}
                        aria-label={`Quitar ${i.nombre}`}
                        className="shrink-0 text-humo transition-colors hover:text-red-700"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-humo">{i.variantLabel}</p>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-full border border-black/10">
                        <button
                          onClick={() => setCantidad(i.key, i.cantidad - 1)}
                          aria-label="Restar"
                          className="h-8 w-8 rounded-full text-humo transition-colors hover:text-carbon"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm font-medium tabular-nums">{i.cantidad}</span>
                        <button
                          onClick={() => setCantidad(i.key, i.cantidad + 1)}
                          aria-label="Sumar"
                          className="h-8 w-8 rounded-full text-humo transition-colors hover:text-carbon"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-nuez">
                        {i.tipo === 'consultar'
                          ? 'Precio a Consultar'
                          : formatPrecio((i.precio ?? 0) * i.cantidad)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-black/5 px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-humo">Subtotal</span>
              <span className="font-[family-name:var(--font-display)] text-2xl font-semibold text-carbon">
                {formatARS(subtotal)}
              </span>
            </div>
            {hayConsultar && (
              <p className="mt-1.5 text-xs text-humo">
                Incluye ítems a cotizar: el precio final se confirma por WhatsApp.
              </p>
            )}
            <p className="mt-1 text-xs text-humo">Envío se calcula en el checkout.</p>

            <Link
              href="/checkout"
              onClick={close}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-carbon text-sm font-medium text-hueso transition-transform hover:scale-[1.02] active:scale-95"
            >
              Iniciar pedido
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}
