import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';

export const metadata: Metadata = {
  title: 'Política de Devolución',
  description: 'Condiciones de cambio y devolución para compras mayoristas en Nutrirse.',
};

export default function PoliticaDevolucion() {
  return (
    <PageShell
      eyebrow="Legales"
      title="Política de Devolución"
      intro="Condiciones aplicables a las operaciones mayoristas."
    >
      <h2>Plazo</h2>
      <p>
        Los reclamos por diferencias de peso, faltantes o mercadería en mal estado se
        reciben dentro de las <strong>48 horas hábiles</strong> posteriores a la recepción
        del pedido, acompañados de fotos del producto y del remito.
      </p>

      <h2>Condiciones</h2>
      <ul>
        <li>La mercadería debe estar en su envase original, cerrado y sin fraccionar.</li>
        <li>No se aceptan devoluciones de bolsas abiertas o fraccionadas.</li>
        <li>Los productos cotizados por volumen se rigen por lo acordado por escrito.</li>
      </ul>

      <h2>Cómo iniciar el reclamo</h2>
      <p>
        Escribinos por WhatsApp con el número de pedido y las fotos. Resolvemos con nota de
        crédito para la siguiente compra o reposición en el próximo despacho.
      </p>

      <h2>Errores de despacho</h2>
      <p>
        Si el error es nuestro, la reposición y el flete corren por nuestra cuenta.
      </p>

      <p className="text-sm">
        <strong>Nota:</strong> texto de referencia. Validalo con tu contador o asesor legal
        antes de publicarlo.
      </p>
    </PageShell>
  );
}
