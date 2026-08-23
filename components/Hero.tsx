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

/**
 * Slots fijos de los frutos flotantes. Todos los slides reusan los mismos
 * slots, asi la salida y la entrada ocupan las mismas coordenadas y la
 * transicion se lee continua.
 *
 * ex / ey  = vector de fuga (multiplicado por el viewport al salir/entrar).
 * blur     = profundidad de campo simulada.
 */
type Slot = {
  style: React.CSSProperties;
  size: string;
  blur: number;
  ex: number;
  ey: number;
  spin: number;
};

const SLOTS: Slot[] = [
  { style: { top: '13%', left: '11%' },    size: 'clamp(78px, 11vw, 168px)', blur: 0,   ex: -1.0, ey: -0.55, spin: -140 },
  { style: { top: '19%', right: '10%' },   size: 'clamp(64px, 9vw, 138px)',  blur: 2.5, ex:  1.0, ey: -0.65, spin:  165 },
  { style: { bottom: '17%', left: '17%' }, size: 'clamp(56px, 8vw, 120px)',  blur: 4,   ex: -0.95, ey:  0.8,  spin:  120 },
  { style: { bottom: '11%', right: '15%' },size: 'clamp(80px, 11.5vw, 178px)',blur: 0,  ex:  1.0, ey:  0.75, spin: -110 },
  { style: { top: '47%', left: '5%' },     size: 'clamp(48px, 6.5vw, 100px)',blur: 5.5, ex: -1.1, ey:  0.1,  spin:  200 },
];

const DUR = { spin: 1.5, out: 1.15, in: 1.55 };

/* ------------------------------------------------------------------ */

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [active, setActive] = useState(0);

  const { contextSafe } = useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* ---- Estado inicial: solo el slide 0 visible ---- */
      SLIDES.forEach((_, i) => {
        const on = i === 0;
        gsap.set(q(`[data-title="${i}"]`), { autoAlpha: on ? 1 : 0, yPercent: on ? 0 : 40 });
        gsap.set(q(`[data-doypack="${i}"]`), { autoAlpha: on ? 1 : 0 });
        gsap.set(q(`[data-slide="${i}"] .fruit`), { autoAlpha: on ? 1 : 0, x: 0, y: 0, scale: 1 });
      });

      if (reduce) return;

      /* ---- Levitacion idle del doypack (elemento interno: no colisiona
             con el rotateY del stage que maneja la transicion) ---- */
      gsap.to(q('.doypack-float'), {
        y: -22,
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      /* ---- Levitacion idle de cada fruto, desfasada ---- */
      q('.fruit-float').forEach((el, i) => {
        gsap.to(el, {
          y: gsap.utils.random(-26, -12),
          rotate: gsap.utils.random(-7, 7),
          duration: gsap.utils.random(2.6, 4.4),
          delay: (i % 7) * 0.28,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      /* ---- Entrada del primer slide ---- */
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro
        .from(q('[data-title="0"]'), { yPercent: 45, autoAlpha: 0, duration: 0.9 })
        .from(q('.doypack-stage'), { scale: 0.82, autoAlpha: 0, duration: 1.1 }, 0.05)
        .from(
          q('[data-slide="0"] .fruit'),
          { autoAlpha: 0, scale: 0.6, duration: 1.1, stagger: 0.09 },
          0.3
        )
        .from(q('.hero-ui'), { y: 18, autoAlpha: 0, duration: 0.6, stagger: 0.06 }, 0.6);
    },
    { scope: root }
  );

  /* ---------------- Transicion entre slides ---------------- */

  const go = contextSafe((next: number) => {
    const cur = activeRef.current;
    if (next === cur) return;
    if (tlRef.current?.isActive()) return; // ignora clics durante la animacion

    const q = gsap.utils.selector(root);
    const W = window.innerWidth;
    const H = window.innerHeight;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    activeRef.current = next;
    setActive(next);

    /* --- Sin animacion: swap seco --- */
    if (reduce) {
      gsap.set(q(`[data-title="${cur}"]`), { autoAlpha: 0 });
      gsap.set(q(`[data-doypack="${cur}"]`), { autoAlpha: 0 });
      gsap.set(q(`[data-slide="${cur}"] .fruit`), { autoAlpha: 0 });
      gsap.set(q(`[data-title="${next}"]`), { autoAlpha: 1, yPercent: 0 });
      gsap.set(q(`[data-doypack="${next}"]`), { autoAlpha: 1 });
      gsap.set(q(`[data-slide="${next}"] .fruit`), { autoAlpha: 1, x: 0, y: 0, scale: 1 });
      return;
    }

    const vec = (el: Element) => ({
      x: Number((el as HTMLElement).dataset.ex ?? 1) * W * 0.72,
      y: Number((el as HTMLElement).dataset.ey ?? 0) * H * 0.72,
      spin: Number((el as HTMLElement).dataset.spin ?? 0),
    });

    const tl = gsap.timeline();
    tlRef.current = tl;

    /* --- Doypack: gira 360 sobre Y y a mitad de giro se intercambia
           la imagen, de modo que la misma bolsa "revela" el sabor nuevo. --- */
    tl.to(
      q('.doypack-stage'),
      { rotateY: '+=360', duration: DUR.spin, ease: 'power2.inOut' },
      0
    )
      .to(q('.doypack-stage'), { scale: 0.9, duration: DUR.spin / 2, ease: 'power2.inOut' }, 0)
      .to(q('.doypack-stage'), { scale: 1, duration: DUR.spin / 2, ease: 'power2.out' }, DUR.spin / 2)
      // swap exacto en el punto ciego del giro (canto de la bolsa)
      .set(q(`[data-doypack="${cur}"]`), { autoAlpha: 0 }, DUR.spin * 0.5)
      .set(q(`[data-doypack="${next}"]`), { autoAlpha: 1 }, DUR.spin * 0.5);

    /* --- Titulo de fondo: sale hacia arriba, entra desde abajo --- */
    tl.to(
      q(`[data-title="${cur}"]`),
      { yPercent: -38, autoAlpha: 0, duration: 0.45, ease: 'power2.in' },
      0
    ).fromTo(
      q(`[data-title="${next}"]`),
      { yPercent: 38, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out' },
      0.4
    );

    /* --- Frutos actuales: vuelan lento hacia los bordes --- */
    q(`[data-slide="${cur}"] .fruit`).forEach((el, i) => {
      const v = vec(el);
      tl.to(
        el,
        {
          x: v.x,
          y: v.y,
          rotate: v.spin,
          scale: 0.55,
          autoAlpha: 0,
          duration: DUR.out,
          ease: 'power1.in',
        },
        i * 0.07
      );
    });

    /* --- Frutos nuevos: entran lento desde fuera de pantalla --- */
    q(`[data-slide="${next}"] .fruit`).forEach((el, i) => {
      const v = vec(el);
      tl.fromTo(
        el,
        { x: v.x, y: v.y, rotate: -v.spin, scale: 0.55, autoAlpha: 0 },
        {
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          autoAlpha: 1,
          duration: DUR.in,
          ease: 'power2.out',
        },
        0.45 + i * 0.09
      );
    });
  });

  const prev = () => go((activeRef.current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => go((activeRef.current + 1) % SLIDES.length);

  /* ---------------------------- Render ---------------------------- */

  return (
    <section
      ref={root}
      className="relative min-h-[100svh] overflow-hidden bg-hueso pt-16"
      aria-roledescription="carousel"
      aria-label="Productos destacados"
    >
      {/* halo ambiental */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[85vmin] w-[85vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(200,150,79,0.22), transparent 68%)' }}
      />

      {/* ---------- Z-0 · titulo gigante de fondo ---------- */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        {SLIDES.map((s, i) => (
          <h1
            key={s.id}
            data-title={i}
            className="absolute whitespace-nowrap px-4 text-center font-[family-name:var(--font-display)] text-[clamp(2.4rem,11vw,10rem)] font-bold leading-none tracking-tight text-crema select-none"
            aria-hidden={i !== active}
          >
            {s.title}
          </h1>
        ))}
        <span className="sr-only">{SLIDES[active].title.replace(/\s+/g, '')}</span>
      </div>

      {/* ---------- Z-10 · doypack central ---------- */}
      <div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ perspective: '1600px' }}
      >
        <div className="doypack-stage" style={{ transformStyle: 'preserve-3d' }}>
          <div className="doypack-float relative h-[44vh] w-[34vh] sm:h-[52vh] sm:w-[40vh]">
            {SLIDES.map((s, i) => (
              <Image
                key={s.id}
                data-doypack={i}
                src={s.doypackImg}
                alt={`Doypack ${s.title.replace(/\s+/g, '')}`}
                fill
                priority={i === 0}
                sizes="(max-width: 640px) 60vw, 40vh"
                className="absolute inset-0 object-contain drop-shadow-[0_35px_45px_rgba(107,68,35,0.28)]"
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Z-20 · frutos flotantes ---------- */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {SLIDES.map((s, si) => (
          <div key={s.id} data-slide={si} className="absolute inset-0">
            {s.floatingImgs.map((src, fi) => {
              const slot = SLOTS[fi % SLOTS.length];
              return (
                <div
                  key={src}
                  className="fruit absolute will-change-transform"
                  data-ex={slot.ex}
                  data-ey={slot.ey}
                  data-spin={slot.spin}
                  style={{ ...slot.style, width: slot.size }}
                >
                  <div
                    className="fruit-float will-change-transform"
                    style={slot.blur ? { filter: `blur(${slot.blur}px)` } : undefined}
                  >
                    <Image
                      src={src}
                      alt=""
                      width={320}
                      height={320}
                      priority={si === 0}
                      sizes="(max-width: 640px) 25vw, 12vw"
                      className="h-auto w-full object-contain drop-shadow-[0_16px_22px_rgba(107,68,35,0.22)]"
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
        className="hero-ui absolute left-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-carbon/10 bg-hueso/60 text-carbon backdrop-blur transition-colors hover:bg-hueso sm:left-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        onClick={next}
        aria-label="Producto siguiente"
        className="hero-ui absolute right-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-carbon/10 bg-hueso/60 text-carbon backdrop-blur transition-colors hover:bg-hueso sm:right-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-6 px-5">
        <div className="hero-ui flex flex-wrap justify-center gap-3">
          <a
            href="#catalogo"
            className="inline-flex h-12 items-center rounded-full bg-carbon px-7 text-sm font-medium text-hueso transition-transform hover:scale-[1.03] active:scale-95"
          >
            Ver catálogo
          </a>
          <a
            href="#envios"
            className="inline-flex h-12 items-center rounded-full border border-carbon/15 px-7 text-sm font-medium text-carbon transition-colors hover:bg-crema"
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
                i === active ? 'w-9 bg-nuez' : 'w-1.5 bg-carbon/25 hover:bg-carbon/45'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
