/**
 * Nuez vectorial de alta calidad (sin dependencia de assets externos).
 * Reemplazable por un render 3D/PNG con alpha sin tocar la animación.
 */
export default function NutSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden focusable="false">
      <defs>
        <radialGradient id="shell" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#E8B87A" />
          <stop offset="45%" stopColor="#C0894A" />
          <stop offset="100%" stopColor="#6B4423" />
        </radialGradient>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <ellipse cx="205" cy="352" rx="115" ry="22" fill="#6B4423" opacity="0.18" filter="url(#soft)" />

      <g>
        <path
          d="M200 28c62 0 116 52 122 118 5 60-28 128-88 168-21 14-47 14-68 0-60-40-93-108-88-168C84 80 138 28 200 28z"
          fill="url(#shell)"
        />
        <path
          d="M200 44c-9 34-9 74 0 112 9 38 9 78 0 122 9 6 22 4 30-4-16-40-19-84-9-126 9-38 6-74-21-104z"
          fill="#5A3719"
          opacity="0.35"
        />
        <g fill="none" stroke="#4A2C14" strokeWidth="5" strokeLinecap="round" opacity="0.45">
          <path d="M150 92c-22 26-30 62-22 96 8 33 27 60 52 78" />
          <path d="M252 92c22 26 30 62 22 96-8 33-27 60-52 78" />
          <path d="M126 150c14 10 24 28 26 48 3 26-4 52-18 72" />
          <path d="M276 150c-14 10-24 28-26 48-3 26 4 52 18 72" />
        </g>
        <path d="M200 40c-38 8-70 40-80 82 16-30 44-52 80-58z" fill="#FFF3DC" opacity="0.35" />
      </g>
    </svg>
  );
}
