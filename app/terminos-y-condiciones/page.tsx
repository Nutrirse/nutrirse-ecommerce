import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { type SeccionLegal } from '@/components/LegalPage';
import { METODOS_PAGO } from '@/lib/whatsapp';
import { LEGAL, NEGOCIO, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description:
    'Condiciones de uso del sitio, compras mayoristas y minoristas, pagos, envíos y devoluciones de Nutrirse.',
  alternates: { canonical: '/terminos-y-condiciones' },
};

const responsable = LEGAL.razonSocial ?? '[Razón social]';
const cuit = LEGAL.cuit ?? '[CUIT]';
const mail = <a href={`mailto:${NEGOCIO.email}`}>{NEGOCIO.email}</a>;

const SECCIONES: SeccionLegal[] = [
  {
    titulo: 'Aceptación',
    cuerpo: (
      <>
        <p>
          Estos términos regulan el uso del sitio <strong>{SITE_URL.replace(/^https?:\/\//, '')}</strong>{' '}
          y las compras que hagas a través de él, operado por <strong>{responsable}</strong> (CUIT{' '}
          {cuit}) bajo la marca {SITE_NAME}, con domicilio en {NEGOCIO.ciudad}, Provincia de{' '}
          {NEGOCIO.provincia}, República Argentina.
        </p>
        <p>
          Al navegar el sitio o confirmar un pedido aceptás estos términos y la{' '}
          <Link href="/politica-de-privacidad">Política de Privacidad</Link>. Si no estás de acuerdo,
          no uses el sitio.
        </p>
      </>
    ),
  },
  {
    titulo: 'Uso del sitio y cuenta',
    cuerpo: (
      <ul>
        <li>Para comprar tenés que ser mayor de 18 años y dar datos verdaderos.</li>
        <li>
          El inicio de sesión es con tu cuenta de Google. Sos responsable de lo que se haga con tu
          sesión iniciada en tus dispositivos.
        </li>
        <li>
          El canal <strong>mayorista</strong> muestra precios solo a usuarios registrados. El canal{' '}
          <strong>minorista</strong> los muestra a todos.
        </li>
        <li>
          Está prohibido usar el sitio para fines ilícitos, extraer su contenido de forma automatizada
          o intentar acceder a áreas restringidas.
        </li>
        <li>Podés eliminar tu cuenta en cualquier momento desde el menú de usuario.</li>
      </ul>
    ),
  },
  {
    titulo: 'Productos, precios y pedidos',
    cuerpo: (
      <ul>
        <li>
          <strong>Mayorista:</strong> mínimo de compra de 5 kg por producto o bulto cerrado. Los
          precios no incluyen IVA.
        </li>
        <li>
          <strong>Minorista:</strong> presentaciones para consumo familiar, sin mínimo de compra.
        </li>
        <li>
          Los precios están expresados en pesos argentinos y pueden cambiar sin previo aviso. Rige el
          precio vigente al momento de confirmar el pedido.
        </li>
        <li>
          Las fotos son ilustrativas: al ser productos naturales, el color, el tamaño y el calibre
          pueden variar levemente entre lotes.
        </li>
        <li>
          El pedido se arma en el sitio y se confirma por WhatsApp. Queda firme cuando te confirmamos
          disponibilidad de stock y recibimos el pago. Los ítems marcados &ldquo;a consultar&rdquo; se
          cotizan en ese momento.
        </li>
      </ul>
    ),
  },
  {
    titulo: 'Pagos',
    cuerpo: (
      <>
        <p>
          <strong>El sitio no procesa pagos</strong> ni guarda datos de tarjetas. Aceptamos:
        </p>
        <ul>
          {METODOS_PAGO.map((m) => (
            <li key={m.id}>
              <strong>{m.label}:</strong> {m.detalle}.
            </li>
          ))}
        </ul>
        <p>
          Los datos para transferir te los enviamos únicamente por nuestro WhatsApp oficial. Nunca te
          vamos a pedir claves ni códigos por ningún medio.
        </p>
      </>
    ),
  },
  {
    titulo: 'Envíos',
    cuerpo: (
      <ul>
        <li>Despachamos desde Salta Capital a todo el país, a domicilio o a sucursal del transporte.</li>
        <li>
          El costo de envío está a cargo del comprador y se calcula según destino y peso. El retiro
          por depósito en Salta Capital no tiene costo.
        </li>
        <li>Despachamos dentro de las 24 horas hábiles de confirmados el pedido y el pago.</li>
        <li>
          Los plazos que muestra el cotizador son estimados por cada transporte, no garantizados.
        </li>
        <li>
          Revisá los bultos al recibirlos y dejá asentada cualquier rotura en el remito del
          transporte.
        </li>
      </ul>
    ),
  },
  {
    titulo: 'Cambios, devoluciones y arrepentimiento',
    cuerpo: (
      <>
        <p>
          Las condiciones de cambio, plazos de reclamo y reembolsos están en la{' '}
          <Link href="/politica-de-devolucion">Política de Devolución y Envíos</Link>.
        </p>
        <p>
          Si comprás como <strong>consumidor final</strong>, tenés derecho a revocar la compra dentro de
          los <strong>10 días corridos</strong> desde que recibiste el producto, sin costo ni
          explicación (art. 34 de la Ley 24.240 de Defensa del Consumidor y art. 1110 del Código Civil
          y Comercial). El producto tiene que estar cerrado, en las mismas condiciones en que lo
          recibiste. Para ejercerlo, escribinos a {mail} o por WhatsApp.
        </p>
      </>
    ),
  },
  {
    titulo: 'Propiedad intelectual',
    cuerpo: (
      <>
        <p>
          La marca {SITE_NAME}, el logo, las fotografías de productos y los textos del sitio son
          propiedad de {responsable} o se usan con autorización de sus titulares. No pueden
          reproducirse sin permiso por escrito.
        </p>
        <p>
          Las tipografías del sitio (Fraunces, Inter y Caveat) son de licencia libre (SIL Open Font
          License) y se sirven desde Google Fonts.
        </p>
      </>
    ),
  },
  {
    titulo: 'Responsabilidad',
    cuerpo: (
      <ul>
        <li>
          Trabajamos para que la información del sitio sea correcta, pero puede haber errores de
          carga. Si un precio es evidentemente erróneo, te avisamos antes de confirmar el pedido.
        </li>
        <li>
          No respondemos por interrupciones del sitio ajenas a nuestro control ni por demoras
          atribuibles al transporte.
        </li>
        <li>
          Si tenés alergias o intolerancias alimentarias, consultanos antes de comprar.
        </li>
      </ul>
    ),
  },
  {
    titulo: 'Ley aplicable y reclamos',
    cuerpo: (
      <>
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Ante cualquier conflicto,
          te pedimos que primero nos escribas a {mail} para resolverlo.
        </p>
        <p>
          Si sos consumidor, podés recurrir a la autoridad de Defensa del Consumidor de tu
          jurisdicción y son competentes los tribunales de tu domicilio. Para operaciones entre
          comercios, son competentes los tribunales ordinarios de la ciudad de Salta.
        </p>
      </>
    ),
  },
];

export default function TerminosYCondiciones() {
  return (
    <LegalPage
      titulo="Términos y Condiciones"
      intro={
        <p>
          Condiciones generales para usar el sitio de {SITE_NAME} y comprar en sus canales mayorista y
          minorista.
        </p>
      }
      secciones={SECCIONES}
      actualizado={LEGAL.actualizado}
    />
  );
}
