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
import { formatARS } from '@/lib/format';

export default function CartDrawer() {
  const { items, isOpen, close, removeItem, setCantidad, shipping } = useCart();
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

  const envio = shipping?.price ?? 0;
  const total = subtotal + envio;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden
        className={`fixed inset-0 z-50 bg-carbon/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de pedido"
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:w-[400px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ---------- Header fijo ---------- */}
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-black">
              Tu Pedido
            </h2>
            <p className="text-xs text-gray-400">
              {count} {count === 1 ? 'ítem' : 'ítems'} · {peso} kg
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Cerrar carrito"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* ---------- Lista de ítems (única zona con scroll) ---------- */}
        <div className="thin-scroll flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-gray-500">Todavía no agregaste productos.</p>
              <button
                onClick={close}
                className="mt-4 rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3.5 py-4 first:pt-0">
                  {/* Miniatura */}
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    {i.imagen_url ? (
                      <Image
                        src={i.imagen_url}
                        alt={i.nombre}
                        fill
                        sizes="72px"
                        className="object-contain p-1.5"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-2xl text-gray-200">
                        {i.nombre.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-gray-900">{i.nombre}</p>
                      <button
                        onClick={() => removeItem(i.key)}
                        aria-label={`Quitar ${i.nombre}`}
                        className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>

                    <span className="mt-1 w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {i.variantLabel}
                    </span>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      {/* Stepper compacto */}
                      <div className="flex items-center rounded-lg border border-gray-200">
                        <button
                          onClick={() => setCantidad(i.key, i.cantidad - 1)}
                          aria-label="Restar"
                          className="flex h-7 w-7 items-center justify-center rounded-l-lg text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-xs font-semibold tabular-nums text-gray-900">
                          {i.cantidad}
                        </span>
                        <button
                          onClick={() => setCantidad(i.key, i.cantidad + 1)}
                          aria-label="Sumar"
                          className="flex h-7 w-7 items-center justify-center rounded-r-lg text-gray-500 transition-colors hover:bg-gray-50 hover:text-black"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm font-bold text-black">
                        {i.tipo === 'consultar'
                          ? 'A Consultar'
                          : formatARS((i.precio ?? 0) * i.cantidad)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---------- Footer fijo ---------- */}
        {items.length > 0 && (
          <footer className="shrink-0 border-t border-gray-100 bg-white px-5 py-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="font-medium text-gray-900">{formatARS(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Envío</dt>
                <dd className="font-medium text-gray-900">
                  {shipping ? formatARS(envio) : 'a calcular'}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex items-baseline justify-between border-t border-gray-100 pt-3">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-2xl font-bold text-black">{formatARS(total)}</span>
            </div>

            {hayConsultar && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
                Incluye ítems por volumen a cotizar: el total puede variar.
              </p>
            )}

            {/* Los datos de facturacion (DNI, direccion, envio) se cargan
                en el checkout: sin eso el ticket de WhatsApp sale incompleto. */}
            <Link
              href="/checkout"
              onClick={close}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#28a745] py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#218838] active:scale-[0.99]"
            >
              Completar datos del pedido
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>

            <p className="mt-2.5 text-center text-[11px] text-gray-400">
              No se procesan pagos en el sitio
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}
