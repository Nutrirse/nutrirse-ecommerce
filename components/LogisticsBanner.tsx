'use client';

import Image from 'next/image';
import { useState } from 'react';
import ShippingCalculator from './ShippingCalculator';

type Props = {
  /** PNG con fondo transparente del utilitario. */
  imgSrc?: string;
};

const PUNTOS = [
  'Andreani · OCA · Correo Argentino',
  'Despacho en 24 h hábiles',
  'Retiro sin cargo en depósito',
];

export default function LogisticsBanner({ imgSrc = '/utilitario.png' }: Props) {
  const [abierto, setAbierto] = useState(false);

  return (
    // `pt-16` reserva el aire que la imagen usa para sobresalir por arriba.
    // Sin eso, el pop-out se comería la sección anterior.
    <section id="envios" className="scroll-mt-24 bg-crema px-5 pb-20 pt-16 sm:px-8 sm:pb-24">
      {/* overflow-visible + relative: la imagen puede romper el borde verde */}
      <div className="relative mx-auto max-w-7xl overflow-visible rounded-3xl bg-gradient-to-r from-[#143620] to-[#0b1c0f] shadow-[0_30px_60px_-30px_rgba(11,28,15,0.7)]">
        {/* Halo cálido interno. Va en su propio div con overflow-hidden:
            si el recorte viviera en el contenedor, cortaría la camioneta. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(55% 90% at 78% 50%, rgba(214,178,106,0.20), transparent 70%)',
            }}
          />
        </div>

        <div className="relative grid items-center gap-8 px-8 py-12 sm:px-12 md:grid-cols-[1.05fr_1fr] md:py-14">
          {/* ---------- Izquierda: texto + cotizador ---------- */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#d6b26a]">
              Logística
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-hand)] text-[clamp(2.6rem,6.5vw,4.8rem)] font-semibold leading-[1.05] text-[#f5ebd9]">
              De Salta a todo el país.
            </h2>

            <ul className="mt-6 space-y-2.5 text-sm text-[#f5ebd9]/70">
              {PUNTOS.map((p) => (
                <li key={p} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d6b26a]" />
                  {p}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setAbierto((v) => !v)}
              aria-expanded={abierto}
              aria-controls="cotizador-envio"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f5ebd9] px-7 py-3.5 text-sm font-semibold text-[#0b1c0f] transition-transform hover:scale-[1.03] active:scale-95"
            >
              {abierto ? 'Ocultar cotizador' : 'Calcular mi envío'}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={`transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Despliegue a altura automática: el truco de grid-rows 0fr -> 1fr
                permite animar sin conocer el alto del contenido de antemano
                (max-height fija cortaría la lista de opciones al cotizar). */}
            <div
              id="cotizador-envio"
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                abierto ? 'mt-6 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#d6b26a]">
                    Cotizá tu envío
                  </p>
                  <p className="mt-1 text-xs text-[#f5ebd9]/55">
                    Ingresá tu código postal. Calculamos desde Salta Capital sobre el peso
                    del pedido.
                  </p>
                  <ShippingCalculator compact tone="oscuro" />
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Derecha: utilitario que sobresale ---------- */}
          <div className="relative h-40 sm:h-52 md:h-full md:min-h-[220px]">
            <Image
              src={imgSrc}
              alt="Utilitario de reparto Nutrirse"
              width={900}
              height={560}
              sizes="(max-width: 768px) 80vw, 42vw"
              className="pointer-events-none absolute -top-20 right-0 w-[min(560px,105%)] max-w-none drop-shadow-[0_30px_35px_rgba(0,0,0,0.45)] sm:-top-24 md:-top-28 md:-right-4"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
