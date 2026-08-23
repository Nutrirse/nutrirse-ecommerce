import { formatARS } from './format';
import type { CartItem, Customer, ShippingOption } from '@/types';

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5493875555555';

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

  const subtotal = items.reduce((a, i) => a + (i.precio ?? 0) * i.cantidad, 0);
  const peso = items.reduce((a, i) => a + i.peso_kg * i.cantidad, 0);
  const hayConsultar = items.some((i) => i.tipo === 'consultar');
  const total = subtotal + (shipping?.price ?? 0);

  const detalle = items
    .map((i) => {
      const precio =
        i.tipo === 'consultar'
          ? 'a cotizar'
          : formatARS((i.precio ?? 0) * i.cantidad);
      return `• ${B(i.nombre)}\n   ${i.variantLabel} × ${i.cantidad} — ${precio}`;
    })
    .join('\n');

  const envio = shipping
    ? [
        `${B('ENVÍO')}`,
        `${shipping.label}`,
        `Entrega estimada: ${shipping.eta_dias[0]}–${shipping.eta_dias[1]} días hábiles`,
        `Costo: ${formatARS(shipping.price)}`,
      ].join('\n')
    : `${B('ENVÍO')}\nA coordinar`;

  return [
    `${B('NUEVO PEDIDO MAYORISTA')} 🌰`,
    `Ref: ${ref} · ${fecha}`,
    LINE,
    B('CLIENTE'),
    `Nombre: ${customer.nombre}`,
    `DNI/CUIT: ${customer.dni}`,
    `Tel: ${customer.telefono}`,
    `Email: ${customer.email}`,
    `Dirección: ${customer.direccion}`,
    `Localidad: ${customer.localidad} (CP ${customer.cp})`,
    LINE,
    B('DETALLE'),
    detalle,
    '',
    `Peso total: ${peso} kg`,
    `Subtotal productos: ${formatARS(subtotal)}`,
    hayConsultar ? '_(hay ítems por volumen a cotizar)_' : null,
    LINE,
    envio,
    LINE,
    `${B('TOTAL ESTIMADO')}: ${formatARS(total)}`,
    hayConsultar ? '_Sujeto a cotización de los ítems por volumen._' : null,
    nota ? `${LINE}\n${B('NOTA')}\n${nota}` : null,
    '',
    'Confirmame disponibilidad y forma de pago, gracias.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildWhatsAppUrl(ticket: string, numero = WHATSAPP_NUMBER): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(ticket)}`;
}
