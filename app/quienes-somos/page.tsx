import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';

export const metadata: Metadata = {
  title: 'Quiénes Somos',
  description: 'Nutrirse, distribuidora mayorista de frutos secos desde Salta.',
};

export default function QuienesSomos() {
  return (
    <PageShell
      eyebrow="La empresa"
      title="Quiénes Somos"
      intro="Somos una distribuidora mayorista de frutos secos, desecados y semillas con base en Salta Capital."
    >
      <p>
        Trabajamos directo con productores y importadores para abastecer a dietéticas,
        panaderías, fábricas de alimentos y comercios de todo el país, sin intermediarios
        que encarezcan la cadena.
      </p>

      <h2>Cómo trabajamos</h2>
      <ul>
        <li>Venta exclusiva por mayor, con un mínimo de 5 kg por producto.</li>
        <li>Tres presentaciones: 5 kg, bolsa cerrada y volumen a cotizar.</li>
        <li>Despacho dentro de las 24 h hábiles de confirmado el pedido.</li>
        <li>Embalaje reforzado para transporte de bolsas completas.</li>
      </ul>

      <h2>Nuestro compromiso</h2>
      <p>
        Rotación alta y mercadería fresca. No stockeamos partidas viejas: preferimos
        reponer seguido antes que dejar producto parado en depósito.
      </p>

      <p className="text-sm">
        <strong>Nota:</strong> este texto es un borrador. Reemplazalo por la historia real
        del negocio antes de publicar.
      </p>
    </PageShell>
  );
}
