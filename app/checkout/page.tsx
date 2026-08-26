import type { Metadata } from 'next';
import CheckoutForm from '@/components/CheckoutForm';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Completá tus datos y cerrá el pedido mayorista por WhatsApp.',
  // Paso de compra: no tiene nada que hacer en resultados de búsqueda.
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    <div className="min-h-dvh bg-crema pb-24 pt-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-tostado">Paso final</p>
        <h1 className="mt-2 font-[family-name:var(--font-hand)] text-[clamp(2.4rem,6vw,4rem)] font-semibold leading-tight text-carbon">
          Cerrá tu pedido
        </h1>
        <p className="mt-2 max-w-xl text-humo">
          No cobramos online. Generamos un ticket detallado y lo enviás por WhatsApp
          para confirmar stock y forma de pago.
        </p>

        <CheckoutForm />
      </div>
    </div>
  );
}
