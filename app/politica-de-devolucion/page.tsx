import type { Metadata } from 'next';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Políticas de Devolución y Envíos',
  description:
    'Condiciones de cambio, devolución, plazos de reclamo y reembolsos para compras mayoristas en Nutrirse.',
  alternates: { canonical: '/politica-de-devolucion' },
};

const SECCIONES = [
  {
    titulo: 'Condiciones de cambios',
    intro:
      'Aceptamos cambios y devoluciones sobre mercadería que conserve su condición original de venta:',
    items: [
      'El producto debe estar en su envase original, cerrado y sin fraccionar.',
      'No se aceptan devoluciones de bultos abiertos, fraccionados o reenvasados.',
      'La mercadería no debe haber sido expuesta a humedad, calor directo ni a otros olores.',
      'Es necesario presentar el remito o el número de pedido (Ref. NUT-XXXXXX) enviado por WhatsApp.',
      'Los productos cotizados por volumen se rigen por las condiciones acordadas por escrito en la cotización.',
    ],
  },
  {
    titulo: 'Plazos de reclamo',
    intro: 'Los tiempos corren desde la recepción efectiva del pedido:',
    items: [
      'Faltantes, diferencias de peso o roturas: hasta 48 horas hábiles de recibida la mercadería.',
      'Vicios ocultos o problemas de calidad no detectables a simple vista: hasta 10 días corridos.',
      'Errores de despacho de nuestra parte: sin límite de plazo, con la mercadería sin abrir.',
      'Pasados los plazos indicados, el pedido se considera aceptado en conformidad.',
    ],
  },
  {
    titulo: 'Estado de la mercadería',
    intro:
      'Al recibir el pedido, revisá los bultos delante del transportista antes de firmar el remito:',
    items: [
      'Verificá la cantidad de bultos contra el detalle del pedido.',
      'Si un bulto llega mojado, roto o con signos de apertura, dejalo asentado en el remito del transporte.',
      'Sacá fotos del embalaje y del contenido antes de mover la mercadería del lugar de recepción.',
      'Sin la observación en el remito, el transporte no reconoce el siniestro y el reclamo se complica.',
    ],
  },
  {
    titulo: 'Reembolsos',
    intro: 'Una vez aprobado el reclamo, resolvemos por alguna de estas vías:',
    items: [
      'Nota de crédito aplicable a la siguiente compra (opción por defecto).',
      'Reposición del producto en el próximo despacho, sin cargo de flete.',
      'Devolución del importe por transferencia bancaria, dentro de los 10 días hábiles de aprobado el reclamo.',
      'Si el error fue nuestro, la reposición y el flete corren por nuestra cuenta.',
      'Si la devolución responde a un cambio de decisión del comprador, el flete de retorno queda a su cargo.',
    ],
  },
  {
    titulo: 'Envíos y demoras',
    intro: 'Sobre los tiempos de entrega y la responsabilidad del transporte:',
    items: [
      'Despachamos dentro de las 24 horas hábiles de confirmado el pedido y el pago.',
      'Los plazos de entrega que muestra el cotizador son estimados por el correo, no garantizados.',
      'Las demoras atribuibles al transporte no generan derecho a devolución del costo de envío.',
      'Si el domicilio informado es incorrecto y el envío vuelve al origen, el segundo despacho se cobra aparte.',
    ],
  },
];

export default function PoliticaDevolucion() {
  return (
    <div className="min-h-dvh bg-crema pb-24 pt-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {/* ---------------- Header ---------------- */}
        <header className="border-b border-black/10 pb-10">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-tostado">Legales</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.1rem,5.5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight text-carbon">
            Políticas de Devolución y Envíos
          </h1>
          <p className="mt-4 leading-relaxed text-humo">
            Condiciones aplicables a todas las operaciones mayoristas de Nutrirse. Al
            confirmar un pedido por WhatsApp, el comprador acepta los términos detallados
            en esta página.
          </p>
        </header>

        {/* ---------------- Índice ---------------- */}
        <nav aria-label="Contenido" className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-humo">Contenido</p>
          <ol className="mt-3 space-y-1.5">
            {SECCIONES.map((s, i) => (
              <li key={s.titulo}>
                <a
                  href={`#seccion-${i + 1}`}
                  className="text-sm text-nuez underline-offset-4 hover:underline"
                >
                  {i + 1}. {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ---------------- Secciones ---------------- */}
        <div className="mt-14 space-y-14">
          {SECCIONES.map((s, i) => (
            <section key={s.titulo} id={`seccion-${i + 1}`} className="scroll-mt-28">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-carbon sm:text-3xl">
                {s.titulo}
              </h2>
              <p className="mt-3 leading-relaxed text-humo">{s.intro}</p>
              <ul className="mt-5 list-disc space-y-2 pl-5 leading-relaxed text-humo marker:text-tostado">
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* ---------------- CTA ---------------- */}
        <section className="mt-16 rounded-2xl border border-black/5 bg-hueso p-7">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-carbon">
            ¿Necesitás iniciar un reclamo?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-humo">
            Escribinos por WhatsApp con el número de pedido y las fotos del producto y del
            embalaje. Te respondemos dentro del día hábil.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#28a745] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#218838]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22z" />
            </svg>
            Iniciar reclamo
          </a>
        </section>

        <p className="mt-10 text-xs leading-relaxed text-humo/70">
          Última actualización: {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}.
          Texto de referencia: validalo con tu asesor legal o contable antes de publicarlo
          como condiciones definitivas.
        </p>
      </div>
    </div>
  );
}
