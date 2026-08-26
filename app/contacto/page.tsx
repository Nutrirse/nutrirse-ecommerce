import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import ContactWhatsAppForm from '@/components/ContactWhatsAppForm';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';
import { NEGOCIO } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contactate con Nutrirse para pedidos mayoristas y cotizaciones por volumen.',
  alternates: { canonical: '/contacto' },
};

const EMAIL = NEGOCIO.email;

type Canal = {
  eyebrow: string;
  titulo: string;
  texto: string;
  href?: string;
  externo?: boolean;
  icon: ReactNode;
};

const CANALES: Canal[] = [
  {
    eyebrow: 'WhatsApp',
    titulo: 'Escribinos ahora',
    texto: 'Respuesta en el día, lunes a viernes de 9 a 18 h. Del otro lado contesta una persona.',
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    externo: true,
    icon: (
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22z" />
    ),
  },
  {
    eyebrow: 'Email',
    titulo: EMAIL,
    texto: 'Para listas de precios, remitos y documentación comercial.',
    href: `mailto:${EMAIL}`,
    icon: (
      <>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
  },
  {
    eyebrow: 'Depósito',
    titulo: 'Salta Capital, CP 4400',
    texto: 'Retiro sin cargo con turno previo coordinado por WhatsApp.',
    icon: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
  {
    eyebrow: 'Envíos',
    titulo: 'A todo el país',
    texto:
      'Andreani, OCA, Correo Argentino, Buspack, Flechabus, entre otras, a domicilio o sucursal. Calculá el costo desde el carrito o desde cualquier ficha de producto.',
    icon: (
      <>
        <path d="M1 3h13v13H1zM14 8h4l3 3v5h-7z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </>
    ),
  },
];

/* Los canales con `href` son <a>; los informativos, <div>. Un solo bloque de
   estilos para que ambos se vean igual. */
function CanalCard({ canal, delay }: { canal: Canal; delay: string }) {
  const clase =
    'group block animate-fade-up rounded-2xl border border-black/5 bg-hueso p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_45px_-30px_rgba(28,26,23,0.55)]';

  const contenido = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-nuez/10 text-nuez transition-colors duration-300 group-hover:bg-nuez group-hover:text-hueso">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={canal.eyebrow === 'WhatsApp' ? 'currentColor' : 'none'}
          stroke={canal.eyebrow === 'WhatsApp' ? 'none' : 'currentColor'}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {canal.icon}
        </svg>
      </span>
      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-tostado">
        {canal.eyebrow}
      </p>
      <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl font-semibold leading-snug text-carbon">
        {canal.titulo}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-humo">{canal.texto}</p>
    </>
  );

  if (!canal.href) {
    return (
      <div className={clase} style={{ animationDelay: delay }}>
        {contenido}
      </div>
    );
  }

  return (
    <a
      href={canal.href}
      className={clase}
      style={{ animationDelay: delay }}
      {...(canal.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {contenido}
    </a>
  );
}

export default function Contacto() {
  return (
    /* `overflow-x-clip`: la nuez sobresale del contenedor y sin esto
       aparecería scroll horizontal en pantallas medianas. */
    <div className="min-h-dvh overflow-x-clip bg-crema pb-24 pt-28">
      {/* ---------------- Header ---------------- */}
      <header className="mx-auto max-w-7xl animate-fade-up px-5 sm:px-8">
        <p className="font-[family-name:var(--font-hand)] text-[clamp(1.8rem,3.5vw,2.6rem)] leading-none text-tostado">
          Hablemos
        </p>
        <h1 className="mt-2 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4.4rem)] font-semibold leading-[1.02] tracking-tight text-carbon">
          Contacto
        </h1>
        <p
          className="mt-4 max-w-xl animate-fade-up text-lg leading-relaxed text-humo"
          style={{ animationDelay: '90ms' }}
        >
          Pedidos, cotizaciones por volumen y consultas de stock. Elegí el canal que te
          quede más cómodo.
        </p>
      </header>

      {/* ---------------- 2 columnas ---------------- */}
      <section className="relative mx-auto mt-14 max-w-7xl px-5 sm:px-8">
        {/* Nuez decorativa. `z-0` + `pointer-events-none` la dejan detrás
            del formulario y fuera del alcance de los clics. */}
        <Image
          src="/nuez-contacto.png"
          alt=""
          aria-hidden
          width={260}
          height={260}
          className="pointer-events-none absolute -top-12 -right-2 z-0 w-28 animate-float select-none opacity-90 drop-shadow-[0_18px_30px_rgba(28,26,23,0.28)] sm:-right-6 md:-top-16 md:-right-12 md:w-44"
        />

        <div className="relative z-10 grid items-start gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* ---------- Izquierda: canales ---------- */}
          <div className="grid gap-5 sm:grid-cols-2">
            {CANALES.map((c, i) => (
              <CanalCard key={c.eyebrow} canal={c} delay={`${120 + i * 90}ms`} />
            ))}
          </div>

          {/* ---------- Derecha: formulario ---------- */}
          <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
            <ContactWhatsAppForm />
          </div>
        </div>
      </section>
    </div>
  );
}
