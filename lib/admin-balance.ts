import { PayloadError } from './admin-products';
import { ESTADOS, MEDIOS_PAGO, TIPOS, UNIDADES, esFechaISO } from './balance';
import type { EstadoPago, LineaDetalle, MedioPago, TipoTransaccion } from './balance';

/**
 * Validacion de los payloads del Panel de Balance. Igual que con productos:
 * la service_role key ignora RLS, asi que lo que no se valida aca se escribe.
 * Los checks de supabase/migracion_balance.sql son la segunda red.
 */

export const SELECT_TRANSACCION =
  'id, fecha, tipo, cliente_id, cliente_proveedor, concepto, medio_pago, valor, estado_pago, monto_entregado, ref_ticket, detalle';

export const SELECT_CLIENTE = 'id, nombre, telefono, documento, ref_cliente, notas';

export type TransaccionPayload = {
  fecha: string;
  tipo: TipoTransaccion;
  cliente_id: string | null;
  cliente_proveedor: string;
  concepto: string;
  medio_pago: MedioPago;
  valor: number;
  estado_pago: EstadoPago;
  monto_entregado: number | null;
  detalle: LineaDetalle[];
};

function texto(v: unknown, campo: string, max: number, obligatorio = false): string | null {
  const s = v == null ? '' : String(v).trim();
  if (!s) {
    if (obligatorio) throw new PayloadError(`Falta ${campo}.`);
    return null;
  }
  if (s.length > max) throw new PayloadError(`${campo} supera los ${max} caracteres.`);
  return s;
}

function enumerado<T extends string>(v: unknown, validos: readonly T[], campo: string): T {
  if (!validos.includes(v as T)) throw new PayloadError(`${campo} inválido.`);
  return v as T;
}

function monto(v: unknown, campo: string): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new PayloadError(`${campo} no es un número válido.`);
  return Math.round(n * 100) / 100;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuidOpcional(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (typeof v !== 'string' || !UUID.test(v)) throw new PayloadError('Cliente inválido.');
  return v;
}

function fecha(v: unknown): string {
  if (!esFechaISO(v)) throw new PayloadError('Fecha inválida (formato AAAA-MM-DD).');
  return v;
}

function detalle(v: unknown): LineaDetalle[] {
  if (v == null) return [];
  if (!Array.isArray(v)) throw new PayloadError('El detalle debe ser una lista.');
  if (v.length > 50) throw new PayloadError('Máximo 50 líneas por ticket.');
  return v.map((raw, i) => {
    const o = (raw ?? {}) as Record<string, unknown>;
    const linea: LineaDetalle = {
      descripcion: texto(o.descripcion, `la descripción de la línea ${i + 1}`, 160, true)!,
      cantidad: monto(o.cantidad, `La cantidad de la línea ${i + 1}`),
      precio_unitario: monto(o.precio_unitario, `El precio de la línea ${i + 1}`),
    };
    if (o.unidad != null && o.unidad !== '') {
      linea.unidad = enumerado(o.unidad, UNIDADES_IDS, `La unidad de la línea ${i + 1}`);
    }
    return linea;
  });
}

const TIPOS_IDS = TIPOS;
const ESTADOS_IDS = ESTADOS.map((e) => e.id);
const MEDIOS_IDS = MEDIOS_PAGO.map((m) => m.id);
const UNIDADES_IDS = UNIDADES.map((u) => u.id);

/**
 * La sena solo existe en un pago parcial y no puede superar el total. En el
 * resto de los estados se descarta (la base lo exige: ver
 * transacciones_parcial_check).
 */
function montoEntregado(v: unknown, estado: EstadoPago, valor: number): number | null {
  if (estado !== 'parcial') return null;
  if (v == null || v === '') throw new PayloadError('Indicá cuánto entregó a cuenta.');
  const n = monto(v, 'El monto entregado');
  if (n > valor) throw new PayloadError('El monto entregado no puede superar el total.');
  return n;
}

export function validarTransaccion(body: unknown): TransaccionPayload {
  const o = (body ?? {}) as Record<string, unknown>;
  const valor = monto(o.valor, 'El valor');
  const estado = enumerado(o.estado_pago, ESTADOS_IDS, 'Estado');
  return {
    fecha: fecha(o.fecha),
    tipo: enumerado(o.tipo, TIPOS_IDS, 'Tipo'),
    cliente_id: uuidOpcional(o.cliente_id),
    cliente_proveedor: texto(o.cliente_proveedor, 'el cliente o proveedor', 160, true)!,
    concepto: texto(o.concepto, 'el concepto', 300, true)!,
    medio_pago: enumerado(o.medio_pago, MEDIOS_IDS, 'Medio de pago'),
    valor,
    estado_pago: estado,
    monto_entregado: montoEntregado(o.monto_entregado, estado, valor),
    detalle: detalle(o.detalle),
  };
}

/**
 * PATCH desde la grilla (el dropdown de estado) o desde el modal de edicion.
 * Pasar a 'parcial' exige `monto_entregado` en el mismo pedido; el chequeo
 * contra el total lo hace la base (transacciones_parcial_check).
 */
export function validarParcialTransaccion(body: unknown): Partial<TransaccionPayload> {
  const o = (body ?? {}) as Record<string, unknown>;
  const out: Partial<TransaccionPayload> = {};

  if ('fecha' in o) out.fecha = fecha(o.fecha);
  if ('tipo' in o) out.tipo = enumerado(o.tipo, TIPOS_IDS, 'Tipo');
  if ('cliente_id' in o) out.cliente_id = uuidOpcional(o.cliente_id);
  if ('cliente_proveedor' in o) {
    out.cliente_proveedor = texto(o.cliente_proveedor, 'el cliente o proveedor', 160, true)!;
  }
  if ('concepto' in o) out.concepto = texto(o.concepto, 'el concepto', 300, true)!;
  if ('medio_pago' in o) out.medio_pago = enumerado(o.medio_pago, MEDIOS_IDS, 'Medio de pago');
  if ('valor' in o) out.valor = monto(o.valor, 'El valor');
  if ('estado_pago' in o) {
    out.estado_pago = enumerado(o.estado_pago, ESTADOS_IDS, 'Estado');
    out.monto_entregado =
      out.estado_pago === 'parcial'
        ? montoEntregado(o.monto_entregado, 'parcial', out.valor ?? Number.POSITIVE_INFINITY)
        : null;
  }
  if ('detalle' in o) out.detalle = detalle(o.detalle);

  if (Object.keys(out).length === 0) throw new PayloadError('No hay cambios para guardar.');
  return out;
}

export type ClientePayload = {
  nombre: string;
  telefono: string | null;
  documento: string | null;
  notas: string | null;
};

export function validarCliente(body: unknown): ClientePayload {
  const o = (body ?? {}) as Record<string, unknown>;
  // Mismo criterio que sanitizeWhatsAppNumber: solo digitos, sin 00 inicial.
  const tel = String(o.telefono ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (tel && (tel.length < 8 || tel.length > 15)) {
    throw new PayloadError('El teléfono debe tener entre 8 y 15 dígitos (con código de país, ej. 549387...).');
  }
  // DNI (7-8 digitos) o CUIT (11). Se guarda sin puntos ni guiones.
  const doc = String(o.documento ?? '').replace(/\D/g, '');
  if (doc && (doc.length < 7 || doc.length > 11)) {
    throw new PayloadError('El DNI debe tener 7 u 8 dígitos y el CUIT 11.');
  }
  return {
    nombre: texto(o.nombre, 'el nombre', 160, true)!,
    telefono: tel || null,
    documento: doc || null,
    notas: texto(o.notas, 'las notas', 500),
  };
}
