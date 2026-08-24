import Image from 'next/image';
import Link from 'next/link';

type Props = {
  /** PNG con fondo transparente de la repartidora. */
  imgSrc?: string;
};

const PUNTOS = [
  'Andreani · OCA · Correo Argentino',
  'Despacho en 24 h hábiles',
  'Retiro sin cargo en depósito',
];

export default function LogisticsBanner({ imgSrc = '/chica-nutrirse.png' }: Props) {
  return (
    // `pt-16` reserva el aire que la imagen usa para sobresalir por arriba.
    // Sin eso, el pop-out se comería la sección anterior.
    <section id="envios" className="scroll-mt-24 bg-crema px-5 pb-20 pt-16 sm:px-8 sm:pb-24">
      {/* overflow-visible + relative: la imagen puede romper el borde verde */}
      <div className="relative mx-auto max-w-7xl overflow-visible rounded-3xl bg-gradient-to-r from-[#143620] to-[#0b1c0f] shadow-[0_30px_60px_-30px_rgba(11,28,15,0.7)]">
        {/* Halo cálido interno. Va en su propio div con overflow-hidden:
            si el recorte viviera en el contenedor, cortaría la foto. */}
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
          {/* ---------- Izquierda: texto ---------- */}
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

            {/* El costo de envío mayorista depende del peso del pedido, asi
                que se cotiza en el carrito y no acá: un numero suelto en la
                Home sería engañoso (5 kg y 50 kg no cuestan igual). */}
            <p className="mt-6 max-w-md text-sm text-[#f5ebd9]/55">
              El costo final se calcula en el carrito según el peso de tu pedido.
            </p>

            <Link
              href="/productos"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f5ebd9] px-7 py-3.5 text-sm font-semibold text-[#0b1c0f] transition-transform hover:scale-[1.03] active:scale-95"
            >
              Empezar mi pedido
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
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>

          {/* ---------- Derecha: foto que sobresale ---------- */}
          <div className="relative h-52 sm:h-64 md:h-full md:min-h-[260px]">
            <Image
              src={imgSrc}
              alt="Repartidora de Nutrirse sonriendo"
              width={720}
              height={900}
              sizes="(max-width: 768px) 70vw, 34vw"
              className="pointer-events-none absolute -top-24 right-0 w-[min(380px,80%)] max-w-none drop-shadow-[0_30px_35px_rgba(0,0,0,0.45)] sm:-top-28 md:-top-32 md:-right-4"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
