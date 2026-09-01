/**
 * Lectura defensiva de respuestas de la API del admin.
 *
 * Los errores de infraestructura no vienen en JSON: Vercel responde el 413
 * ("Request Entity Too Large") y varios 5xx como texto plano o HTML. Hacer
 * `res.json()` a ciegas sobre eso tira
 * `Unexpected token 'R', "Request En"... is not valid JSON`, que es lo que
 * termina viendo el cliente en vez del problema real.
 */

/** Mensajes por status para los casos que nunca traen JSON. */
function mensajePorStatus(status: number, texto: string): string {
  if (status === 413) {
    return 'La imagen es demasiado pesada para el servidor. Probá con una foto más chica o recortada.';
  }
  if (status === 401 || status === 403) {
    return 'Tu sesión de admin expiró. Volvé a iniciar sesión.';
  }
  if (status === 504 || status === 408) {
    return 'El servidor tardó demasiado en responder. Reintentá en unos segundos.';
  }
  if (status >= 500) {
    return `El servidor respondió con un error (${status}). Reintentá en unos segundos.`;
  }
  // Ultimo recurso: un fragmento corto y sin HTML del cuerpo.
  const limpio = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (/request entity too large/i.test(limpio)) {
    return 'La imagen es demasiado pesada para el servidor. Probá con una foto más chica o recortada.';
  }
  return limpio ? `Error ${status}: ${limpio.slice(0, 140)}` : `Error ${status} del servidor.`;
}

/**
 * Devuelve el JSON de la respuesta, o tira un Error con un mensaje legible.
 * Nunca propaga un SyntaxError de JSON.parse.
 */
export async function leerJson<T>(res: Response): Promise<T> {
  const texto = await res.text().catch(() => '');

  let data: unknown = null;
  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const delServidor =
      data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : null;
    throw new Error(delServidor ?? mensajePorStatus(res.status, texto));
  }

  if (data === null) {
    throw new Error('El servidor respondió algo que no pudimos interpretar. Reintentá.');
  }
  return data as T;
}

/** Normaliza cualquier throw (incluido el fallo de red del fetch) a texto. */
export function mensajeDeError(e: unknown, fallback: string): string {
  if (e instanceof TypeError) {
    // fetch rechaza con TypeError cuando se corta la conexion o el request
    // se aborta a mitad de la subida.
    return 'No pudimos conectar con el servidor. Revisá tu conexión y reintentá.';
  }
  return e instanceof Error && e.message ? e.message : fallback;
}
