import type { Metadata } from 'next';
import CheckoutForm from '@/components/CheckoutForm';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Completá tus datos y cerrá el pedido mayorista por WhatsApp.',
};

export default function CheckoutPage() {
  return (
    <div className="bg-crema pb-24 pt-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-tostado">Paso final</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-tight tracking-tight text-carbon">
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
