import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-auth/server';

export const dynamic = 'force-dynamic';

/** POST y no GET: un <img src> o un prefetch no deben poder cerrar la sesion. */
export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  await supabase?.auth.signOut();
  return NextResponse.redirect(new URL('/minorista', request.url), { status: 303 });
}
