'use client';

import { useEffect, useState } from 'react';
import { formatARS } from '@/lib/format';
import { ENVIO_GRATIS_DESDE } from '@/lib/whatsapp';

/**
 * Cartel flotante del checkout: anuncia el envio bonificado por volumen.
 *
 * El umbral sale de `ENVIO_GRATIS_DESDE` (lib/whatsapp.ts), el mismo valor
 * que usa `calcularTotales` para no cobrar el envio. Cartel y total no
 * pueden decir cosas distintas.
 *
 * Se puede cerrar: es un aviso, no un bloqueo. La decision no se persiste
 * a proposito, para que vuelva a verse en el proximo pedido.
 */
export default function AvisoEnvioGratis() {
  const [visible, setVisible] = useState(false);
  const [cerrado, setCerrado] = useState(false);

  // Entra con un respiro despues del montaje: aparecer junto con la pagina
  // lo vuelve parte del ruido y nadie lo lee.
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (ENVIO_GRATIS_DESDE <= 0 || cerrado) return null;

  return (
    <aside
      aria-live="polite"
      /* Mobile-first, anclado a los dos bordes: `left-4 right-4` deja que el
         ancho lo decida el viewport en vez de forzarlo. Nunca desborda.

         `bottom-24`: el boton flotante de WhatsApp ocupa de 24 a 80 px desde
         abajo (`bottom-6` + `h-14`) y comparte `z-40`, asi que al pintarse
         despues en el DOM tapaba la esquina derecha del cartel. Subir el
         cartel por encima de la burbuja los deja convivir sin recortar texto.
         `env(safe-area-inset-bottom)` suma el home indicator de iOS.

         Desde `lg` el boton ya no molesta (el cartel vive a la izquierda),
         asi que vuelve a la esquina y recupera su ancho acotado. */
      className={`fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-40 transition-all duration-500 lg:bottom-5 lg:left-5 lg:right-auto lg:max-w-[19rem] ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#143620] to-[#0b1c0f] p-4 pr-9 shadow-[0_25px_50px_-20px_rgba(11,28,15,0.8)]">
        {/* Halo dorado, el acento de marca del resto del sitio. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(80% 70% at 85% 20%, rgba(214,178,106,0.22), transparent 70%)',
          }}
          aria-hidden
        />

        <button
          onClick={() => setCerrado(true)}
          aria-label="Cerrar aviso"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[#f5ebd9]/50 transition-colors hover:bg-white/10 hover:text-[#f5ebd9]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="relative flex items-start gap-3">
          <span className="text-xl leading-none" aria-hidden>
            🚚
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d6b26a]">
              Envío gratis
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-[#f5ebd9]">
              Envío gratis en compras superiores a{' '}
              <span className="whitespace-nowrap font-semibold text-white">
                {formatARS(ENVIO_GRATIS_DESDE)}
              </span>{' '}
              en productos.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
