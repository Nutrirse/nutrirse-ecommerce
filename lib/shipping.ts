import type { ShippingOption } from '@/types';

export const ORIGEN_CP = '4400'; // Salta Capital

type Zona = { id: string; nombre: string; factor: number; dias: [number, number] };

// Zonificación por primer dígito del CP argentino, tomando Salta como origen.
const ZONAS: Record<string, Zona> = {
  '4': { id: 'noa', nombre: 'NOA', factor: 1.0, dias: [1, 3] },
  '3': { id: 'nea', nombre: 'NEA', factor: 1.25, dias: [3, 5] },
  '5': { id: 'centro', nombre: 'Centro / Cuyo', factor: 1.35, dias: [3, 5] },
  '2': { id: 'litoral', nombre: 'Litoral', factor: 1.45, dias: [4, 6] },
  '1': { id: 'amba', nombre: 'AMBA', factor: 1.5, dias: [3, 5] },
  'B': { id: 'bsas', nombre: 'Buenos Aires', factor: 1.6, dias: [4, 6] },
  '6': { id: 'bsas-int', nombre: 'Buenos Aires interior', factor: 1.7, dias: [5, 7] },
  '7': { id: 'bsas-sur', nombre: 'Buenos Aires sur', factor: 1.8, dias: [5, 8] },
  '8': { id: 'patagonia', nombre: 'Patagonia norte', factor: 2.1, dias: [6, 9] },
  '9': { id: 'patagonia-sur', nombre: 'Patagonia sur', factor: 2.6, dias: [7, 12] },
};

const BASE = 9800;      // ARS, cargo fijo del primer kg
const POR_KG = 720;     // ARS por kg adicional

export function normalizarCP(raw: string): string | null {
  const cp = raw.trim().toUpperCase().replace(/\s+/g, '');
  // Formatos válidos: 4400 | A4400XAB
  if (/^\d{4}$/.test(cp)) return cp;
  if (/^[A-Z]\d{4}[A-Z]{3}$/.test(cp)) return cp;
  return null;
}

function zonaDeCP(cp: string): Zona {
  // En el formato alfanumérico el dígito de zona es el segundo carácter.
  const digito = /^\d/.test(cp) ? cp[0] : cp[1];
  const esBsAsAlfa = /^[A-Z]/.test(cp) && cp[0] === 'B';
  if (esBsAsAlfa) return ZONAS['B'];
  return ZONAS[digito] ?? ZONAS['1'];
}

const redondear = (n: number) => Math.round(n / 100) * 100;

/**
 * Simulación de cotización de Zippin / Envíopack.
 * Reemplazar el cuerpo por un fetch al proveedor real manteniendo
 * la misma firma y el tipo `ShippingOption[]`.
 */
export function cotizar(cp: string, pesoKg: number): {
  zona: string;
  opciones: ShippingOption[];
} {
  const zona = zonaDeCP(cp);
  const peso = Math.max(1, Math.ceil(pesoKg));
  const bruto = (BASE + POR_KG * (peso - 1)) * zona.factor;

  const carriers: Array<{
    carrier: ShippingOption['carrier'];
    mult: { Domicilio: number; Sucursal: number };
    extraDias: number;
  }> = [
    { carrier: 'Andreani', mult: { Domicilio: 1.0, Sucursal: 0.82 }, extraDias: 0 },
    { carrier: 'OCA', mult: { Domicilio: 0.94, Sucursal: 0.78 }, extraDias: 1 },
    { carrier: 'Correo Argentino', mult: { Domicilio: 0.86, Sucursal: 0.7 }, extraDias: 2 },
  ];

  const opciones: ShippingOption[] = carriers.flatMap(({ carrier, mult, extraDias }) =>
    (['Domicilio', 'Sucursal'] as const).map((service) => ({
      id: `${carrier}-${service}`.toLowerCase().replace(/\s+/g, '-'),
      carrier,
      service,
      label: `${carrier} · ${service === 'Domicilio' ? 'A domicilio' : 'Retiro en sucursal'}`,
      price: redondear(bruto * mult[service]),
      eta_dias: [zona.dias[0] + extraDias, zona.dias[1] + extraDias] as [number, number],
    }))
  );

  opciones.sort((a, b) => a.price - b.price);
  return { zona: zona.nombre, opciones };
}
