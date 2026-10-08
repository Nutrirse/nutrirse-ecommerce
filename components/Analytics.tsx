'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { EVENTO_CONSENTIMIENTO, leerConsentimiento, type Consentimiento } from '@/lib/consentimiento';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Google Analytics y Pixel de Meta, SOLO con consentimiento. Sin "Aceptar"
 * en el CookieBanner no se descarga ningun script de terceros. Cada uno se
 * activa si su ID esta en el entorno (IDs publicos, no son secretos).
 */
export default function Analytics() {
  const [aceptadas, setAceptadas] = useState(false);

  useEffect(() => {
    setAceptadas(leerConsentimiento() === 'aceptadas');
    const onCambio = (e: Event) =>
      setAceptadas((e as CustomEvent<Consentimiento>).detail === 'aceptadas');
    window.addEventListener(EVENTO_CONSENTIMIENTO, onCambio);
    return () => window.removeEventListener(EVENTO_CONSENTIMIENTO, onCambio);
  }, []);

  if (!aceptadas) return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)},{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(PIXEL_ID)});fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
