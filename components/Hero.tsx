'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/* ------------------------------------------------------------------ */
/* Datos del carrusel                                                  */
/* ------------------------------------------------------------------ */

type Slide = {
  id: string;
  title: string;
  /** Nombre corto para el rotulo manuscrito junto al producto. */
  label: string;
  doypackImg: string;
  floatingImgs: string[];
};

const SLIDES: Slide[] = [
  {
    id: 'almendra',
    title: 'A L M E N D R A',
    label: 'Almendra',
    doypackImg: '/images/hero/doypack-almendra.png',
    floatingImgs: [
      '/images/hero/fruto-almendra-1.png',
      '/images/hero/fruto-almendra-2.png',
      '/images/hero/fruto-almendra-3.png',
      '/images/hero/fruto-almendra-4.png',
      '/images/hero/fruto-almendra-5.png',
    ],
  },
  {
    id: 'nuez',
    title: 'N U E Z',
    label: 'Nuez',
    doypackImg: '/images/hero/doypack-nuez.png',
    floatingImgs: [
      '/images/hero/fruto-nuez-1.png',
      '/images/hero/fruto-nuez-2.png',
      '/images/hero/fruto-nuez-3.png',
      '/images/hero/fruto-nuez-4.png',
      '/images/hero/fruto-nuez-5.png',
    ],
  },
  {
    id: 'pasas',
    title: 'P A S A S',
    label: 'Pasas',
    doypackImg: '/images/hero/doypack-pasas.png',
    floatingImgs: [
      '/images/hero/fruto-pasas-1.png',
      '/images/hero/fruto-pasas-2.png',
      '/images/hero/fruto-pasas-3.png',
      '/images/hero/fruto-pasas-4.png',
      '/images/hero/fruto-pasas-5.png',
    ],
  },
  {
    id: 'pistacho',
    title: 'P I S T A C H O',
    label: 'Pistacho',
    doypackImg: '/images/hero/doypack-pistacho.png',
    floatingImgs: [
      '/images/hero/fruto-pistacho-1.png',
      '/images/hero/fruto-pistacho-2.png',
      '/images/hero/fruto-pistacho-3.png',
      '/images/hero/fruto-pistacho-4.png',
      '/images/hero/fruto-pistacho-5.png',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Slots de los frutos flotantes                                       */
/* ------------------------------------------------------------------ */

/**
 * capa  = 'frente' (z-20, delante del doypack, pegados a los costados)
 *         'atras'  (z-5, entre el titulo y el doypack: cruzan por detras)
 * modo  = 'flota' -> deriva local, se queda en su rincon
 *         'cruza' -> travesia horizontal infinita (solo en capa 'atras',
 *                    asi ningun fruto pasa por delante del producto)
 * size  = escala real via ancho, no via `scale`, para no pelear con GSAP.
 */
type Slot = {
  capa: 'frente' | 'atras';
  modo: 'flota' | 'cruza';
  style: React.CSSProperties;
  size: string;
  blur: number;
  sway: number;   // deriva horizontal (modo flota)
  bob: number;    // cabeceo vertical
  dir: 1 | -1;    // sentido (modo cruza)
  speed: number;  // segundos de ciclo (modo cruza)
};

const SLOTS: Slot[] = [
  // --- Costados, POR DELANTE del doypack (z-20). Nitidos, sin blur:
  //     la profundidad la da el z-index y la escala, no el desenfoque. ---
  {
    capa: 'frente',
    modo: 'flota',
    style: { top: '-4%', left: '-8%' },
    size: 'clamp(210px, 27vw, 430px)',
    blur: 0,
    sway: 26,
    bob: 40,
    dir: 1,
    speed: 0,
  },
  {
    capa: 'frente',
    modo: 'flota',
    style: { bottom: '-9%', right: '-6%' },
    size: 'clamp(230px, 30vw, 470px)',
    blur: 0,
    sway: 30,
    bob: 34,
    dir: -1,
    speed: 0,
  },
  {
    capa: 'frente',
    modo: 'flota',
    style: { bottom: '21%', left: '8%' },
    size: 'clamp(84px, 11vw, 180px)',
    blur: 0,
    sway: 34,
    bob: 26,
    dir: 1,
    speed: 0,
  },

  // --- Cruzan la pantalla POR DETRAS del doypack. Mas chicos: el
  //     tamano menor es lo que los manda al fondo, no el blur. ---
  {
    capa: 'atras',
    modo: 'cruza',
    style: { top: '24%' },
    size: 'clamp(72px, 9vw, 160px)',
    blur: 0,
    sway: 0,
    bob: 20,
    dir: -1,
    speed: 58,
  },
  {
    capa: 'atras',
    modo: 'cruza',
    style: { top: '64%' },
    size: 'clamp(52px, 6.5vw, 112px)',
    blur: 0,
    sway: 0,
    bob: 16,
    dir: 1,
    speed: 46,
  },
];


/* ------------------------------------------------------------------ */
/* Flecha trazada a mano que apunta del rotulo al doypack              */
/* ------------------------------------------------------------------ */

function HandArrow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      className={`hand-arrow ${className}`}
      aria-hidden
      focusable="false"
    >
      {/* Trazo principal: curva suelta, como hecha con marcador */}
      <path
        d="M6 12c14 34 34 58 62 72 21 10 44 14 68 12"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Punta de flecha en dos trazos sueltos */}
      <path
        d="M118 82c8 5 15 10 20 15"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M136 96c-6 1-13 1-19 0"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const DUR = { out: 0.55, in: 0.85, fade: 0.5 };

/* ------------------------------------------------------------------ */

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  // Tweens de vuelo agrupados por slide, para pausar los invisibles.
  const drifts = useRef<gsap.core.Tween[][]>([]);
  const [active, setActive] = useState(0);

  const { contextSafe } = useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* ---- Estado inicial: solo el slide 0 visible ---- */
      SLIDES.forEach((_, i) => {
        const on = i === 0;
        gsap.set(q(`[data-label="${i}"]`), { autoAlpha: on ? 1 : 0, y: on ? 0 : 18, scale: on ? 1 : 0.9 });
        gsap.set(q(`[data-doypack="${i}"]`), { autoAlpha: on ? 1 : 0, yPercent: on ? 0 : 100 });
        gsap.set(q(`[data-slide="${i}"] .fruit`), { autoAlpha: on ? 1 : 0 });
      });

      // Prepara el trazado de cada flecha: dasharray = largo total del
      // path, para poder "dibujarlo" animando el dashoffset. Reemplaza a
      // DrawSVGPlugin, que es del club premium de GSAP.
      q('.hand-arrow path').forEach((path) => {
        const len = (path as unknown as SVGPathElement).getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: 0 });
        (path as unknown as SVGPathElement).dataset.len = String(len);
      });

      if (reduce) return;

      /* ---- Levitacion idle del doypack.
             Vive en `.doypack-float`, elemento distinto del wrapper
             `[data-doypack]` que anima la transicion: sin colision. ---- */
      gsap.to(q('.doypack-float'), {
        y: -24,
        duration: 3.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      /* ---- Movimiento de los frutos.
             Corre en `.fruit-drift` (interno) y NUNCA se toca al cambiar de
             slide: la transicion solo cruza opacidad en `.fruit` (externo).
             Se agrupan por slide para pausar los que no estan a la vista. ---- */
      const W = window.innerWidth;
      drifts.current = SLIDES.map(() => []);

      SLIDES.forEach((_, si) => {
        q(`[data-slide="${si}"] .fruit-drift`).forEach((el) => {
          const d = (el as HTMLElement).dataset;
          const modo = d.modo ?? 'flota';
          const bob = Number(d.bob ?? 20);

          // Cabeceo vertical, comun a los dos modos.
          const cabeceo = gsap.to(el, {
            y: -bob,
            rotate: gsap.utils.random(-7, 7),
            duration: gsap.utils.random(4.5, 8),
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
          cabeceo.progress(Math.random()); // desincroniza el arranque

          let horizontal: gsap.core.Tween;

          if (modo === 'cruza') {
            const dir = Number(d.dir ?? 1);
            const speed = Number(d.speed ?? 55);
            // Rango de wrap bien fuera de cuadro: el salto del ciclo
            // ocurre siempre fuera de pantalla y no se ve.
            const span = W * 0.9 + 700;
            const wrap = gsap.utils.wrap(-span, span);

            gsap.set(el, { x: gsap.utils.random(-span, span) });

            horizontal = gsap.to(el, {
              x: `+=${dir * span * 2}`,
              duration: speed,
              ease: 'none',
              repeat: -1,
              modifiers: { x: (v) => `${wrap(parseFloat(v))}px` },
            });
          } else {
            // Deriva local: se queda en su rincon, nunca invade el centro.
            const sway = Number(d.sway ?? 24);
            horizontal = gsap.to(el, {
              x: sway,
              duration: gsap.utils.random(6, 11),
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
            });
            horizontal.progress(Math.random());
          }

          drifts.current[si].push(horizontal, cabeceo);
        });

        // Arranca solo el slide visible.
        if (si !== 0) drifts.current[si].forEach((t) => t.pause());
      });

      /* ---- Entrada del primer slide ---- */
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from(q('[data-label="0"]'), { y: 22, scale: 0.9, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.7)' })
        .from(
          q('[data-label="0"] .hand-arrow path'),
          {
            strokeDashoffset: (i, t) => Number((t as unknown as SVGPathElement).dataset.len ?? 200),
            duration: 0.7,
            ease: 'power2.out',
            stagger: 0.12,
          },
          0.25
        )
        .from(q('[data-doypack="0"]'), { yPercent: 100, autoAlpha: 0, duration: 1.1 }, 0.05)
        .from(q('[data-slide="0"] .fruit'), { autoAlpha: 0, duration: 1.2, stagger: 0.09 }, 0.25)
        .from(q('.hero-ui'), { y: 18, autoAlpha: 0, duration: 0.6, stagger: 0.06 }, 0.5);
    },
    { scope: root }
  );

  /* ---------------- Transicion entre slides ---------------- */

  const go = contextSafe((next: number) => {
    const cur = activeRef.current;
    if (next === cur) return;
    if (tlRef.current?.isActive()) return; // ignora clics durante la animacion

    const q = gsap.utils.selector(root);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    activeRef.current = next;
    setActive(next);

    // El vuelo del slide entrante arranca ANTES del crossfade, asi ya viene
    // en movimiento cuando aparece. El saliente se pausa al terminar.
    drifts.current[next]?.forEach((t) => t.resume());

    if (reduce) {
      drifts.current[cur]?.forEach((t) => t.pause());
      gsap.set(q(`[data-label="${cur}"]`), { autoAlpha: 0 });
      gsap.set(q(`[data-doypack="${cur}"]`), { autoAlpha: 0, yPercent: 100 });
      gsap.set(q(`[data-slide="${cur}"] .fruit`), { autoAlpha: 0 });
      gsap.set(q(`[data-label="${next}"]`), { autoAlpha: 1, y: 0, scale: 1 });
      gsap.set(q(`[data-doypack="${next}"]`), { autoAlpha: 1, yPercent: 0 });
      gsap.set(q(`[data-slide="${next}"] .fruit`), { autoAlpha: 1 });
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        // Solo se pausa si el usuario no volvio a cambiar de slide.
        if (activeRef.current !== cur) drifts.current[cur]?.forEach((t) => t.pause());
      },
    });
    tlRef.current = tl;

    /* --- Doypack: la bolsa actual baja y se desvanece; la nueva sube. --- */
    tl.to(
      q(`[data-doypack="${cur}"]`),
      { yPercent: 100, autoAlpha: 0, duration: DUR.out, ease: 'power2.in' },
      0
    ).fromTo(
      q(`[data-doypack="${next}"]`),
      { yPercent: 100, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: DUR.in, ease: 'power3.out' },
      DUR.out * 0.65
    );

    /* --- Rotulo manuscrito + flecha: sale corto, entra con rebote --- */
    tl.to(
      q(`[data-label="${cur}"]`),
      { y: -14, scale: 0.94, autoAlpha: 0, duration: 0.3, ease: 'power2.in' },
      0
    )
      .fromTo(
        q(`[data-label="${next}"]`),
        { y: 20, scale: 0.9, autoAlpha: 0 },
        { y: 0, scale: 1, autoAlpha: 1, duration: 0.7, ease: 'back.out(1.7)' },
        0.34
      )
      // La flecha se redibuja trazo por trazo.
      .fromTo(
        q(`[data-label="${next}"] .hand-arrow path`),
        { strokeDashoffset: (i, t) => Number((t as unknown as SVGPathElement).dataset.len ?? 200) },
        { strokeDashoffset: 0, duration: 0.65, ease: 'power2.out', stagger: 0.1 },
        0.45
      );

    /* --- Frutos: SOLO cruce de opacidad, el movimiento sigue corriendo. --- */
    tl.to(
      q(`[data-slide="${cur}"] .fruit`),
      { autoAlpha: 0, duration: DUR.fade, ease: 'power1.inOut', stagger: 0.05 },
      0
    ).to(
      q(`[data-slide="${next}"] .fruit`),
      { autoAlpha: 1, duration: DUR.fade + 0.2, ease: 'power1.inOut', stagger: 0.06 },
      0.3
    );
  });

  const prev = () => go((activeRef.current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => go((activeRef.current + 1) % SLIDES.length);

  /* ---------------------------- Render ---------------------------- */

  // Un mismo renderer para las dos capas de frutos.
  const renderFrutos = (s: Slide, si: number, capa: 'frente' | 'atras') =>
    s.floatingImgs.map((src, fi) => {
      const slot = SLOTS[fi % SLOTS.length];
      if (slot.capa !== capa) return null;
      return (
        // .fruit       -> solo opacidad (transicion de slide)
        // .fruit-drift -> movimiento continuo, nunca interrumpido
        <div key={src} className="fruit absolute" style={{ ...slot.style, width: slot.size }}>
          <div
            className="fruit-drift will-change-transform"
            data-modo={slot.modo}
            data-dir={slot.dir}
            data-speed={slot.speed}
            data-sway={slot.sway}
            data-bob={slot.bob}
            style={{
              filter: slot.blur
                ? `blur(${slot.blur}px) drop-shadow(0 20px 28px rgba(0,0,0,0.5))`
                : 'drop-shadow(0 20px 28px rgba(0,0,0,0.5))',
            }}
          >
            <Image
              src={src}
              alt=""
              width={720}
              height={720}
              priority={si === 0 && capa === 'frente'}
              sizes={capa === 'frente' ? '32vw' : '12vw'}
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      );
    });

  return (
    <section
      ref={root}
      className="relative min-h-[100svh] overflow-hidden bg-gradient-to-b from-[#1e4a28] via-[#143620] to-[#0b1c0f] pt-16 sm:pt-20"
      aria-roledescription="carousel"
      aria-label="Productos destacados"
    >
      {/* halo cálido + viñeta */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 55% at 50% 45%, rgba(214,178,106,0.20), transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(75% 70% at 50% 50%, transparent 45%, rgba(0,0,0,0.5))' }}
      />

      {/* ---------- Z-[25] · rótulo manuscrito + flecha hacia el producto.
           Va por encima del doypack para que se lea siempre. ---------- */}
      <div className="pointer-events-none absolute inset-0 z-[25]">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            data-label={i}
            aria-hidden={i !== active}
            className="absolute left-[6%] top-[22%] origin-bottom-left select-none sm:left-[10%] sm:top-[26%] lg:left-[15%]"
          >
            <p className="font-[family-name:var(--font-hand)] text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-none text-[#f5ebd9] drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
              {s.label}
            </p>
            <HandArrow className="mt-1 ml-6 h-[clamp(56px,9vw,120px)] w-auto text-[#f5ebd9]/80 sm:ml-10" />
          </div>
        ))}
        <h1 className="sr-only">
          Nutrirse · {SLIDES[active].label} por mayor
        </h1>
      </div>

      {/* ---------- Z-5 · frutos que cruzan POR DETRÁS del doypack ---------- */}
      <div className="pointer-events-none absolute inset-0 z-[5]">
        {SLIDES.map((s, si) => (
          <div key={s.id} data-slide={si} className="absolute inset-0">
            {renderFrutos(s, si, 'atras')}
          </div>
        ))}
      </div>

      {/* ---------- Z-10 · doypack central ---------- */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="relative h-[26rem] w-[22rem] sm:h-[32rem] sm:w-[26rem] md:h-[38rem] md:w-[30rem]">
          {SLIDES.map((s, i) => (
            <div key={s.id} data-doypack={i} className="absolute inset-0 will-change-transform">
              <div className="doypack-float absolute inset-0 will-change-transform">
                <Image
                  src={s.doypackImg}
                  alt={`Doypack ${s.label}`}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 640px) 88vw, 30rem"
                  className="object-contain drop-shadow-[0_45px_55px_rgba(0,0,0,0.55)]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Z-20 · frutos flotando por los costados ---------- */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {SLIDES.map((s, si) => (
          <div key={s.id} data-slide={si} className="absolute inset-0">
            {renderFrutos(s, si, 'frente')}
          </div>
        ))}
      </div>

      {/* ---------- Z-30 · UI ---------- */}
      <button
        onClick={prev}
        aria-label="Producto anterior"
        className="hero-ui absolute left-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#f5ebd9]/20 bg-[#f5ebd9]/10 text-[#f5ebd9] backdrop-blur transition-colors hover:bg-[#f5ebd9]/20 sm:left-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        onClick={next}
        aria-label="Producto siguiente"
        className="hero-ui absolute right-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#f5ebd9]/20 bg-[#f5ebd9]/10 text-[#f5ebd9] backdrop-blur transition-colors hover:bg-[#f5ebd9]/20 sm:right-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-6 px-5">
        <div className="hero-ui flex flex-wrap justify-center gap-3">
          <a
            href="#catalogo"
            className="inline-flex h-12 items-center rounded-full bg-[#f5ebd9] px-7 text-sm font-medium text-[#0b1c0f] transition-transform hover:scale-[1.03] active:scale-95"
          >
            Ver catálogo
          </a>
          <a
            href="#envios"
            className="inline-flex h-12 items-center rounded-full border border-[#f5ebd9]/25 px-7 text-sm font-medium text-[#f5ebd9] backdrop-blur transition-colors hover:bg-[#f5ebd9]/10"
          >
            Calcular envío
          </a>
        </div>

        <div className="hero-ui flex items-center gap-2.5" role="tablist" aria-label="Elegir producto">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === active}
              aria-label={s.label}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === active ? 'w-9 bg-[#d6b26a]' : 'w-1.5 bg-[#f5ebd9]/30 hover:bg-[#f5ebd9]/55'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
