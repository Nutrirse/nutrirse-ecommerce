'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// El motor de Lottie toca `window`: solo en el cliente. `LottieSvg` trae
// solo el renderer SVG, mas liviano que el build completo.
const LottieSvg = dynamic(() => import('lottie-react').then((m) => m.LottieSvg), { ssr: false });

/**
 * Archivo de la animacion en /public. Se pasa como URL: lottie-react lo pide
 * recien en el navegador, asi el JSON (~380 KB) no viaja en el bundle.
 */
const ANIMACION = '/motito.json';

/** Animacion del splash. La caja reserva el espacio mientras carga. */
export default function SplashLottie({ className = '' }: { className?: string }) {
  const [quieto, setQuieto] = useState(false);

  useEffect(() => {
    setQuieto(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <div className={`animate-fade-in ${className}`} role="img" aria-label="Animación de Nutrirse">
      <LottieSvg src={ANIMACION} loop autoplay={!quieto} className="h-full w-full" />
    </div>
  );
}
