import { NextResponse } from 'next/server';
import { cotizar, normalizarCP, ORIGEN_CP } from '@/lib/shipping';

export const runtime = 'edge';

type Body = { cp?: unknown; peso_kg?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const cp = normalizarCP(String(body.cp ?? ''));
  if (!cp) {
    return NextResponse.json(
      { error: 'Código postal inválido. Usá 4 dígitos (4400) o el formato A4400XAB.' },
      { status: 400 }
    );
  }

  const pesoRaw = Number(body.peso_kg);
  const peso_kg = Number.isFinite(pesoRaw) && pesoRaw > 0 ? Math.min(pesoRaw, 2000) : 5;

  const { zona, opciones } = cotizar(cp, peso_kg);

  return NextResponse.json(
    { origen_cp: ORIGEN_CP, destino_cp: cp, zona, peso_kg, opciones },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cp = normalizarCP(searchParams.get('cp') ?? '');
  if (!cp) return NextResponse.json({ error: 'Falta ?cp=' }, { status: 400 });

  const peso_kg = Number(searchParams.get('peso_kg') ?? 5) || 5;
  const { zona, opciones } = cotizar(cp, peso_kg);
  return NextResponse.json({ origen_cp: ORIGEN_CP, destino_cp: cp, zona, peso_kg, opciones });
}
