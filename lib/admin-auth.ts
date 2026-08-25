import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Auth del panel admin: una sola contraseña, sin tabla de usuarios.
 *
 * La contraseña NUNCA viaja en la cookie. Al loguearse se emite un token
 * `exp.nonce.hmac` firmado con `ADMIN_SESSION_SECRET` (o, si no existe, con
 * la propia contraseña como clave). La cookie es httpOnly, asi que el JS de
 * la pagina no puede leerla ni un XSS robarla.
 *
 * Cambiar ADMIN_PASSWORD sin ADMIN_SESSION_SECRET invalida las sesiones
 * abiertas, que es justo lo que se quiere al rotar la clave.
 */

export const ADMIN_COOKIE = 'nutrirse_admin';
const DURACION_MS = 12 * 60 * 60 * 1000; // 12 h

function secreto(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
  return s && s.length > 0 ? s : null;
}

export function adminPasswordConfigurada(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function firmar(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

/** Comparacion en tiempo constante: evita filtrar la clave por timing. */
function igual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) {
    // Igual gastamos el compare para no delatar la diferencia de largo.
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export function passwordValida(intento: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  return igual(intento, real);
}

export function crearToken(): string {
  const key = secreto();
  if (!key) throw new Error('Falta ADMIN_PASSWORD en el entorno.');
  const payload = `${Date.now() + DURACION_MS}.${randomBytes(9).toString('base64url')}`;
  return `${payload}.${firmar(payload, key)}`;
}

export function tokenValido(token: string | undefined): boolean {
  const key = secreto();
  if (!token || !key) return false;

  const partes = token.split('.');
  if (partes.length !== 3) return false;

  const [exp, nonce, sig] = partes;
  const payload = `${exp}.${nonce}`;
  if (!igual(sig, firmar(payload, key))) return false;

  const vence = Number(exp);
  return Number.isFinite(vence) && vence > Date.now();
}

/** Lee la cookie de sesion. Usar dentro de Route Handlers. */
export async function haySesionAdmin(): Promise<boolean> {
  const store = await cookies();
  return tokenValido(store.get(ADMIN_COOKIE)?.value);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: DURACION_MS / 1000,
};

/* ------------------------------------------------------------------ */
/* Rate limit de login                                                 */
/* ------------------------------------------------------------------ */

/**
 * Freno simple contra fuerza bruta. Vive en memoria del proceso: en
 * serverless cada instancia lleva su cuenta, asi que no es una defensa
 * dura, pero corta el bombardeo desde una sola conexion. Si el panel se
 * expone en serio, esto va a Upstash/Redis.
 */
const intentos = new Map<string, { n: number; hasta: number }>();
const MAX_INTENTOS = 8;
const BLOQUEO_MS = 10 * 60 * 1000;

export function bloqueado(ip: string): number {
  const reg = intentos.get(ip);
  if (!reg) return 0;
  if (reg.hasta > Date.now()) return Math.ceil((reg.hasta - Date.now()) / 1000);
  if (reg.hasta <= Date.now()) intentos.delete(ip);
  return 0;
}

export function registrarFallo(ip: string): void {
  const reg = intentos.get(ip) ?? { n: 0, hasta: 0 };
  reg.n += 1;
  if (reg.n >= MAX_INTENTOS) {
    reg.hasta = Date.now() + BLOQUEO_MS;
    reg.n = 0;
  }
  intentos.set(ip, reg);
}

export function limpiarIntentos(ip: string): void {
  intentos.delete(ip);
}

export function ipDe(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'desconocida';
}
