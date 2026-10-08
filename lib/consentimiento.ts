/**
 * Consentimiento de cookies de analisis y publicidad (Google Analytics y
 * Pixel de Meta). Vive en localStorage: es una preferencia de este
 * navegador, no un dato de la cuenta. Sin respuesta guardada no se carga
 * ningun script de terceros.
 */
export type Consentimiento = 'aceptadas' | 'rechazadas';

const CLAVE = 'nutrirse:cookies';

/** Evento de ventana para que <Analytics> cargue en el momento del "Aceptar". */
export const EVENTO_CONSENTIMIENTO = 'nutrirse:consentimiento';

export function leerConsentimiento(): Consentimiento | null {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === 'aceptadas' || v === 'rechazadas' ? v : null;
  } catch {
    return null;
  }
}

export function guardarConsentimiento(v: Consentimiento) {
  try {
    localStorage.setItem(CLAVE, v);
  } catch {
    // Storage bloqueado: la eleccion vale para esta visita y el aviso vuelve
    // en la proxima. Es lo correcto: no hay donde recordarla.
  }
  window.dispatchEvent(new CustomEvent<Consentimiento>(EVENTO_CONSENTIMIENTO, { detail: v }));
}
