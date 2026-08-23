'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NutSVG from './NutSVG';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Sin animación: todo visible en su estado final.
      if (reduce) {
        gsap.set('.gsap-hidden', { visibility: 'visible', opacity: 1, y: 0 });
        return;
      }

      gsap.set('.gsap-hidden', { visibility: 'visible' });

      // --- Entrada ---
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.6 })
        .from('.hero-line', { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.08 }, '-=0.35')
        .from('.hero-sub', { y: 18, opacity: 0, duration: 0.7 }, '-=0.55')
        .from('.hero-cta', { y: 18, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.45')
        .from('.hero-nut', { scale: 0.72, opacity: 0, rotate: -25, duration: 1.2, ease: 'power2.out' }, 0.1);

      // --- Flotación continua (independiente del scroll) ---
      gsap.to('.hero-nut', {
        yPercent: -4,
        duration: 3.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      // --- Recorrido espacial de la nuez atado al scroll ---
      // La nuez rota en 3D y se desplaza desde el hero hacia la
      // esquina del catálogo mientras el usuario baja.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          endTrigger: '#catalogo',
          end: 'top center',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to('.hero-nut', {
        rotateY: 320,
        rotateZ: 38,
        xPercent: 42,
        yPercent: 68,
        scale: 0.42,
        ease: 'none',
      })
        .to('.hero-nut', { opacity: 0.28, ease: 'none' }, 0.7)
        .to('.hero-copy', { yPercent: -18, opacity: 0, ease: 'none' }, 0)
        .to('.hero-glow', { scale: 1.6, opacity: 0, ease: 'none' }, 0);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative min-h-[100svh] overflow-hidden bg-crema pt-16"
    >
      <div
        className="hero-glow pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(200,150,79,0.30), transparent 65%)' }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
        <div className="hero-copy order-2 lg:order-1">
          <p className="hero-eyebrow gsap-hidden mb-5 inline-flex items-center gap-2 rounded-full border border-nuez/20 bg-hueso px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-nuez">
            <span className="h-1.5 w-1.5 rounded-full bg-tostado" />
            Mayorista · Salta
          </p>

          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.6rem,7vw,4.6rem)] font-semibold leading-[0.95] tracking-tight text-carbon">
            <span className="block overflow-hidden">
              <span className="hero-line gsap-hidden block">Frutos secos</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-line gsap-hidden block text-nuez">por volumen,</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-line gsap-hidden block">sin intermediarios.</span>
            </span>
          </h1>

          <p className="hero-sub gsap-hidden mt-6 max-w-md text-lg leading-relaxed text-humo">
            Precios por 5 kg, bolsa cerrada o volumen mayorista. Armá el pedido,
            calculá el envío y cerralo por WhatsApp en dos minutos.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#catalogo"
              className="hero-cta gsap-hidden inline-flex h-12 items-center rounded-full bg-carbon px-7 text-sm font-medium text-hueso transition-transform hover:scale-[1.03] active:scale-95"
            >
              Ver catálogo
            </a>
            <a
              href="#envios"
              className="hero-cta gsap-hidden inline-flex h-12 items-center rounded-full border border-carbon/15 px-7 text-sm font-medium text-carbon transition-colors hover:bg-hueso"
            >
              Calcular envío
            </a>
          </div>

          <dl className="hero-cta gsap-hidden mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-black/10 pt-6">
            {[
              ['+40', 'variedades'],
              ['24 h', 'despacho'],
              ['5 kg', 'mínimo'],
            ].map(([k, v]) => (
              <div key={v}>
                <dt className="font-[family-name:var(--font-display)] text-2xl font-semibold text-nuez">{k}</dt>
                <dd className="text-xs uppercase tracking-wider text-humo">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="order-1 flex justify-center lg:order-2" style={{ perspective: '1200px' }}>
          <NutSVG className="hero-nut h-[42vh] w-auto drop-shadow-2xl lg:h-[62vh] [transform-style:preserve-3d]" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-humo">
        scroll
      </div>
    </section>
  );
}
