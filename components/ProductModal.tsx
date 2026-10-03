'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCart } from '@/store/cart';
import { desglosePrecio, formatARS, sufijoMedida } from '@/lib/format';
import ShippingCalculator from './ShippingCalculator';
import GoogleLoginButton from './GoogleLoginButton';
import { maxCantidad as topeDeVariante, motivoTope } from '@/lib/variant-limits';
import { imagenesDe } from '@/lib/imagenes';
import { etiquetaCategoria } from '@/lib/categorias';
import type { Product } from '@/types';

type Props = {
  product: Product;
  /** Catálogo para armar "Productos similares". */
  related?: Product[];
  /** Sin sesion (cualquier canal): login en vez de precio y sin carrito. */
  hasSession?: boolean;
  onClose: () => void;
};

const SALIDA_MS = 320;
const AVISO_MS = 2600;

export default function ProductModal({ product, related = [], hasSession = false, onClose }: Props) {
  const preciosOcultos = !hasSession;
  // Producto que se esta viendo. Arranca en el que abrio el drawer y
  // cambia al tocar un similar, sin cerrar ni navegar.
  const [activo, setActivo] = useState<Product>(product);
  // Pila de productos visitados al navegar por los similares.
  const [historial, setHistorial] = useState<Product[]>([]);
  const variantes = activo.precios_por_variante;
  const [variantId, setVariantId] = useState(variantes[0]?.id ?? '');
  const [cantidad, setCantidad] = useState(1);
  // Indice de la foto visible dentro de la galeria del producto activo.
  const [foto, setFoto] = useState(0);
  const [added, setAdded] = useState(false);
  // Aviso efimero al tocar el tope de bultos.
  const [aviso, setAviso] = useState<string | null>(null);
  // `shown` maneja la animacion de entrada/salida del panel.
  const [shown, setShown] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const salidaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Contenedor con overflow: en desktop scrollea la columna derecha,
  // en mobile el sheet entero. En los dos casos hay que volver arriba.
  const scrollRef = useRef<HTMLDivElement>(null);

  const variant = variantes.find((v) => v.id === variantId) ?? variantes[0];
  const esConsultar = variant?.tipo === 'consultar';

  // Galeria del producto activo. La posicion 0 es la principal.
  const galeria = imagenesDe(activo);
  const imagenActual = galeria[Math.min(foto, galeria.length - 1)] ?? null;

  /* ---- Tope de la variante activa. La regla vive en lib/variant-limits.ts,
         que tambien aplica el store del carrito: la UI solo la refleja.
           - bulto cerrado -> 5 unidades
           - presentacion base -> lo que pese menos que un bulto cerrado
           - "+5 bultos (Consultar)" -> sin tope, se cotiza aparte ---- */
  const maxUnidades = variant ? topeDeVariante(activo, variant) : Infinity;
  const enTope = cantidad >= maxUnidades;

  // Peso que se le pasa al cotizador: variante activa x cantidad elegida.
  // El carrito todavia no tiene este item, asi que su peso no sirve aca.
  const pesoCotizacion = (variant?.peso_kg ?? 0) * cantidad;

  /* ---- Navegacion entre similares ---- */
  const irA = (p: Product) => {
    setHistorial((h) => [...h, activo]);
    setActivo(p);
  };

  const volver = () => {
    setHistorial((h) => {
      const previo = h[h.length - 1];
      if (previo) setActivo(previo);
      return h.slice(0, -1);
    });
  };

  /* ---- Cambio de producto: resetea la seleccion y vuelve arriba.
         Sin el scrollTo, al entrar a un similar desde el bloque de abajo
         el drawer quedaria abierto a media altura del producto nuevo. ---- */
  useEffect(() => {
    setVariantId(activo.precios_por_variante[0]?.id ?? '');
    setCantidad(1);
    setFoto(0);
    setAdded(false);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activo.id, activo.precios_por_variante]);

  /* ---- Cambio de variante: si la nueva tiene un tope mas bajo y la
         cantidad quedo por encima, se recorta. Sin esto se podria elegir
         "5 kg x 4" y pasar a "Bulto Cerrado x 4" esquivando el limite. ---- */
  useEffect(() => {
    setCantidad((c) => Math.min(c, maxUnidades));
    setAviso(null);
  }, [variantId, maxUnidades]);

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
      if (avisoTimer.current) clearTimeout(avisoTimer.current);
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

  const mostrarAviso = (texto: string) => {
    setAviso(texto);
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), AVISO_MS);
  };

  const sumar = () => {
    if (!variant) return;
    if (enTope) {
      mostrarAviso(motivoTope(activo, variant));
      return;
    }
    setAviso(null);
    setCantidad((c) => Math.min(c + 1, maxUnidades));
  };

  if (!variant) return null;

  const onAdd = () => {
    addItem(activo, variant, cantidad);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      requestClose();
    }, 700);
  };

  const totalLinea = (variant.precio ?? 0) * cantidad;

  /* El mayorista compara por unidad de medida, no por bulto: el precio por
     kg (o por unidad) es el numero grande y el total de la presentacion va
     debajo, en secundario. */
  const desglose = desglosePrecio(variant);

  // Prioriza misma categoría; si no alcanza, completa con el resto.
  const similares = (() => {
    const otros = related.filter((p) => p.id !== activo.id);
    const mismaCat = otros.filter((p) => p.categoria === activo.categoria);
    return [...mismaCat, ...otros.filter((p) => p.categoria !== activo.categoria)].slice(0, 3);
  })();

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
        aria-labelledby={`modal-title-${activo.id}`}
        className={`absolute inset-x-0 bottom-0 h-[92dvh] overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:inset-x-auto md:right-4 md:top-4 md:h-[calc(100dvh-2rem)] md:w-[85vw] md:max-w-6xl md:rounded-3xl ${
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
        <div
          ref={scrollRef}
          className="thin-scroll h-full overflow-y-auto overscroll-contain md:grid md:grid-cols-2"
        >
          {/* ---------- Izquierda: imagen centrada, fija mientras la derecha
                 scrollea. La columna toma el alto del panel (100dvh - 2rem de
                 margen - 1rem de `top-4`) y centra su unico hijo. El `max-w`
                 atado a la altura evita que el cuadrado se corte por abajo en
                 pantallas bajas: sin eso, `w-full` gana y rompe el 1:1. ---------- */}
          <div className="flex flex-col items-center justify-center p-4 md:sticky md:top-4 md:h-[calc(100dvh-3rem)] md:p-6">
            <div className="relative aspect-square w-full max-w-[min(100%,calc(100dvh-9rem))] overflow-hidden rounded-3xl bg-gray-50 shadow-sm">
              {imagenActual ? (
                <Image
                  key={imagenActual}
                  src={imagenActual}
                  alt={activo.nombre}
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  priority
                  className="h-full w-full rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="font-[family-name:var(--font-display)] text-8xl text-gray-200 md:text-[11rem]">
                    {activo.nombre.charAt(0)}
                  </span>
                </div>
              )}

              {/* Flechas: solo con galeria real, y solo en pantallas con
                  cursor. En touch alcanza con tocar las miniaturas. */}
              {galeria.length > 1 && (
                <>
                  <button
                    onClick={() => setFoto((f) => (f - 1 + galeria.length) % galeria.length)}
                    aria-label="Foto anterior"
                    className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md transition-colors hover:bg-white hover:text-black md:flex"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setFoto((f) => (f + 1) % galeria.length)}
                    aria-label="Foto siguiente"
                    className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md transition-colors hover:bg-white hover:text-black md:flex"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-carbon/70 px-2.5 py-1 text-[11px] font-medium text-white">
                    {Math.min(foto, galeria.length - 1) + 1}/{galeria.length}
                  </span>
                </>
              )}
            </div>

            {/* Miniaturas */}
            {galeria.length > 1 && (
              <ul className="mt-3 flex w-full max-w-[min(100%,calc(100dvh-9rem))] gap-2">
                {galeria.map((url, i) => {
                  const seleccionada = i === Math.min(foto, galeria.length - 1);
                  return (
                    <li key={url} className="flex-1">
                      <button
                        onClick={() => setFoto(i)}
                        aria-label={`Ver foto ${i + 1} de ${activo.nombre}`}
                        aria-current={seleccionada}
                        className={`relative block aspect-square w-full overflow-hidden rounded-xl ring-2 transition-all ${
                          seleccionada
                            ? 'ring-[#28a745]'
                            : 'opacity-70 ring-transparent hover:opacity-100 hover:ring-gray-300'
                        }`}
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          sizes="120px"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ---------- Derecha: info y cotizador ---------- */}
          <div className="flex flex-col p-6 sm:p-10 md:py-10 md:pl-4 md:pr-10">
            {historial.length > 0 && (
              <button
                onClick={volver}
                className="-ml-2 mb-3 flex w-fit items-center gap-1 rounded-full px-2 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Volver a {historial[historial.length - 1].nombre}
              </button>
            )}

            {activo.categoria && (
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-tostado">
                {etiquetaCategoria(activo.categoria)}
              </p>
            )}

            <h2
              id={`modal-title-${activo.id}`}
              className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-black"
            >
              {activo.nombre}
            </h2>

            {/* Composicion: sub-descripcion corta. Va pegada al titulo y por
                encima de los precios, separada de la descripcion comercial
                larga por tamano y color. */}
            {activo.composicion && (
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                <span className="font-medium text-gray-600">Contiene:</span>{' '}
                {activo.composicion}
              </p>
            )}

            {activo.descripcion && (
              <p className="mt-3 text-base leading-relaxed text-gray-600">{activo.descripcion}</p>
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
              {preciosOcultos ? (
                <GoogleLoginButton texto="Ver precios / Iniciar sesión" />
              ) : esConsultar ? (
                <>
                  <p className="text-3xl font-bold text-black">Precio a Consultar</p>
                  <p className="mt-1.5 text-sm text-gray-500">
                    Cotizamos por volumen al cerrar el pedido por WhatsApp.
                  </p>
                </>
              ) : (
                <>
                  {desglose ? (
                    <>
                      <p className="text-4xl font-bold text-black">
                        {formatARS(desglose.base)}
                        <span className="ml-1 text-lg font-semibold text-gray-500">
                          {sufijoMedida(desglose.medida)}
                        </span>
                      </p>
                      {desglose.textoTotal && (
                        <p className="mt-1 text-sm text-gray-500">({desglose.textoTotal})</p>
                      )}
                    </>
                  ) : (
                    <p className="text-4xl font-bold text-black">{formatARS(variant.precio ?? 0)}</p>
                  )}
                  <p className="mt-1.5 text-sm text-gray-500">{variant.label}</p>
                </>
              )}
              {activo.nota_venta && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium leading-snug text-red-800">
                  {activo.nota_venta}
                </p>
              )}
            </div>

            {!preciosOcultos && (
              <>
                {/* Cantidad */}
                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-700">Cantidad</span>
                  <div className="flex items-center rounded-full border border-gray-200">
                    <button
                      onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                      aria-label="Restar"
                      disabled={cantidad <= 1}
                      className="h-11 w-11 rounded-full text-gray-500 transition-colors hover:text-black disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:text-gray-300"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-semibold tabular-nums">{cantidad}</span>
                    {/* En el tope se marca `aria-disabled` pero NO `disabled`:
                        un boton deshabilitado no dispara click, y el click es lo
                        unico que muestra el aviso de a donde ir. Queda inerte
                        igual, porque `sumar()` corta antes de incrementar. */}
                    <button
                      onClick={sumar}
                      aria-label="Sumar"
                      aria-disabled={enTope}
                      className={`h-11 w-11 rounded-full transition-colors ${
                        enTope ? 'cursor-not-allowed text-gray-300' : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Pista estatica del tope: se ve antes de chocar contra el, asi
                    el limite no aparece como un boton que dejo de funcionar. */}
                {Number.isFinite(maxUnidades) && (
                  <p className="mt-2 text-right text-xs text-gray-400">
                    Máximo {maxUnidades} {maxUnidades === 1 ? 'unidad' : 'unidades'} en esta
                    presentación
                  </p>
                )}

                {aviso && (
                  <p
                    role="status"
                    className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
                  >
                    {aviso}
                  </p>
                )}

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
              </>
            )}

            {/* Cotizador de envío */}
            <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Calculá el envío
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Despachamos desde Salta Capital. Cotización sobre{' '}
                <span className="font-semibold text-gray-700">{pesoCotizacion} kg</span> ({cantidad}{' '}
                × {variant.label} de {variant.peso_kg} kg).
              </p>
              <ShippingCalculator compact pesoKg={pesoCotizacion} />
            </div>

            {/* ---------- Productos similares ---------- */}
            {similares.length > 0 && (
              <section className="mt-10 border-t border-gray-100 pt-8">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-black">
                  Productos similares
                </h3>
                <ul className="mt-5 space-y-3">
                  {similares.map((p) => {
                    const base = p.precios_por_variante.find((v) => v.tipo === 'precio');
                    return (
                      <li key={p.id}>
                        <button
                          onClick={() => irA(p)}
                          className="flex w-full items-center gap-4 rounded-xl border border-gray-100 p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                            {p.imagen_url ? (
                              <Image
                                src={p.imagen_url}
                                alt={p.nombre}
                                fill
                                sizes="64px"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-2xl text-gray-200">
                                {p.nombre.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">{p.nombre}</p>
                            <p className="text-xs text-gray-400">
                              {preciosOcultos
                                ? 'Iniciá sesión para ver precios'
                                : base
                                  ? `Desde ${formatARS(base.precio ?? 0)}`
                                  : 'Precio a Consultar'}
                            </p>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-gray-300">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* El canal minorista comparte este modal: la leyenda B2B no aplica. */}
            {variant.id.startsWith('min-') ? null : (
              <p className="mt-10 text-xs text-gray-400">
                Venta exclusiva por mayor · Los precios no incluyen IVA
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
