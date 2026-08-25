import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de catálogo',
  // El panel no debe aparecer en buscadores ni en el sitemap.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
