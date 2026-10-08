import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { type SeccionLegal } from '@/components/LegalPage';
import { LEGAL, NEGOCIO, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description:
    'Qué datos personales recopila Nutrirse, para qué los usa y cómo ejercer tus derechos de acceso, ' +
    'rectificación y supresión (Ley 25.326).',
  alternates: { canonical: '/politica-de-privacidad' },
};

/** Hueco visible para los datos que el cliente todavia no paso (ver LEGAL). */
const dato = (v: string | null, hueco: string) => v ?? `[${hueco}]`;

const responsable = dato(LEGAL.razonSocial, 'Razón social');
const cuit = dato(LEGAL.cuit, 'CUIT');
const domicilio = [NEGOCIO.calle, `${NEGOCIO.ciudad} (CP ${NEGOCIO.codigoPostal})`, `Provincia de ${NEGOCIO.provincia}`]
  .filter(Boolean)
  .join(', ');
const mail = <a href={`mailto:${NEGOCIO.email}`}>{NEGOCIO.email}</a>;

const SECCIONES: SeccionLegal[] = [
  {
    titulo: 'Responsable de la base de datos',
    cuerpo: (
      <>
        <p>
          El responsable del tratamiento de tus datos es <strong>{responsable}</strong> (CUIT {cuit}),
          que opera la marca {SITE_NAME} y el sitio <strong>{SITE_URL.replace(/^https?:\/\//, '')}</strong>,
          con domicilio en {domicilio}, República Argentina.
        </p>
        <p>
          La base de datos de clientes se encuentra inscripta en el{' '}
          <strong>Registro Nacional de Bases de Datos</strong> de la{' '}
          <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>, órgano de control de la
          Ley N.º 25.326 de Protección de los Datos Personales, bajo el N.º{' '}
          {dato(LEGAL.registroBaseDatos, 'N.º de inscripción')}.
        </p>
        <p>Contacto para cualquier consulta sobre privacidad: {mail}.</p>
      </>
    ),
  },
  {
    titulo: 'Qué datos recopilamos',
    cuerpo: (
      <>
        <p>Solo pedimos lo necesario para venderte y entregarte el pedido:</p>
        <ul>
          <li>
            <strong>Cuenta con Google:</strong> si iniciás sesión, recibimos de Google tu nombre, tu
            email y tu foto de perfil. No accedemos a tu contraseña ni a otros datos de tu cuenta.
          </li>
          <li>
            <strong>Datos del pedido:</strong> nombre, apellido, DNI o CUIT, teléfono, email,
            domicilio de entrega y método de pago elegido. El formulario de checkout arma el pedido en
            tu navegador y lo envía por WhatsApp: el sitio no lo guarda, pero nosotros lo registramos
            en nuestro sistema de gestión para facturar, despachar y hacer el seguimiento.
          </li>
          <li>
            <strong>Consultas:</strong> los datos que escribas en el formulario de contacto, que
            también se envían por WhatsApp.
          </li>
          <li>
            <strong>Código postal:</strong> el que ingresás en el cotizador de envíos, solo para
            calcular el costo.
          </li>
          <li>
            <strong>Datos de navegación:</strong> solo si aceptás las cookies de análisis y
            publicidad (ver punto 5).
          </li>
        </ul>
        <p>
          No recopilamos datos sensibles en los términos del art. 2 de la Ley 25.326 ni datos de
          tarjetas: <strong>el sitio no procesa pagos</strong>.
        </p>
      </>
    ),
  },
  {
    titulo: 'Para qué los usamos',
    cuerpo: (
      <ul>
        <li>Gestionar tu pedido: confirmarlo, facturarlo, despacharlo y atender reclamos.</li>
        <li>Mostrarte los precios y mantener tu sesión iniciada.</li>
        <li>Cumplir obligaciones legales, fiscales y contables.</li>
        <li>
          Enviarte novedades y ofertas por email o WhatsApp. Podés darte de baja en cualquier
          momento escribiendo a {mail}.
        </li>
        <li>Medir el uso del sitio y mejorar nuestros anuncios, solo con tu consentimiento.</li>
      </ul>
    ),
  },
  {
    titulo: 'Con quién los compartimos',
    cuerpo: (
      <>
        <p>
          No vendemos ni cedemos tus datos. Los compartimos solo con los proveedores que necesitamos
          para operar, que los tratan por cuenta nuestra:
        </p>
        <ul>
          <li>Supabase (base de datos e inicio de sesión) y Vercel (alojamiento del sitio).</li>
          <li>Google (inicio de sesión y, si lo aceptás, Google Analytics).</li>
          <li>Meta (WhatsApp para gestionar pedidos y, si lo aceptás, el Píxel de Meta).</li>
          <li>La empresa de transporte que elijas, solo con los datos necesarios para la entrega.</li>
        </ul>
        <p>
          Algunos de estos proveedores almacenan la información fuera de la Argentina. Al usar el
          sitio prestás tu consentimiento para esa transferencia internacional, que se hace con
          proveedores que aplican estándares de seguridad adecuados (art. 12, Ley 25.326).
        </p>
      </>
    ),
  },
  {
    titulo: 'Cookies y almacenamiento local',
    cuerpo: (
      <>
        <ul>
          <li>
            <strong>Necesarias:</strong> mantienen tu sesión iniciada y recuerdan tu carrito, el canal
            elegido (mayorista o minorista) y tu preferencia de cookies. Sin ellas el sitio no
            funciona.
          </li>
          <li>
            <strong>Análisis y publicidad:</strong> Google Analytics y el Píxel de Meta. Solo se
            cargan si tocás <strong>Aceptar</strong> en el aviso de cookies. Si tocás{' '}
            <strong>Rechazar</strong>, no se activan.
          </li>
        </ul>
        <p>
          Para cambiar tu elección, borrá los datos de este sitio desde la configuración de tu
          navegador: el aviso vuelve a aparecer.
        </p>
      </>
    ),
  },
  {
    titulo: 'Tus derechos',
    cuerpo: (
      <>
        <p>
          Podés pedir en cualquier momento <strong>acceso</strong>, <strong>rectificación</strong>,{' '}
          <strong>actualización</strong> o <strong>supresión</strong> de tus datos escribiendo a{' '}
          {mail}. Respondemos los pedidos de acceso dentro de los 10 días corridos y los de
          rectificación o supresión dentro de los 5 días hábiles (arts. 14 y 16, Ley 25.326).
        </p>
        <p>
          Si iniciaste sesión con Google, también podés borrar tu cuenta vos mismo con la opción{' '}
          <strong>Eliminar mi cuenta y mis datos</strong> del menú de usuario. Conservamos solo los
          comprobantes de compras ya realizadas que la normativa fiscal nos obliga a guardar.
        </p>
        <p>
          El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los
          mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un
          interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley
          N.º 25.326.
        </p>
        <p>
          La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la
          Ley N.º 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan
          quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en
          materia de protección de datos personales.
        </p>
      </>
    ),
  },
  {
    titulo: 'Conservación y seguridad',
    cuerpo: (
      <>
        <p>
          Guardamos tus datos mientras tengas una cuenta o una relación comercial con nosotros, y
          después solo el tiempo que exijan las normas fiscales y contables. Aplicamos medidas
          técnicas para protegerlos: conexión cifrada (HTTPS), acceso restringido a la base de datos
          y precios y datos de clientes que nunca se exponen a la API pública.
        </p>
      </>
    ),
  },
  {
    titulo: 'Menores de edad',
    cuerpo: (
      <p>
        El sitio está dirigido a mayores de 18 años. No recopilamos a sabiendas datos de menores; si
        detectamos alguno, lo eliminamos.
      </p>
    ),
  },
  {
    titulo: 'Cambios en esta política',
    cuerpo: (
      <p>
        Podemos actualizar esta política. La versión vigente es siempre la publicada en esta página,
        con su fecha de actualización. Ver también los{' '}
        <Link href="/terminos-y-condiciones">Términos y Condiciones</Link>.
      </p>
    ),
  },
];

export default function PoliticaDePrivacidad() {
  return (
    <LegalPage
      titulo="Política de Privacidad"
      intro={
        <p>
          En {SITE_NAME} cuidamos tus datos personales conforme a la Ley N.º 25.326 de Protección de
          los Datos Personales y su normativa complementaria. Acá te contamos qué datos recopilamos,
          para qué y cómo podés controlarlos.
        </p>
      }
      secciones={SECCIONES}
      actualizado={LEGAL.actualizado}
    />
  );
}
