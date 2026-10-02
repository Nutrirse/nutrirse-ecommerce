/**
 * Mascota del splash: una nuez sonriente con la gorra verde de Nutrirse.
 * SVG inline, sin assets. Las animaciones son CSS puro (`.nuez-*` en
 * app/globals.css): flota en loop, parpadea y la gorra se acomoda cada
 * tanto. Con `prefers-reduced-motion` queda quieta.
 */
export default function SplashCharacter({ className = '' }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Nuez de Nutrirse sonriendo con su gorra"
      className={`nuez-entrada relative ${className}`}
    >
      {/* Sombra en el piso: se achica cuando la nuez sube. */}
      <div aria-hidden className="nuez-sombra absolute inset-x-[22%] bottom-0 h-[7%] rounded-[50%] bg-black/35 blur-md" />

      <svg viewBox="0 0 240 260" className="nuez-flota relative h-full w-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id="nuez-cascara" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#E9BC80" />
            <stop offset="50%" stopColor="#C38C4C" />
            <stop offset="100%" stopColor="#7A4E27" />
          </radialGradient>
          <linearGradient id="nuez-gorra" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E4A28" />
            <stop offset="100%" stopColor="#0B1C0F" />
          </linearGradient>
        </defs>

        {/* ---------- Cascara ---------- */}
        <path
          d="M120 62c52 0 90 38 92 92 2 52-36 96-92 96s-94-44-92-96c2-54 40-92 92-92Z"
          fill="url(#nuez-cascara)"
        />
        {/* Surco central y arrugas de la nuez */}
        <path d="M120 66c-6 30-6 60 0 92s6 62 0 92" stroke="#6B4423" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".45" />
        <g stroke="#6B4423" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".35">
          <path d="M66 104c-12 18-16 40-12 62" />
          <path d="M174 104c12 18 16 40 12 62" />
          <path d="M60 196c10 18 24 32 40 40" />
          <path d="M180 196c-10 18-24 32-40 40" />
          <path d="M84 84c-6 6-10 14-12 22" />
          <path d="M156 84c6 6 10 14 12 22" />
        </g>
        {/* Brillo */}
        <path d="M70 128c6-12 16-20 28-24-12 10-20 22-24 36Z" fill="#FFF3DC" opacity=".35" />

        {/* ---------- Cara ---------- */}
        <g className="nuez-ojos">
          <ellipse cx="94" cy="150" rx="8" ry="10" fill="#1C1A17" />
          <ellipse cx="146" cy="150" rx="8" ry="10" fill="#1C1A17" />
          <circle cx="97" cy="146" r="3" fill="#fff" />
          <circle cx="149" cy="146" r="3" fill="#fff" />
        </g>
        <ellipse cx="78" cy="172" rx="10" ry="6" fill="#E07A5F" opacity=".45" />
        <ellipse cx="162" cy="172" rx="10" ry="6" fill="#E07A5F" opacity=".45" />
        <path d="M100 176c10 16 30 16 40 0" stroke="#1C1A17" strokeWidth="5" strokeLinecap="round" fill="#7A2E1C" />
        <path d="M108 184c6 4 18 4 24 0" stroke="#E07A5F" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* ---------- Gorra verde Nutrirse ---------- */}
        <g className="nuez-gorra">
          {/* Visera */}
          <path d="M120 92h86c10 0 12 12 2 14l-88 6Z" fill="#0B1C0F" />
          {/* Copa */}
          <path d="M42 98c0-44 34-76 78-76s78 32 78 76Z" fill="url(#nuez-gorra)" />
          {/* Gajos y boton */}
          <path d="M120 24c-14 20-20 46-20 74M120 24c14 20 20 46 20 74" stroke="#f5ebd9" strokeWidth="2" opacity=".18" fill="none" />
          <circle cx="120" cy="24" r="7" fill="#d6b26a" />
          {/* Parche con la "n" de Nutrirse */}
          <circle cx="120" cy="66" r="17" fill="#f5ebd9" />
          <text
            x="120"
            y="75"
            textAnchor="middle"
            fontFamily="Caveat, 'Segoe Script', cursive"
            fontSize="28"
            fontWeight="700"
            fill="#143620"
          >
            n
          </text>
          {/* Borde inferior */}
          <path d="M42 98h156" stroke="#d6b26a" strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
