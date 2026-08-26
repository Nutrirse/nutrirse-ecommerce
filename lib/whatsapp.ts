import { formatARS } from './format';
import type { CartItem, Customer, MetodoPago, ShippingOption } from '@/types';

const FALLBACK_NUMBER = '5493874870997';

/**
 * Envio bonificado a partir de este subtotal DE PRODUCTOS (sin contar el
 * envio). Lo anuncia components/AvisoEnvioGratis.tsx: si se cambia el
 * numero aca, el cartel se actualiza solo. Poner 0 desactiva la promo.
 */
export const ENVIO_GRATIS_DESDE = 100_000;

/**
 * wa.me solo acepta digitos: sin '+', sin espacios, guiones, parentesis ni
 * puntos. Tambien tolera que el .env venga con comillas o con prefijo '00'.
 * Ej: "+54 9 387 487-0997" -> "5493874870997"
 */
export function sanitizeWhatsAppNumber(raw: string | undefined | null): string {
  const digits = String(raw ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '')   // comillas del .env
    .replace(/\D/g, '')            // todo lo que no sea digito
    .replace(/^0+/, '');           // 00 internacional / ceros a la izquierda

  // Un numero AR valido tiene 12-13 digitos (54 9 + area + abonado).
  return digits.length >= 8 ? digits : FALLBACK_NUMBER;
}

export const WHATSAPP_NUMBER = sanitizeWhatsAppNumber(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
);

/* ------------------------------------------------------------------ */
/* Metodos de pago                                                     */
/* ------------------------------------------------------------------ */

export const METODOS_PAGO: Array<{
  id: MetodoPago;
  label: string;
  detalle: string;
  /**
   * Descuento sobre el subtotal de productos (0.10 = 10 %).
   * Hoy ningun metodo descuenta: se deja el campo para una promo futura.
   */
  descuento: number;
  /** El retiro en deposito no paga envio. */
  requiereEnvio: boolean;
}> = [
  {
    id: 'transferencia',
    label: 'Transferencia bancaria',
    detalle: 'Coordinamos los datos por WhatsApp al confirmar el pedido',
    descuento: 0,
    requiereEnvio: true,
  },
  {
    id: 'efectivo',
    label: 'Efectivo al retirar',
    detalle: 'Retiro en depósito, Salta Capital (sin costo de envío)',
    descuento: 0,
    requiereEnvio: false,
  },
];

export const metodoPago = (id: MetodoPago) =>
  METODOS_PAGO.find((m) => m.id === id) ?? METODOS_PAGO[0];

/**
 * Calcula el desglose del pedido en un solo lugar, para que el resumen en
 * pantalla y el ticket de WhatsApp nunca muestren numeros distintos.
 */
export function calcularTotales(
  items: CartItem[],
  shipping: ShippingOption | null,
  pago: MetodoPago
) {
  const m = metodoPago(pago);
  const subtotal = items.reduce((a, i) => a + (i.precio ?? 0) * i.cantidad, 0);
  const descuento = Math.round(subtotal * m.descuento);
  const peso = items.reduce((a, i) => a + i.peso_kg * i.cantidad, 0);

  const costoEnvio = m.requiereEnvio ? shipping?.price ?? 0 : 0;
  // El retiro en deposito ya no paga envio: no cuenta como bonificado.
  const envioBonificado =
    m.requiereEnvio && ENVIO_GRATIS_DESDE > 0 && subtotal >= ENVIO_GRATIS_DESDE;
  const envio = envioBonificado ? 0 : costoEnvio;

  return {
    subtotal,
    descuento,
    envio,
    /** Lo que se habria cobrado de envio si no aplicara la promo. */
    envioSinPromo: costoEnvio,
    envioBonificado,
    /** Cuanto falta de subtotal para llegar al envio gratis. 0 si ya llego. */
    faltaParaEnvioGratis:
      ENVIO_GRATIS_DESDE > 0 ? Math.max(0, ENVIO_GRATIS_DESDE - subtotal) : 0,
    peso,
    total: subtotal - descuento + envio,
    hayConsultar: items.some((i) => i.tipo === 'consultar'),
    metodo: m,
  };
}

/* ------------------------------------------------------------------ */
/* Ticket                                                              */
/* ------------------------------------------------------------------ */

type TicketInput = {
  customer: Customer;
  items: CartItem[];
  shipping: ShippingOption | null;
  nota?: string;
};

const B = (s: string) => `*${s}*`;
const LINE = '━━━━━━━━━━━━━━━';

/** Genera el ticket con sintaxis WhatsApp (negritas y saltos de línea). */
export function buildTicket({ customer, items, shipping, nota }: TicketInput): string {
  const fecha = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Salta',
  }).format(new Date());

  const ref = `NUT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const t = calcularTotales(items, shipping, customer.metodoPago);

  const detalle = items
    .map((i) => {
      const precio =
        i.tipo === 'consultar' ? 'Precio a Consultar' : formatARS((i.precio ?? 0) * i.cantidad);
      return `• ${B(i.nombre)}\n   ${i.variantLabel} × ${i.cantidad} — ${precio}`;
    })
    .join('\n');

  const domicilio = [
    `${customer.direccion} ${customer.altura}`.trim(),
    customer.piso ? `Piso/Depto: ${customer.piso}` : null,
    `${customer.ciudad}, ${customer.provincia} (CP ${customer.cp})`,
    customer.indicaciones ? `Indicaciones: ${customer.indicaciones}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const envio = !t.metodo.requiereEnvio
    ? `${B('ENTREGA')}\nRetiro en depósito · Salta Capital`
    : shipping
      ? [
          B('ENVÍO'),
          shipping.label,
          `Entrega estimada: ${shipping.eta_dias[0]}–${shipping.eta_dias[1]} días hábiles`,
          t.envioBonificado
            ? `Costo: BONIFICADO (compra mayor a ${formatARS(ENVIO_GRATIS_DESDE)})`
            : `Costo: ${formatARS(shipping.price)}`,
        ].join('\n')
      : `${B('ENVÍO')}\nA coordinar`;

  return [
    `${B('NUEVO PEDIDO MAYORISTA')} 🌰`,
    `Ref: ${ref} · ${fecha}`,
    LINE,
    B('CLIENTE'),
    `Nombre: ${customer.nombre} ${customer.apellido}`,
    `DNI/CUIT: ${customer.dni}`,
    `Tel: ${customer.telefono}`,
    customer.email ? `Email: ${customer.email}` : null,
    LINE,
    B('DOMICILIO'),
    domicilio,
    LINE,
    B('DETALLE'),
    detalle,
    '',
    `Peso total: ${t.peso} kg`,
    `Subtotal productos: ${formatARS(t.subtotal)}`,
    t.descuento > 0
      ? `Descuento (${Math.round(t.metodo.descuento * 100)} %): -${formatARS(t.descuento)}`
      : null,
    t.hayConsultar ? '_(hay ítems por volumen a cotizar)_' : null,
    LINE,
    envio,
    LINE,
    `${B('PAGO')}: ${t.metodo.label}`,
    `${B('TOTAL ESTIMADO')}: ${formatARS(t.total)}`,
    t.hayConsultar ? '_Sujeto a cotización de los ítems por volumen._' : null,
    nota ? `${LINE}\n${B('NOTA')}\n${nota}` : null,
    '',
    'Confirmame disponibilidad y forma de pago, gracias.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildWhatsAppUrl(ticket: string, numero = WHATSAPP_NUMBER): string {
  // Se re-sanitiza por si llega un numero por parametro desde otro origen.
  return `https://wa.me/${sanitizeWhatsAppNumber(numero)}?text=${encodeURIComponent(ticket)}`;
}
