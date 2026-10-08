import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import Footer from '@/components/Footer';
import SoloSitioPublico from '@/components/SoloSitioPublico';
import CookieBanner from '@/components/CookieBanner';
import Analytics from '@/components/Analytics';
import { schemaSitio } from '@/lib/schema';
import { getCategorias } from '@/lib/categorias-db';
import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from '@/lib/site';

export const metadata: Metadata = {
  // Resuelve las URLs relativas de OG, Twitter y canonical.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Alimentos',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: { telephone: false, address: false, email: false },
  // Cuando el cliente verifique el dominio en Search Console, la meta va acá:
  // verification: { google: 'TU_TOKEN' },
};

export const viewport: Viewport = {
  themeColor: '#F7F3EC',
};

/**
 * El mega menu sale de la tabla `categories`, asi que el layout pasa a ser
 * async. La lectura se cachea con el ISR del catalogo: no hay un fetch por
 * navegacion.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categorias = await getCategorias();

  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD del sitio (Organization + WebSite).
            Va con dangerouslySetInnerHTML porque React escaparia las comillas
            del JSON y el marcado quedaria invalido. El contenido no viene del
            usuario: sale de lib/site.ts. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaSitio()) }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <SoloSitioPublico>
          <Navbar categorias={categorias} />
        </SoloSitioPublico>
        <main>{children}</main>
        <SoloSitioPublico>
          <Footer />
          <CartDrawer />
          <FloatingWhatsApp />
          {/* GA y Pixel solo cargan despues del "Aceptar" del banner. */}
          <CookieBanner />
          <Analytics />
        </SoloSitioPublico>
      </body>
    </html>
  );
}
