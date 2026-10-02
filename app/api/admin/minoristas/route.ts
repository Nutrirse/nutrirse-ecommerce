import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase-admin';
import type { FilaMinorista } from '@/lib/admin-minorista';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Todas las filas de `precios_minoristas`. Los productos salen de /api/admin/products. */
export async function GET() {
  if (!(await haySesionAdmin())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.' },
      { status: 503 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('precios_minoristas')
    .select('product_id, variantes, updated_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ filas: (data ?? []) as FilaMinorista[] });
}
