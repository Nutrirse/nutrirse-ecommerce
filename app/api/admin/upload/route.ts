import { NextResponse } from 'next/server';
import { haySesionAdmin } from '@/lib/admin-auth';
import { isAdminConfigured, subirImagenProducto } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sube una imagen al bucket `productos` y devuelve la URL publica.
 *
 * La subida pasa por el servidor y no directo desde el navegador: el bucket
 * no tiene policy de INSERT para `anon`, y darsela dejaria a cualquiera
 * escribir en el Storage del proyecto.
 */
export async function POST(req: Request) {
  if (!(await haySesionAdmin())) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.' },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Se esperaba multipart/form-data.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No llegó ningún archivo.' }, { status: 400 });
  }

  const slug = String(form.get('slug') ?? 'producto');

  try {
    const { url, path } = await subirImagenProducto(file, slug);
    return NextResponse.json({ url, path });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al subir la imagen.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
