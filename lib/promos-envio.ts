import type { Modo } from './modo';
import type { ShippingOption } from '@/types';

/**
 * Promociones de envio del canal minorista (B2C). El mayorista no tiene
 * ninguna: el flete siempre lo paga el comprador.
 */

/** 20 % off despachando con Andreani fuera de Salta Capital. */
export const DESCUENTO_ANDREANI = 0.2;

/** Uber gratis en Salta Capital: compra minima y tope que cubre la promo. */
export const UBER_MINIMO = 35000;
export const UBER_TOPE = 3500;

/** Texto exacto de la promo para el ticket de WhatsApp. */
export const PROMO_ENVIO_TICKET =
  '*Promo Envío:* Gratis en Uber (compras > $35.000, solo Salta Capital, tope de cobertura $3.500) | 20% de descuento con Andreani (fuera de Salta Capital).';

/**
 * Salta Capital = CP 4400, en formato numerico (4400) o alfanumerico
 * (A4400XAB). Sin CP cargado no se puede saber: se devuelve null.
 */
export function esSaltaCapital(cp: string | null | undefined): boolean | null {
  const v = String(cp ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (/^\d{4}$/.test(v)) return v === '4400';
  if (/^[A-Z]\d{4}[A-Z]{3}$/.test(v)) return v.slice(1, 5) === '4400';
  return null;
}

/**
 * Monto que se descuenta del envio por la promo Andreani. Solo aplica en
 * minorista, con una opcion Andreani elegida y un CP fuera de Salta Capital.
 */
export function descuentoEnvio(
  canal: Modo,
  shipping: ShippingOption | null,
  cp: string | null | undefined
): number {
  if (canal !== 'minorista' || shipping?.carrier !== 'Andreani') return 0;
  if (esSaltaCapital(cp) !== false) return 0;
  return Math.round(shipping.price * DESCUENTO_ANDREANI);
}
