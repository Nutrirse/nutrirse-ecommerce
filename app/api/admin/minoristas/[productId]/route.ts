import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import { supabaseAdmin, isAdminConfigured } from '@/lib/supabase-admin';
import { PayloadError } from '@/lib/admin-products';
import { validarVariantesMinoristas, type FilaMinorista } from '@/lib/admin-minorista';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ productId: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reemplaza las variantes minoristas de un producto. `{ variantes: [] }`
 * lo saca del canal (borra la fila). /minorista es dinamica: no hay ISR que
 * purgar, el cambio se ve en la proxima visita.
 */
export async function PUT(req: Request, { params }: Ctx) {
  if (!(await haySesionAdmin())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.' },
      { status: 503 }
    );
  }

  const { productId } = await params;
  if (!UUID.test(productId)) {
    return NextResponse.json({ error: 'Producto inválido.' }, { status: 400 });
  }

  let variantes;
  try {
    const body = (await req.json()) as { variantes?: unknown };
    variantes = validarVariantesMinoristas(body?.variantes);
  } catch (e) {
    const msg = e instanceof PayloadError ? e.message : 'JSON inválido';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (variantes.length === 0) {
    const { error } = await supabaseAdmin.from('precios_minoristas').delete().eq('product_id', productId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ fila: null });
  }

  const { data, error } = await supabaseAdmin
    .from('precios_minoristas')
    .upsert({ product_id: productId, variantes, updated_at: new Date().toISOString() })
    .select('product_id, variantes, updated_at')
    .single();

  // FK: el producto no existe (lo borraron mientras el panel estaba abierto).
  if (error?.code === '23503') {
    return NextResponse.json({ error: 'El producto ya no existe.' }, { status: 404 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fila: data as FilaMinorista });
}
