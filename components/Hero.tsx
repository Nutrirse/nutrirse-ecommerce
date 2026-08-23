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
  doypackImg: string;
  floatingImgs: string[];
};

const SLIDES: Slide[] = [
  {
    id: 'almendra',
    title: 'A L M E N D R A',
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
 * plano  = 'lente' (foreground extremo, rozando la camara) | 'medio' | 'fondo'
 * size   = escala real via ancho. Se usa ancho y NO `scale` para no pelear
 *          con ningun transform de GSAP.
 * dir    = sentido del vuelo continuo (1 der, -1 izq).
 * speed  = segundos en cruzar el ciclo completo. Mas alto = mas lento.
 */
type Slot = {
  plano: 'lente' | 'medio' | 'fondo';
  style: React.CSSProperties;
  size: string;
  blur: number;
  opacity: number;
  dir: 1 | -1;
  speed: number;
  bob: number;
};

const SLOTS: Slot[] = [
  // --- Foreground extremo: enorme, casi fuera de cuadro, muy desenfocado ---
  {
    plano: 'lente',
    style: { top: '-8%', left: '-12%' },
    size: 'clamp(300px, 42vw, 640px)',
    blur: 12,
    opacity: 0.85,
    dir: 1,
    speed: 78,
    bob: 46,
  },
  {
    plano: 'lente',
    style: { bottom: '-14%', right: '-10%' },
    size: 'clamp(320px, 46vw, 700px)',
    blur: 9,
    opacity: 0.9,
    dir: -1,
    speed: 92,
    bob: 38,
  },

  // --- Mid-ground ---
  {
    plano: 'medio',
    style: { top: '14%', right: '7%' },
    size: 'clamp(96px, 13vw, 220px)',
    blur: 1.5,
    opacity: 1,
    dir: -1,
    speed: 54,
    bob: 22,
  },
  {
    plano: 'medio',
    style: { bottom: '22%', left: '13%' },
    size: 'clamp(84px, 11vw, 186px)',
    blur: 3,
    opacity: 1,
    dir: 1,
    speed: 61,
    bob: 26,
  },

  // --- Background: chico y difuso ---
  {
    plano: 'fondo',
    style: { top: '54%', left: '7%' },
    size: 'clamp(54px, 7vw, 124px)',
    blur: 5.5,
    opacity: 0.75,
    dir: 1,
    speed: 47,
    bob: 18,
  },
];

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
        gsap.set(q(`[data-title="${i}"]`), { autoAlpha: on ? 1 : 0, yPercent: on ? 0 : 40 });
        gsap.set(q(`[data-doypack="${i}"]`), { autoAlpha: on ? 1 : 0, yPercent: on ? 0 : 100 });
        gsap.set(q(`[data-slide="${i}"] .fruit`), { autoAlpha: on ? 1 : 0 });
      });

      if (reduce) return;

      /* ---- Levitacion idle del doypack.
             Vive en `.doypack-float`, un elemento distinto del wrapper
             `[data-doypack]` que anima la transicion: dos transforms
             independientes, cero colision. ---- */
      gsap.to(q('.doypack-float'), {
        y: -24,
        duration: 3.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      /* ---- Vuelo continuo de los frutos.
             Corre en `.fruit-drift` (interno) y NUNCA se toca al cambiar de
             slide: la transicion solo cruza opacidad en `.fruit` (externo).
             Por eso el vuelo no da tirones ni se reinicia.

             Los tweens se agrupan por slide para poder pausar los que no
             estan a la vista: 20 tweens infinitos corriendo a la vez son
             20 recalculos de transform por frame para nada. ---- */
      const W = window.innerWidth;
      drifts.current = SLIDES.map(() => []);

      SLIDES.forEach((_, si) => {
        q(`[data-slide="${si}"] .fruit-drift`).forEach((el) => {
          const d = (el as HTMLElement).dataset;
          const dir = Number(d.dir ?? 1);
          const speed = Number(d.speed ?? 60);
          const bob = Number(d.bob ?? 20);

          // Rango de wrap: bien fuera de cuadro, asi el salto del ciclo
          // ocurre siempre fuera de la pantalla y no se ve.
          const span = W * 0.9 + 700;
          const wrap = gsap.utils.wrap(-span, span);

          gsap.set(el, { x: gsap.utils.random(-span, span) });

          // Travesia horizontal infinita.
          const cruce = gsap.to(el, {
            x: `+=${dir * span * 2}`,
            duration: speed,
            ease: 'none',
            repeat: -1,
            modifiers: { x: (v) => `${wrap(parseFloat(v))}px` },
          });

          // Cabeceo vertical suave, desacoplado del avance horizontal.
          const cabeceo = gsap.to(el, {
            y: -bob,
            rotate: gsap.utils.random(-6, 6),
            duration: gsap.utils.random(5, 9),
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });

          drifts.current[si].push(cruce, cabeceo);
        });

        // Arranca solo el slide visible.
        if (si !== 0) drifts.current[si].forEach((t) => t.pause());
      });

      /* ---- Entrada del primer slide ---- */
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from(q('[data-title="0"]'), { yPercent: 45, autoAlpha: 0, duration: 0.9 })
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
      gsap.set(q(`[data-title="${cur}"]`), { autoAlpha: 0 });
      gsap.set(q(`[data-doypack="${cur}"]`), { autoAlpha: 0, yPercent: 100 });
      gsap.set(q(`[data-slide="${cur}"] .fruit`), { autoAlpha: 0 });
      gsap.set(q(`[data-title="${next}"]`), { autoAlpha: 1, yPercent: 0 });
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

    /* --- Doypack: la bolsa actual baja y se desvanece; la nueva sube
           desde abajo. Una sola imagen por slide, sin capas 3D. --- */
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

    /* --- Titulo de fondo: sale hacia arriba, entra desde abajo --- */
    tl.to(
      q(`[data-title="${cur}"]`),
      { yPercent: -38, autoAlpha: 0, duration: 0.4, ease: 'power2.in' },
      0
    ).fromTo(
      q(`[data-title="${next}"]`),
      { yPercent: 38, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: 'power2.out' },
      0.32
    );

    /* --- Frutos: SOLO cruce de opacidad. No se tocan x/y/rotate, asi el
           vuelo continuo sigue corriendo sin cortes ni reinicios. --- */
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

  return (
    <section
      ref={root}
      className="relative min-h-[100svh] overflow-hidden bg-gradient-to-b from-[#1e4a28] via-[#143620] to-[#0b1c0f] pt-16"
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

      {/* ---------- Z-0 · título gigante de fondo ---------- */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        {SLIDES.map((s, i) => (
          <h1
            key={s.id}
            data-title={i}
            className="absolute select-none whitespace-nowrap px-4 text-center font-[family-name:var(--font-display)] text-[clamp(2.4rem,12vw,11rem)] font-bold leading-none tracking-tight text-[#f5ebd9]/12"
            aria-hidden={i !== active}
          >
            {s.title}
          </h1>
        ))}
        <span className="sr-only">{SLIDES[active].title.replace(/\s+/g, '')}</span>
      </div>

      {/* ---------- Z-10 · doypack central (una sola imagen por slide) ---------- */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="relative h-[26rem] w-[22rem] sm:h-[32rem] sm:w-[26rem] md:h-[38rem] md:w-[30rem]">
          {SLIDES.map((s, i) => (
            <div key={s.id} data-doypack={i} className="absolute inset-0 will-change-transform">
              <div className="doypack-float absolute inset-0 will-change-transform">
                <Image
                  src={s.doypackImg}
                  alt={`Doypack ${s.title.replace(/\s+/g, '')}`}
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

      {/* ---------- Z-20 · frutos flotantes ---------- */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {SLIDES.map((s, si) => (
          <div key={s.id} data-slide={si} className="absolute inset-0">
            {s.floatingImgs.map((src, fi) => {
              const slot = SLOTS[fi % SLOTS.length];
              return (
                // .fruit  -> solo opacidad (transicion de slide)
                // .fruit-drift -> vuelo continuo, nunca interrumpido
                <div
                  key={src}
                  className="fruit absolute"
                  style={{ ...slot.style, width: slot.size }}
                >
                  <div
                    className="fruit-drift will-change-transform"
                    data-dir={slot.dir}
                    data-speed={slot.speed}
                    data-bob={slot.bob}
                    style={{
                      filter: `blur(${slot.blur}px) drop-shadow(0 18px 26px rgba(0,0,0,0.45))`,
                      opacity: slot.opacity,
                    }}
                  >
                    <Image
                      src={src}
                      alt=""
                      width={720}
                      height={720}
                      priority={si === 0 && slot.plano === 'lente'}
                      sizes={slot.plano === 'lente' ? '46vw' : '14vw'}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                </div>
              );
            })}
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
              aria-label={s.title.replace(/\s+/g, '')}
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
