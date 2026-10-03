'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { indiceCategorias, type Categoria, type RefCategoria } from '@/lib/categorias';

gsap.registerPlugin(useGSAP);

/* ------------------------------------------------------------------ */
/* Datos del carrusel                                                  */
/* ------------------------------------------------------------------ */

type Slide = {
  id: string;
  title: string;
  /** Nombre corto para el rotulo manuscrito junto al producto. */
  label: string;
  /**
   * Categoria del catalogo a la que enlaza el CTA "Ver categoria".
   *
   * No es un slug suelto: el admin puede renombrarlo desde el ABM, y un
   * slug hardcodeado dejaria el boton apuntando a un filtro vacio. Se
   * guardan slug y nombre de origen, y en runtime se busca la fila vigente
   * (ver `hrefDe()`).
   */
  cat: RefCategoria;
  doypackImg: string;
  /**
   * Correccion de escala del doypack, solo para los PNG que traen mas aire
   * transparente que el resto. Todos los assets son cuadrados, asi que
   * `object-contain` les da la misma caja: el producto se ve mas chico
   * cuando ocupa menos de su propio canvas, no por culpa del contenedor.
   *
   * Va sobre el <Image>, el nodo mas interno: los dos ancestros
   * (`[data-doypack]` y `.doypack-float`) tienen su `transform` escrito
   * inline por GSAP y cualquier `scale-*` de Tailwind ahi se pierde.
   */
  doypackScale?: string;
  floatingImgs: string[];
};

const SLIDES: Slide[] = [
  {
    id: 'frutos-secos',
    title: 'F R U T O S   S E C O S',
    label: 'Frutos Secos',
    cat: { slug: 'frutos-secos', nombre: 'Frutos Secos' },
    doypackImg: '/images/hero/doypack-nuez.png',
    // Mix de las tres variedades: el slide representa la categoria entera,
    // no un producto puntual.
    floatingImgs: [
      '/images/hero/fruto-nuez-1.png',
      '/images/hero/fruto-almendra-2.png',
      '/images/hero/fruto-pistacho-3.png',
      '/images/hero/fruto-almendra-4.png',
      '/images/hero/fruto-nuez-5.png',
    ],
  },
  {
    // Subcategoria de frutos secos en la base ('Mixes de Frutos Secos'),
    // pero el cliente la vende como linea propia: tiene su propio slide.
    id: 'mixes',
    title: 'M I X E S',
    label: 'Mixes',
    cat: { slug: 'mixes', nombre: 'Mixes de Frutos Secos' },
    doypackImg: '/images/hero/mixes.png',
    floatingImgs: [
      '/images/hero/mixes-1.png',
      '/images/hero/mixes-2.png',
    ],
  },
  {
    id: 'aceites-esenciales',
    title: 'A C E I T E S',
    label: 'Aceites Esenciales',
    cat: { slug: 'aceites', nombre: 'Aceites Naturales' },
    doypackImg: '/images/hero/aceites-esenciales.png',
    floatingImgs: [
      '/images/hero/aceites-esenciales-1.png',
      '/images/hero/aceites-esenciales-2.png',
    ],
  },
  {
    id: 'chocolates',
    title: 'C H O C O L A T E S',
    label: 'Chocolates',
    cat: { slug: 'chocolates', nombre: 'Chocolates y Confituras' },
    doypackImg: '/images/hero/chocolates.png',
    // El arte ocupa solo el 63% del alto de su canvas; el resto de los
    // doypacks llega al 88%. 88.1 / 63.1 = 1.4: lo empareja visualmente.
    doypackScale: 'scale-[1.4]',
    floatingImgs: [
      '/images/hero/chocolates-1.png',
      '/images/hero/chocolates-2.png',
    ],
  },
  {
    id: 'frutas-desecadas',
    title: 'F R U T A S   D E S E C A D A S',
    label: 'Frutas Desecadas',
    cat: { slug: 'secos', nombre: 'Frutas Desecadas' },
    doypackImg: '/images/hero/frutas-desecadas.png',
    floatingImgs: [
      '/images/hero/frutas-desecadas-1.png',
      '/images/hero/frutas-desecadas-2.png',
    ],
  },
  {
    id: 'semillas',
    title: 'S E M I L L A S',
    label: 'Semillas',
    cat: { slug: 'semillas', nombre: 'Semillas' },
    doypackImg: '/images/hero/semillas.png',
    floatingImgs: [
      '/images/hero/semillas-1.png',
      '/images/hero/semillas-2.png',
    ],
  },
  {
    id: 'confituras',
    title: 'C O N F I T U R A S',
    label: 'Confituras',
    cat: { slug: 'chocolates', nombre: 'Chocolates y Confituras' },
    doypackImg: '/images/hero/confituras.png',
    floatingImgs: [
      '/images/hero/confituras-1.png',
      '/images/hero/confituras-2.png',
    ],
  },
  {
    id: 'granola',
    title: 'G R A N O L A',
    label: 'Granola y Cereales',
    cat: { slug: 'granola', nombre: 'Granola y Cereales' },
    doypackImg: '/images/hero/granola-cereales.png',
    floatingImgs: [
      '/images/hero/granola-cereales-1.png',
      '/images/hero/granola-cereales-2.png',
    ],
  },
  {
    id: 'harinas',
    title: 'H A R I N A S',
    label: 'Harinas',
    // Las tres viven bajo "Reposteria" en la base: el slug fino es el que
    // resuelve `indice.resolver()`, y el filtro por la hija ya funciona.
    cat: { slug: 'reposteria-harinas', nombre: 'Harinas' },
    doypackImg: '/images/hero/harinas.png',
    floatingImgs: [
      '/images/hero/harinas-1.png',
      '/images/hero/harinas-2.png',
    ],
  },
  {
    // Agrupa rallado, aceite y derivados: el slide es la categoria entera.
    id: 'coco',
    title: 'C O C O',
    label: 'Coco',
    cat: { slug: 'reposteria-coco', nombre: 'Coco' },
    doypackImg: '/images/hero/coco.png',
    floatingImgs: [
      '/images/hero/coco-1.png',
      '/images/hero/coco-2.png',
    ],
  },
  {
    // Cacao en polvo y en grano se cargaron bajo los chocolates de
    // reposteria; no hay una categoria "Cacao" propia en la base.
    id: 'cacao',
    title: 'C A C A O',
    label: 'Cacao',
    cat: { slug: 'reposteria-chocolates', nombre: 'Chocolates de Repostería' },
    doypackImg: '/images/hero/cacao.png',
    floatingImgs: [
      '/images/hero/cacao-1.png',
      '/images/hero/cacao-2.png',
    ],
  },
  {
    // La categoria "Infusiones" se dio de baja: el slide pasa a destacar el
    // producto y enlaza a "Frutas Desecadas", donde vive la Flor de Jamaica.
    id: 'flor-de-jamaica',
    title: 'F L O R   D E   J A M A I C A',
    label: 'Flor De Jamaica',
    cat: { slug: 'secos', nombre: 'Frutas Desecadas' },
    doypackImg: '/images/hero/infusiones.png',
    floatingImgs: [
      '/images/hero/infusiones-1.png',
      '/images/hero/infusiones-2.png',
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

/** Cadencia del autoplay del carrusel, en ms. */
const AUTOPLAY_MS = 3000;

export default function Hero({
  categorias = [],
  catalogo = '/productos',
  canal = 'por mayor',
}: {
  categorias?: Categoria[];
  /**
   * Ruta del catalogo al que apuntan el buscador y los CTA. El canal
   * minorista reutiliza el hero entero y solo cambia esto.
   */
  catalogo?: string;
  /** Sufijo del h1 oculto: "Nutrirse · Almendras por mayor". */
  canal?: string;
}) {
  const indice = useMemo(() => indiceCategorias(categorias), [categorias]);

  /**
   * Categoria vigente de cada slide, resuelta una sola vez por render.
   * `null` = la categoria ya no existe (la borraron desde el ABM): el CTA
   * cae al catalogo completo en vez de a un filtro que no devuelve nada.
   */
  const catsResueltas = useMemo(
    () => SLIDES.map((s) => indice.resolver(s.cat)),
    [indice]
  );


  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  /**
   * Lock de transicion. `tl.isActive()` no alcanza: con la pestana en
   * segundo plano el ticker de GSAP se detiene y la timeline queda
   * congelada a mitad de camino, mientras el autoplay sigue disparando.
   * Ahi es donde se apilaban dos o tres slides visibles a la vez.
   */
  const animando = useRef(false);
  // Tweens de vuelo agrupados por slide, para pausar los invisibles.
  const drifts = useRef<gsap.core.Tween[][]>([]);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState('');

  /* ---- CTA del slide visible ----
     El href sale del slug vigente, no del hardcodeado: renombrar la
     categoria en el panel reapunta el boton solo. Si la borraron, no se arma
     `?cat=` y el CTA lleva al catalogo completo: mejor eso que un filtro que
     no devuelve nada.

     El rotulo NO se toca: "Flor De Jamaica" y "Confituras" son copy del
     slide, no el nombre de su categoria (las dos enlazan a una categoria mas
     amplia). */
  const catActiva = catsResueltas[active] ?? null;
  const hrefActivo = catActiva ? `${catalogo}?cat=${catActiva.slug}` : catalogo;

  /* Autoplay. `pausado` es transitorio (puntero sobre los controles);
     `detenido` es definitivo:
     si el usuario tomo el control del carrusel (flecha, punto o swipe) no
     tiene sentido que la pagina se lo siga moviendo sola. */
  const [pausado, setPausado] = useState(false);
  const [detenido, setDetenido] = useState(false);

  const { contextSafe } = useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* ---- Estado inicial: solo el slide 0 visible ---- */
      SLIDES.forEach((_, i) => {
        const on = i === 0;
        gsap.set(q(`[data-label="${i}"]`), {
          autoAlpha: on ? 1 : 0,
          y: on ? 0 : 18,
          scale: on ? 1 : 0.9,
          pointerEvents: 'none',
        });
        gsap.set(q(`[data-doypack="${i}"]`), {
          autoAlpha: on ? 1 : 0,
          yPercent: on ? 0 : 100,
          pointerEvents: 'none',
        });
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

  /**
   * Deja el DOM exactamente en el estado del slide `idx`, sin animar: mata
   * los tweens de transicion pendientes y apaga TODO lo que no sea ese
   * slide (`autoAlpha: 0` ya escribe `visibility: hidden`, asi que un slide
   * apagado no puede quedar semitransparente ni capturar clics).
   *
   * Es la red de seguridad del carrusel: se llama al terminar cada
   * transicion y al volver a la pestana. Cualquier estado intermedio raro
   * se colapsa al estado correcto.
   */
  const fijarSlide = contextSafe((idx: number) => {
    const q = gsap.utils.selector(root);

    SLIDES.forEach((_, i) => {
      const on = i === idx;
      const label = q(`[data-label="${i}"]`);
      const doypack = q(`[data-doypack="${i}"]`);
      const frutos = q(`[data-slide="${i}"] .fruit`);

      // Solo las capas de transicion. El vuelo de los frutos vive en
      // `.fruit-drift` y la levitacion en `.doypack-float`: no se tocan.
      gsap.killTweensOf([...label, ...doypack, ...frutos]);

      gsap.set(label, { autoAlpha: on ? 1 : 0, y: 0, scale: on ? 1 : 0.9, pointerEvents: 'none' });
      gsap.set(doypack, { autoAlpha: on ? 1 : 0, yPercent: on ? 0 : 100, pointerEvents: 'none' });
      gsap.set(frutos, { autoAlpha: on ? 1 : 0 });

      if (on) drifts.current[i]?.forEach((t) => t.resume());
      else drifts.current[i]?.forEach((t) => t.pause());
    });
  });

  const go = contextSafe((next: number) => {
    const cur = activeRef.current;
    if (next === cur) return;
    // Lock explicito: un clic rapido o un tick de autoplay desincronizado
    // no pueden abrir una segunda transicion sobre la primera.
    if (animando.current) return;

    const q = gsap.utils.selector(root);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Restos de la transicion anterior (una timeline congelada por un cambio
       de pestana, por ejemplo) se descartan ANTES de tomar el lock: `kill()`
       dispara el `onInterrupt` de esa timeline, que libera el lock. Tomarlo
       primero lo perderia en el mismo tick. */
    tlRef.current?.kill();
    tlRef.current = null;

    animando.current = true;
    activeRef.current = next;
    setActive(next);

    // El vuelo del slide entrante arranca ANTES del crossfade, asi ya viene
    // en movimiento cuando aparece. El saliente se pausa al terminar.
    drifts.current[next]?.forEach((t) => t.resume());

    if (reduce) {
      fijarSlide(next);
      animando.current = false;
      return;
    }

    /* Red de seguridad del lock: si la timeline no llega a disparar sus
       callbacks (contexto revertido, pestana oculta toda la transicion), el
       temporizador libera igual y el autoplay no queda muerto. */
    let rescate: ReturnType<typeof setTimeout> | undefined;

    const liberar = () => {
      clearTimeout(rescate);
      animando.current = false;
    };

    const soltar = () => {
      liberar();
      // Colapsa al estado limpio del slide vigente: si mientras tanto hubo
      // otro cambio, `activeRef` ya apunta al correcto.
      fijarSlide(activeRef.current);
    };

    // `onInterrupt` solo suelta el lock: re-sincronizar el DOM ahi pisaria
    // la transicion nueva que acaba de matar a esta.
    const tl = gsap.timeline({ onComplete: soltar, onInterrupt: liberar });
    tlRef.current = tl;

    rescate = setTimeout(soltar, (DUR.out + DUR.in + 0.8) * 1000);

    // Mata cualquier tween previo sobre los dos slides implicados: sin esto,
    // un fade a medio camino sigue escribiendo opacidad sobre el mismo nodo
    // que la timeline nueva esta animando.
    gsap.killTweensOf([
      ...q(`[data-label="${cur}"]`),
      ...q(`[data-doypack="${cur}"]`),
      ...q(`[data-slide="${cur}"] .fruit`),
      ...q(`[data-label="${next}"]`),
      ...q(`[data-doypack="${next}"]`),
      ...q(`[data-slide="${next}"] .fruit`),
    ]);

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

  const avanzar = () => go((activeRef.current + 1) % SLIDES.length);

  /** Interaccion explicita del usuario: corta el autoplay para siempre. */
  const tomarControl = () => setDetenido(true);

  const prev = () => {
    tomarControl();
    go((activeRef.current - 1 + SLIDES.length) % SLIDES.length);
  };
  const next = () => {
    tomarControl();
    avanzar();
  };

  /* ---------------- Autoplay ----------------
     El efecto se re-arma en cada cambio de slide, asi el reloj vuelve a
     cero despues de una transicion y no queda un salto corto pendiente.

     Dos guardas dentro del tick:
     - `document.hidden`: en segundo plano el ticker de GSAP se frena pero
       `setInterval` sigue corriendo. Sin esta guarda se encolaban cambios
       de slide que al volver a la pestana se resolvian todos juntos.
     - `animando`: un tick que cae encima de una transicion no hace nada. */
  useEffect(() => {
    if (pausado || detenido) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = setInterval(() => {
      if (document.hidden || animando.current) return;
      avanzar();
    }, AUTOPLAY_MS);

    return () => clearInterval(id);
    // `active` entra como dependencia a proposito: reinicia el temporizador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pausado, detenido, active]);

  /* ---- Cambio de pestana. Al irse se descarta la transicion en curso
         (quedaria congelada a mitad y el lock nunca se liberaria); al
         volver se re-sincroniza el DOM con el slide vigente. ---- */
  useEffect(() => {
    const onVisibilidad = () => {
      if (document.hidden) {
        tlRef.current?.kill();
        tlRef.current = null;
        animando.current = false;
      } else {
        fijarSlide(activeRef.current);
      }
    };
    document.addEventListener('visibilitychange', onVisibilidad);
    return () => document.removeEventListener('visibilitychange', onVisibilidad);
  }, [fijarSlide]);

  /**
   * El hero ocupa el viewport completo, asi que pausar por hover sobre la
   * <section> dejaba el autoplay muerto apenas el puntero entraba (y el
   * `mouseleave` no llega nunca mientras se scrollea la home). El pausado
   * se limita a los controles: flechas, puntos, buscador y CTAs.
   */
  const hoverControles = {
    onMouseEnter: () => setPausado(true),
    onMouseLeave: () => setPausado(false),
  };

  /* ---------------- Buscador ---------------- */
  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    // `#catalogo`: ancla de la grilla en el catalogo del canal.
    router.push(q ? `${catalogo}?q=${encodeURIComponent(q)}#catalogo` : `${catalogo}#catalogo`);
  };

  /* ---------------- Swipe tactil (mobile) ----------------
     No se puede usar `scroll-snap`: los slides no estan uno al lado del otro
     en un track scrolleable, son capas absolutas superpuestas que cruza GSAP.
     Asi que el gesto se mide a mano y termina llamando al mismo `go()` que
     las flechas.

     `touchmove` no llama a `preventDefault()`: el hero ocupa toda la
     pantalla y bloquearlo dejaria la home sin scroll vertical. El gesto se
     descarta si el movimiento es mas vertical que horizontal, que es como se
     distingue "deslizar el carrusel" de "seguir bajando por la pagina". */
  const touch = useRef<{ x: number; y: number } | null>(null);

  /** Recorrido horizontal minimo, en px, para contar como swipe. */
  const SWIPE_MIN = 45;

  const onTouchStart = (e: React.TouchEvent) => {
    // Cualquier toque sobre el hero corta el autoplay: en mobile el hover
    // no existe y el usuario esta mirando lo que toco.
    tomarControl();
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const inicio = touch.current;
    touch.current = null;
    if (!inicio) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - inicio.x;
    const dy = t.clientY - inicio.y;

    // Gesto vertical: es scroll de la pagina, no cambio de slide.
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return;

    // Arrastrar hacia la izquierda avanza, igual que la flecha derecha.
    if (dx < 0) next();
    else prev();
  };

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
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touch.current = null;
      }}
      /* `touch-pan-y`: le avisa al navegador que solo el scroll vertical es
         suyo, asi el gesto horizontal no dispara el "volver atras" por
         deslizamiento de iOS/Android antes de que lleguen los eventos. */
      className="relative min-h-[100svh] touch-pan-y overflow-hidden bg-gradient-to-b from-[#1e4a28] via-[#143620] to-[#0b1c0f] pt-16 sm:pt-20"
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

      {/* ---------- Z-30 · buscador global, apenas debajo del navbar ---------- */}
      <div
        {...hoverControles}
        className="absolute inset-x-0 top-[4.5rem] z-30 flex justify-center px-5 sm:top-24"
      >
        {/* Buscador global: manda a /productos?q= y ahi filtra la grilla. */}
        <form
          onSubmit={buscar}
          role="search"
          className="hero-ui flex w-full max-w-md items-center gap-2 rounded-full border border-[#f5ebd9]/20 bg-[#0b1c0f]/45 p-1.5 pl-4 backdrop-blur-md"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-[#f5ebd9]/60" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            aria-label="Buscar productos"
            placeholder="Buscar almendras, semillas, granola…"
            /* 16 px en mobile: evita el auto-zoom de iOS al enfocar. */
            className="h-10 min-w-0 flex-1 bg-transparent text-base text-[#f5ebd9] outline-none placeholder:text-[#f5ebd9]/45 sm:text-sm"
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-full bg-[#f5ebd9] px-5 text-sm font-medium text-[#0b1c0f] transition-transform hover:scale-[1.03] active:scale-95"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* ---------- Z-[25] · rótulo manuscrito + flecha hacia el producto.
           Va por encima del doypack para que se lea siempre. ---------- */}
      <div className="pointer-events-none absolute inset-0 z-[25]">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            data-label={i}
            aria-hidden={i !== active}
            className="absolute right-[8%] top-[22%] origin-bottom-right select-none text-right sm:right-[14%] sm:top-[26%] lg:right-[19%]"
          >
            <p className="font-[family-name:var(--font-hand)] text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-none text-[#f5ebd9] drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
              {s.label}
            </p>
            <HandArrow className="mt-1 mr-2 ml-auto h-[clamp(56px,9vw,120px)] w-auto scale-x-[-1] text-[#f5ebd9]/80 sm:mr-4" />
          </div>
        ))}
        <h1 className="sr-only">
          Nutrirse · {SLIDES[active].label} {canal}
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
                  className={`object-contain drop-shadow-[0_45px_55px_rgba(0,0,0,0.55)] ${s.doypackScale ?? ''}`}
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
        {...hoverControles}
        aria-label="Producto anterior"
        className="hero-ui absolute left-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#f5ebd9]/20 bg-[#f5ebd9]/10 text-[#f5ebd9] backdrop-blur transition-colors hover:bg-[#f5ebd9]/20 sm:left-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        onClick={next}
        {...hoverControles}
        aria-label="Producto siguiente"
        className="hero-ui absolute right-3 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#f5ebd9]/20 bg-[#f5ebd9]/10 text-[#f5ebd9] backdrop-blur transition-colors hover:bg-[#f5ebd9]/20 sm:right-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div
        {...hoverControles}
        className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-6 px-5"
      >
        <div className="hero-ui flex flex-wrap justify-center gap-3">
          {/* CTA del slide visible: entra directo a su categoria. */}
          <Link
            href={hrefActivo}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#d6b26a] px-7 text-sm font-medium text-[#0b1c0f] transition-transform hover:scale-[1.03] active:scale-95"
          >
            Ver {SLIDES[active].label}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h13M12 5l7 7-7 7" />
            </svg>
          </Link>
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
              onClick={() => {
                tomarControl();
                go(i);
              }}
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
