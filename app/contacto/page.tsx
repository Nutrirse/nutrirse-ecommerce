import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contactate con Nutrirse para pedidos mayoristas y cotizaciones por volumen.',
};

export default function Contacto() {
  return (
    <PageShell
      eyebrow="Hablemos"
      title="Contacto"
      intro="Pedidos, cotizaciones por volumen y consultas de stock."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-black/5 bg-hueso p-6 transition-shadow hover:shadow-md"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-tostado">WhatsApp</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-carbon">
            Escribinos ahora
          </p>
          <p className="mt-1 text-sm">Respuesta en el día, lunes a viernes de 9 a 18 h.</p>
        </a>

        <a
          href="mailto:ventas@nutrirse.com.ar"
          className="rounded-2xl border border-black/5 bg-hueso p-6 transition-shadow hover:shadow-md"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-tostado">Email</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-carbon">
            ventas@nutrirse.com.ar
          </p>
          <p className="mt-1 text-sm">Para listas de precios y remitos.</p>
        </a>
      </div>

      <h2>Depósito</h2>
      <p>
        Salta Capital, CP 4400. Retiro sin cargo con turno previo coordinado por WhatsApp.
      </p>

      <h2>Envíos</h2>
      <p>
        Despachamos por Andreani, OCA y Correo Argentino a domicilio o sucursal. Podés
        calcular el costo desde el carrito o desde cualquier ficha de producto.
      </p>

      <p className="text-sm">
        <strong>Nota:</strong> el email es un placeholder. Cambialo en{' '}
        <code>components/Footer.tsx</code> y en esta página.
      </p>
    </PageShell>
  );
}
