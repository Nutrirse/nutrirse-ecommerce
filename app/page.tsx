import Image from 'next/image';
import Link from 'next/link';
import SplashCharacter from '@/components/SplashCharacter';

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

      <SplashCharacter className="mt-6 h-56 w-52 sm:h-64 sm:w-60" />

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
