import Image from 'next/image';
import Link from 'next/link';

// Sin datos: se prerenderiza una vez y se sirve estatico.
export const dynamic = 'force-static';

/**
 * Splash de entrada. La raiz ya no muestra catalogo: el visitante elige
 * canal y cada boton lleva a su home (`/minorista` o `/mayorista`). El
 * navbar recuerda la eleccion (lib/modo.ts) para las paginas neutras.
 *
 * El navbar y el footer se esconden aca (components/SoloSitioPublico.tsx).
 */
export default function Splash() {
  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#143620] to-[#0b1c0f] px-5 py-12 text-[#f5ebd9]">
      {/* Halo detras del personaje */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d6b26a]/15 blur-3xl"
      />

      <Image
        src="/Logo.png"
        alt="Nutrirse"
        width={220}
        height={220}
        priority
        className="relative h-16 w-auto animate-fade-in object-contain sm:h-20"
      />

      <Personaje />

      <h1 className="relative mt-2 animate-fade-up text-center font-[family-name:var(--font-display)] text-[clamp(1.9rem,5vw,3.2rem)] font-semibold leading-tight tracking-tight [animation-delay:0.5s]">
        ¡Hola! ¿Cómo querés comprar?
      </h1>
      <p className="relative mt-2 animate-fade-up text-center text-[#f5ebd9]/70 [animation-delay:0.6s]">
        Elegí tu canal. Lo podés cambiar cuando quieras desde el menú.
      </p>

      <div className="relative mt-8 grid w-full max-w-2xl animate-fade-up gap-4 [animation-delay:0.75s] sm:grid-cols-2">
        <BotonModo
          href="/minorista"
          titulo="Soy Minorista"
          detalle="Para tu casa · presentaciones chicas"
          claro
        />
        <BotonModo
          href="/mayorista"
          titulo="Soy Mayorista"
          detalle="Para tu negocio · desde 5 kg"
        />
      </div>
    </section>
  );
}

function BotonModo({
  href,
  titulo,
  detalle,
  claro = false,
}: {
  href: string;
  titulo: string;
  detalle: string;
  claro?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col items-center justify-center rounded-2xl px-6 py-6 text-center shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)] transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] sm:py-8 ${
        claro
          ? 'bg-[#f5ebd9] text-[#0b1c0f] hover:bg-white'
          : 'border-2 border-[#d6b26a] bg-transparent text-[#f5ebd9] hover:bg-[#d6b26a] hover:text-[#0b1c0f]'
      }`}
    >
      <span className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
        {titulo}
      </span>
      <span className={`mt-1 text-sm ${claro ? 'text-[#0b1c0f]/60' : 'opacity-70'}`}>
        {detalle}
      </span>
      <span aria-hidden className="mt-3 text-lg transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}

/**
 * Placeholder del personaje de marca: sonrie, lleva gorra y levanta el
 * pulgar. Animaciones en app/globals.css (`.pj-*`). Cuando llegue el asset
 * final se reemplaza este SVG por un <Image> o un Lottie y se borran las
 * clases.
 */
function Personaje() {
  return (
    <div className="pj-entrada relative mt-6 h-52 w-52 sm:h-60 sm:w-60" role="img" aria-label="Personaje de Nutrirse con el pulgar arriba">
      <svg viewBox="0 0 200 200" className="pj-flota h-full w-full overflow-visible" aria-hidden>
        {/* Cuerpo */}
        <path d="M52 200c0-34 21-56 48-56s48 22 48 56Z" fill="#4A5D3A" />
        <path d="M86 146h28l-14 16Z" fill="#f5ebd9" />

        {/* Brazo con pulgar: rota desde el hombro */}
        <g className="pj-brazo">
          <path d="M140 164c10-6 18-20 22-38" stroke="#4A5D3A" strokeWidth="16" strokeLinecap="round" fill="none" />
          <rect x="150" y="108" width="24" height="22" rx="8" fill="#E8B98A" />
          <rect x="157" y="88" width="10" height="26" rx="5" fill="#E8B98A" />
        </g>

        {/* Cabeza */}
        <circle cx="100" cy="98" r="42" fill="#E8B98A" />
        <circle cx="60" cy="100" r="7" fill="#E8B98A" />
        <circle cx="140" cy="100" r="7" fill="#E8B98A" />

        {/* Ojos (parpadean) */}
        <g className="pj-ojos">
          <ellipse cx="85" cy="96" rx="5" ry="6" fill="#1C1A17" />
          <ellipse cx="115" cy="96" rx="5" ry="6" fill="#1C1A17" />
        </g>
        <circle cx="76" cy="110" r="6" fill="#e58a6b" opacity=".45" />
        <circle cx="124" cy="110" r="6" fill="#e58a6b" opacity=".45" />

        {/* Sonrisa */}
        <path d="M82 114c8 12 28 12 36 0" stroke="#1C1A17" strokeWidth="4" strokeLinecap="round" fill="#fff" />

        {/* Gorra */}
        <g className="pj-gorra">
          <path d="M58 82c0-28 19-44 42-44s42 16 42 44Z" fill="#C8964F" />
          <path d="M100 82h52c4 0 6 6 0 8l-52 2Z" fill="#6B4423" />
          <circle cx="100" cy="38" r="5" fill="#6B4423" />
          <path d="M80 62c4-8 12-12 20-12" stroke="#f5ebd9" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".5" />
        </g>
      </svg>

      {/* Destellos al lado del pulgar */}
      <span className="pj-chispa absolute right-1 top-6 text-xl text-[#d6b26a]" aria-hidden>✦</span>
      <span className="pj-chispa absolute right-8 top-0 text-sm text-[#d6b26a] [animation-delay:0.4s]" aria-hidden>✦</span>
    </div>
  );
}
