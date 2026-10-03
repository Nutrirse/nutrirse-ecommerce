'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';
import { NEGOCIO, REDES } from '@/lib/site';
import { RUTAS } from '@/lib/modo';
import { useModo } from '@/lib/use-modo';

const CONTACTO = {
  email: NEGOCIO.email,
};

/* Solo se renderiza el icono de la red que tenga URL real en `lib/site.ts`.
   Un enlace a "#" manda al usuario a ninguna parte. */
const SOCIALES = [
  {
    label: 'Instagram',
    href: REDES.instagram,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect width="20" height="20" x="2" y="2" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: REDES.facebook,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: REDES.tiktok,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .53.04.78.12v-3.16a5.7 5.7 0 0 0-.78-.05A5.71 5.71 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48z" />
      </svg>
    ),
  },
].filter((r): r is typeof r & { href: string } => Boolean(r.href));

/** Un enlace por canal en vez de "Productos": cada uno lleva a su catalogo. */
const ENLACES = [
  { label: 'Inicio', href: '/' },
  { label: 'Mayorista', href: '/mayorista' },
  { label: 'Minorista', href: '/minorista' },
  { label: 'Quiénes Somos', href: '/quienes-somos' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Política de Devolución', href: '/politica-de-devolucion' },
];

// Formato legible: 549 387 487 0997 -> +54 9 387 487-0997
const waLegible = (n: string) =>
  n.length === 13 ? `+${n.slice(0, 2)} ${n[2]} ${n.slice(3, 6)} ${n.slice(6, 9)}-${n.slice(9)}` : `+${n}`;

/** Bajada de la marca segun el canal activo (ver lib/use-modo.ts). */
const BAJADA = {
  mayorista: {
    texto: 'Distribuidora mayorista de frutos secos, desecados y semillas. Despachamos desde Salta Capital a todo el país.',
    nota: 'Venta exclusiva por mayor · Mínimo de compra 5 kg',
  },
  minorista: {
    texto: 'Frutos secos, desecados y semillas en presentaciones para tu casa. Despachamos desde Salta Capital a todo el país.',
    nota: 'Presentaciones de 1/2 kg y 1 kg · Sin mínimo de compra',
  },
};

export default function Footer() {
  const modo = useModo();
  const bajada = BAJADA[modo];

  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-[#143620] to-[#0b1c0f] text-[#f5ebd9]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-3">
        {/* ---------- Col 1 · marca ---------- */}
        <div>
          <Link href={RUTAS[modo].home} className="inline-flex items-center" aria-label="Nutrirse - Inicio">
            <Image
              src="/Logo.png"
              alt="Nutrirse"
              width={280}
              height={280}
              className="h-20 w-auto object-contain"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#f5ebd9]/60">{bajada.texto}</p>
          <p className="mt-4 text-xs text-[#f5ebd9]/40">{bajada.nota}</p>
        </div>

        {/* ---------- Col 2 · enlaces ---------- */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d6b26a]">
            Enlaces rápidos
          </h3>
          <ul className="mt-5 space-y-2.5 text-sm">
            {ENLACES.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className="text-[#f5ebd9]/70 transition-colors hover:text-[#f5ebd9]"
                >
                  {e.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- Col 3 · contacto ---------- */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#d6b26a]">
            Contacto
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a
                href={`mailto:${CONTACTO.email}`}
                className="flex items-center gap-2.5 text-[#f5ebd9]/70 transition-colors hover:text-[#f5ebd9]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {CONTACTO.email}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-[#f5ebd9]/70 transition-colors hover:text-[#f5ebd9]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22z" />
                </svg>
                {waLegible(WHATSAPP_NUMBER)}
              </a>
            </li>
          </ul>

          {SOCIALES.length > 0 && (
            <div className="mt-6 flex gap-3">
              {SOCIALES.map((r) => (
                <a
                  key={r.label}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={r.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[#f5ebd9]/70 transition-colors hover:border-white/40 hover:text-[#f5ebd9]"
                >
                  {r.icon}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-[#f5ebd9]/40 sm:flex-row sm:px-8">
          <p>© 2026 Nutrirse Hoy . By Maxing Agent . Todos los derechos reservados.</p>
          <p>Precios sin IVA sujetos a modificación sin previo aviso.</p>
        </div>
      </div>
    </footer>
  );
}
