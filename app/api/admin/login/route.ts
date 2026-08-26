import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  adminPasswordConfigurada,
  bloqueado,
  cookieOptions,
  crearToken,
  haySesionAdmin,
  ipDe,
  limpiarIntentos,
  passwordValida,
  registrarFallo,
} from '@/lib/admin-auth';

// node: usa crypto para firmar el token.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Ping de sesion: el panel lo consulta al montar. */
export async function GET() {
  return NextResponse.json({
    autenticado: await haySesionAdmin(),
    configurado: adminPasswordConfigurada(),
  });
}

export async function POST(req: Request) {
  if (!adminPasswordConfigurada()) {
    return NextResponse.json(
      { error: 'Falta ADMIN_PASSWORD en el entorno del servidor.' },
      { status: 503 }
    );
  }

  const ip = ipDe(req);
  const espera = bloqueado(ip);
  if (espera > 0) {
    return NextResponse.json(
      { error: `Demasiados intentos. Probá de nuevo en ${Math.ceil(espera / 60)} min.` },
      { status: 429 }
    );
  }

  let password = '';
  let recordarme = false;
  try {
    const body = (await req.json()) as { password?: unknown; recordarme?: unknown };
    password = String(body.password ?? '');
    recordarme = body.recordarme === true;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!passwordValida(password)) {
    registrarFallo(ip);
    // Mismo mensaje siempre: no confirmamos si el usuario existe ni nada.
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 });
  }

  limpiarIntentos(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, crearToken(recordarme), cookieOptions(recordarme));
  return res;
}
