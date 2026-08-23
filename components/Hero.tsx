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
/* Cuerpo 3D falso del doypack (stacking 2.5D)                         */
/* ------------------------------------------------------------------ */

/**
 * El doypack es un PNG plano: al girar en Y desaparece a 90 grados.
 * Se apilan N copias separadas en Z para simular el grosor de la bolsa.
 *
 * El apilado se centra en Z = 0 (offset -(layers-1)/2) para que el eje de
 * rotacion pase por el medio del cuerpo. Si no se centra, la bolsa orbita
 * en vez de girar sobre si misma.
 */
const DEPTH = {
  layers: 7,  // 7 capas leen mejor que 5-6 sin costo real
  step: 7,    // px entre capas -> grosor total = (layers - 1) * step
  darkest: 0.42, // brillo de la capa mas profunda (sombrea el cuerpo)
};

const DEPTH_LAYERS = Array.from({ length: DEPTH.layers }, (_, i) => {
  const z = (i - (DEPTH.layers - 1) / 2) * -DEPTH.step;
  // La capa 0 es la cara frontal; las siguientes se oscurecen.
  const t = i / (DEPTH.layers - 1);
  return { z, brightness: 1 - t * (1 - DEPTH.darkest), front: i === 0 };
});

/* ------------------------------------------------------------------ */
/* Slots de los frutos flotantes                                       */
/* ------------------------------------------------------------------ */

/**
 * Todos los slides reusan los mismos slots: la salida y la entrada ocupan
 * las mismas coordenadas y la transicion se lee continua.
 *
 * plano  = 'lente' (foreground extremo, rozando la camara)
 *          'medio' | 'fondo'
 * size   = escala real via ancho. Se usa ancho y NO `scale` de GSAP para
 *          que la escala base no pelee con el scale que anima la transicion.
 * ex/ey  = vector de fuga, multiplicado por el viewport al salir/entrar.
 */
type Slot = {
  plano: 'lente' | 'medio' | 'fondo';
  style: React.CSSProperties;
  size: string;
  blur: number;
  opacity: number;
  ex: number;
  ey: number;
  spin: number;
};

const SLOTS: Slot[] = [
  // --- Foreground extremo: enorme, casi fuera de cuadro, muy desenfocado ---
  {
    plano: 'lente',
    style: { top: '-8%', left: '-12%' },
    size: 'clamp(300px, 42vw, 640px)',
    blur: 12,
    opacity: 0.85,
    ex: -1.15,
    ey: -0.5,
    spin: -90,
  },
  {
    plano: 'lente',
    style: { bottom: '-14%', right: '-10%' },
    size: 'clamp(320px, 46vw, 700px)',
    blur: 9,
    opacity: 0.9,
    ex: 1.2,
    ey: 0.85,
    spin: 75,
  },

  // --- Mid-ground: tamano grande, blur sutil ---
  {
    plano: 'medio',
    style: { top: '14%', right: '7%' },
    size: 'clamp(96px, 13vw, 220px)',
    blur: 1.5,
    opacity: 1,
    ex: 1.0,
    ey: -0.65,
    spin: 165,
  },
  {
    plano: 'medio',
    style: { bottom: '22%', left: '13%' },
    size: 'clamp(84px, 11vw, 186px)',
    blur: 3,
    opacity: 1,
    ex: -0.95,
    ey: 0.8,
    spin: 120,
  },

  // --- Background: chico y difuso ---
  {
    plano: 'fondo',
    style: { top: '54%', left: '7%' },
    size: 'clamp(54px, 7vw, 124px)',
    blur: 5.5,
    opacity: 0.75,
    ex: -1.1,
    ey: 0.15,
    spin: 200,
  },
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

      /* ---- Levitacion idle del doypack.
             Va en `.doypack-float`, un elemento distinto del `.doypack-stage`
             que rota en la transicion: dos transforms, cero colision. ---- */
      gsap.to(q('.doypack-float'), {
        y: -26,
        duration: 3.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      /* ---- Levitacion idle de cada fruto, desfasada.
             Los del plano 'lente' se mueven mas para exagerar el parallax. ---- */
      q('.fruit-float').forEach((el, i) => {
        const lente = (el as HTMLElement).dataset.plano === 'lente';
        gsap.to(el, {
          y: lente ? gsap.utils.random(-58, -32) : gsap.utils.random(-26, -12),
          x: lente ? gsap.utils.random(-24, 24) : 0,
          rotate: gsap.utils.random(-6, 6),
          duration: gsap.utils.random(3.4, 5.6),
          delay: (i % 7) * 0.31,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      /* ---- Entrada del primer slide ---- */
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from(q('[data-title="0"]'), { yPercent: 45, autoAlpha: 0, duration: 0.9 })
        .from(q('.doypack-stage'), { scale: 0.82, autoAlpha: 0, duration: 1.1 }, 0.05)
        .from(
          q('[data-slide="0"] .fruit'),
          { autoAlpha: 0, scale: 0.6, duration: 1.2, stagger: 0.09 },
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

    /* --- Doypack: gira 360 sobre Y mostrando el cuerpo 2.5D al pasar por
           los 90 grados, y a mitad de giro se intercambia el stack entero
           para que la misma bolsa "revele" el sabor nuevo. --- */
    tl.to(q('.doypack-stage'), { rotateY: '+=360', duration: DUR.spin, ease: 'power2.inOut' }, 0)
      .to(q('.doypack-stage'), { scale: 0.92, duration: DUR.spin / 2, ease: 'power2.inOut' }, 0)
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
        { x: 0, y: 0, rotate: 0, scale: 1, autoAlpha: 1, duration: DUR.in, ease: 'power2.out' },
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
      className="relative min-h-[100svh] overflow-hidden bg-gradient-to-b from-[#1e4a28] via-[#143620] to-[#0b1c0f] pt-16"
      aria-roledescription="carousel"
      aria-label="Productos destacados"
    >
      {/* viñeta + halo cálido para que el producto no flote sobre plano */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 45%, rgba(214,178,106,0.20), transparent 70%)',
        }}
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

      {/* ---------- Z-10 · doypack central con cuerpo 2.5D ---------- */}
      <div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ perspective: '1800px' }}
      >
        <div className="doypack-stage" style={{ transformStyle: 'preserve-3d' }}>
          <div
            className="doypack-float relative h-[26rem] w-[22rem] sm:h-[32rem] sm:w-[26rem] md:h-[38rem] md:w-[30rem]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {SLIDES.map((s, i) => (
              <div
                key={s.id}
                data-doypack={i}
                className="absolute inset-0"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {DEPTH_LAYERS.map((layer, li) => (
                  <Image
                    key={li}
                    src={s.doypackImg}
                    alt={layer.front ? `Doypack ${s.title.replace(/\s+/g, '')}` : ''}
                    aria-hidden={!layer.front}
                    fill
                    priority={i === 0 && layer.front}
                    sizes="(max-width: 640px) 88vw, 30rem"
                    className="absolute inset-0 object-contain"
                    style={{
                      transform: `translateZ(${layer.z}px)`,
                      filter: layer.front
                        ? 'drop-shadow(0 45px 55px rgba(0,0,0,0.55))'
                        : `brightness(${layer.brightness})`,
                    }}
                  />
                ))}
              </div>
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
                    data-plano={slot.plano}
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
