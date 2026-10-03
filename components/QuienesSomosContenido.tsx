'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';
import { RUTAS, type Modo } from '@/lib/modo';
import { useModo } from '@/lib/use-modo';

/* Foto real del depósito. Si se reemplaza, solo cambia esta constante. */
const FOTO = '/quienes-somos.jpg';

type Valor = { titulo: string; texto: string; icon: React.ReactNode };

/** Icono del bloque de venta, compartido por los dos canales. */
const ICONO_VENTA = (
  <>
    <path d="M3 7h18l-1.5 12a2 2 0 0 1-2 1.75H6.5A2 2 0 0 1 4.5 19L3 7z" />
    <path d="M8 7V5a4 4 0 0 1 8 0v2" />
  </>
);

/**
 * El segundo valor depende del canal: en mayorista es la regla de los 5 kg;
 * en minorista esa regla no existe.
 */
const VENTA: Record<Modo, Valor> = {
  mayorista: {
    titulo: 'Venta mayorista',
    texto:
      'Tres presentaciones por producto: 5 kg, bulto cerrado y volumen a cotizar. Mínimo de compra 5 kg, sin excepciones.',
    icon: ICONO_VENTA,
  },
  minorista: {
    titulo: 'Venta minorista',
    texto:
      'La misma mercadería que llevan las dietéticas, en presentaciones de 1/2 kg y 1 kg para tu casa. Sin mínimo de compra.',
    icon: ICONO_VENTA,
  },
};

/** Cifras: la tercera cambia con el canal. */
const CIFRAS: Record<Modo, [string, string][]> = {
  mayorista: [
    ['+40', 'variedades en catálogo'],
    ['24 h', 'para despachar tu pedido'],
    ['5 kg', 'mínimo de compra'],
  ],
  minorista: [
    ['+40', 'variedades en catálogo'],
    ['24 h', 'para despachar tu pedido'],
    ['1/2 kg', 'sin mínimo de compra'],
  ],
};

const VALORES_FIJOS: Valor[] = [
  {
    titulo: 'Calidad premium',
    texto:
      'Seleccionamos por calibre y cosecha. Rotación alta y reposición frecuente: nada de partidas paradas en depósito.',
    icon: (
      <>
        <path d="M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </>
    ),
  },
  {
    titulo: 'Logística nacional',
    texto:
      'Andreani, OCA, Correo Argentino, Buspack, Flechabus, entre otras, a domicilio o sucursal. Despacho dentro de las 24 h hábiles de confirmado el pedido.',
    icon: (
      <>
        <path d="M1 3h13v13H1zM14 8h4l3 3v5h-7z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </>
    ),
  },
];

/**
 * Cuerpo de /quienes-somos. Es cliente para leer el canal activo
 * (lib/use-modo.ts): la ruta es neutra, asi que manda el ultimo canal que
 * visito el usuario (/minorista o /mayorista).
 */
export default function QuienesSomosContenido() {
  const modo = useModo();
  const [calidad, logistica] = VALORES_FIJOS;
  const valores = [calidad, VENTA[modo], logistica];

  return (
    <div className="min-h-dvh bg-crema pb-24 pt-28">
      {/* ---------------- Header ---------------- */}
      <header className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-[family-name:var(--font-hand)] text-[clamp(1.8rem,3.5vw,2.6rem)] leading-none text-tostado">
          Desde Salta, desde 2015
        </p>
        <h1 className="mt-2 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4.4rem)] font-semibold leading-[1.02] tracking-tight text-carbon">
          Nuestra Historia
        </h1>
      </header>

      {/* ---------------- Relato + imagen ---------------- */}
      <section className="mx-auto mt-14 max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-5 leading-relaxed text-humo">
            <p className="text-lg text-carbon">
              Nutrirse nació como un puesto chico de frutos secos en Salta Capital y
              terminó convertida en la distribuidora que abastece a buena parte de las
              dietéticas y panaderías del norte argentino.
              {modo === 'minorista' &&
                ' Hoy también vendemos al por menor: la misma calidad, en la cantidad que necesitás para tu casa.'}
            </p>
            <p>
              Compramos directo a productores de Catamarca, San Juan y Mendoza, y a
              importadores para lo que no se produce acá. Sin intermediarios en el medio:
              cada eslabón que se saca de la cadena es margen que vuelve a{' '}
              {modo === 'minorista' ? 'quien nos compra' : 'el comercio que nos compra'}. Trabajamos por partida, con control de calibre y humedad al
              recibir, y fraccionamos en nuestro propio depósito.
            </p>
            <p>
              Hoy despachamos a todo el país. Seguimos manejando el negocio con la misma
              lógica del primer día: rotación alta antes que stock grande, precio claro
              por presentación, y un WhatsApp del otro lado que contesta una persona.
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              <Link
                href={RUTAS[modo].catalogo}
                className="inline-flex items-center rounded-full bg-carbon px-7 py-3.5 text-sm font-medium text-hueso transition-transform hover:scale-[1.03] active:scale-95"
              >
                Ver catálogo
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-carbon/15 px-7 py-3.5 text-sm font-medium text-carbon transition-colors hover:bg-hueso"
              >
                Hablar con ventas
              </a>
            </div>
          </div>

          {/* Imagen */}
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e4a28] to-[#0b1c0f] shadow-[0_30px_60px_-30px_rgba(11,28,15,0.6)]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(60% 60% at 50% 45%, rgba(214,178,106,0.22), transparent 70%)',
              }}
              aria-hidden
            />
            {/* Foto real: `object-cover` llena el marco. El `p-10` del
                doypack transparente ya no aplica. */}
            <Image
              src={FOTO}
              alt="Depósito de Nutrirse en Salta Capital"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ---------------- Cifras ---------------- */}
      <section className="mx-auto mt-20 max-w-7xl px-5 sm:px-8">
        <dl className="grid gap-6 border-y border-black/10 py-10 sm:grid-cols-3">
          {CIFRAS[modo].map(([k, v]) => (
            <div key={v}>
              <dt className="font-[family-name:var(--font-display)] text-4xl font-semibold text-nuez">
                {k}
              </dt>
              <dd className="mt-1 text-sm text-humo">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------------- Valores ---------------- */}
      <section className="mx-auto mt-20 max-w-7xl px-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-tostado">
          Cómo trabajamos
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-hand)] text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-[1.05] text-carbon">
          Tres cosas que no negociamos.
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {valores.map((v) => (
            <article
              key={v.titulo}
              className="rounded-2xl border border-black/5 bg-hueso p-7 transition-shadow duration-300 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nuez/10 text-nuez">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {v.icon}
                </svg>
              </span>
              <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold text-carbon">
                {v.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-humo">{v.texto}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
