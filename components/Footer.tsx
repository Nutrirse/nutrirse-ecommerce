import Link from 'next/link';
import Image from 'next/image';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';

const CONTACTO = {
  email: 'ventas@nutrirse.com.ar',
  instagram: 'https://instagram.com/nutrirse',
  facebook: 'https://facebook.com/nutrirse',
};

const ENLACES = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos' },
  { label: 'Quiénes Somos', href: '/quienes-somos' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Política de Devolución', href: '/politica-de-devolucion' },
];

// Formato legible: 549 387 487 0997 -> +54 9 387 487-0997
const waLegible = (n: string) =>
  n.length === 13 ? `+${n.slice(0, 2)} ${n[2]} ${n.slice(3, 6)} ${n.slice(6, 9)}-${n.slice(9)}` : `+${n}`;

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-[#143620] to-[#0b1c0f] text-[#f5ebd9]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-3">
        {/* ---------- Col 1 · marca ---------- */}
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Logo.png"
              alt="Nutrirse"
              width={48}
              height={48}
              className="h-11 w-11 object-contain"
            />
            <span className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              Nutrirse<span className="text-[#d6b26a]">.</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#f5ebd9]/60">
            Distribuidora mayorista de frutos secos, desecados y semillas.
            Despachamos desde Salta Capital a todo el país.
          </p>
          <p className="mt-4 text-xs text-[#f5ebd9]/40">
            Venta exclusiva por mayor · Mínimo de compra 5 kg
          </p>
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
            <li className="text-[#f5ebd9]/50">Salta Capital · CP 4400</li>
            <li className="text-[#f5ebd9]/50">Lunes a viernes, 9 a 18 h</li>
          </ul>

          <div className="mt-6 flex gap-3">
            <a
              href={CONTACTO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[#f5ebd9]/70 transition-colors hover:border-white/40 hover:text-[#f5ebd9]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect width="20" height="20" x="2" y="2" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href={CONTACTO.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[#f5ebd9]/70 transition-colors hover:border-white/40 hover:text-[#f5ebd9]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-[#f5ebd9]/40 sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} Nutrirse. Todos los derechos reservados.</p>
          <p>Precios sin IVA sujetos a modificación sin previo aviso.</p>
        </div>
      </div>
    </footer>
  );
}
