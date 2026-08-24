import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://nutrirse.vercel.app'),
  title: {
    default: 'Nutrirse | Frutos secos por mayor',
    template: '%s | Nutrirse',
  },
  description:
    'Distribuidora mayorista de frutos secos y desecados desde Salta. Precios por 5 kg, bolsa cerrada y volumen. Pedido directo por WhatsApp.',
  openGraph: {
    title: 'Nutrirse | Frutos secos por mayor',
    description: 'Mayorista de frutos secos desde Salta. Envíos a todo el país.',
    type: 'website',
    locale: 'es_AR',
  },
};

export const viewport: Viewport = {
  themeColor: '#F7F3EC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <CartDrawer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
