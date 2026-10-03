import type { Metadata } from 'next';
import QuienesSomosContenido from '@/components/QuienesSomosContenido';

export const metadata: Metadata = {
  title: 'Quiénes Somos',
  description:
    'Nutrirse, distribuidora de frutos secos, desecados y semillas desde Salta Capital hacia todo el país. Venta mayorista y minorista.',
  alternates: { canonical: '/quienes-somos' },
};

/** El texto cambia segun el canal (mayorista / minorista): ver el componente. */
export default function QuienesSomos() {
  return <QuienesSomosContenido />;
}
