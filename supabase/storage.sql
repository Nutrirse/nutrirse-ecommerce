-- =============================================================
-- Nutrirse | Bucket de imagenes de producto
-- Ejecutar en Supabase > SQL Editor (despues de schema.sql)
-- =============================================================

-- Bucket publico: las imagenes se sirven por CDN y las consume <Image>
-- desde el sitio. `public = true` solo habilita la LECTURA anonima.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'productos',
  'productos',
  true,
  5242880,  -- 5 MB, igual que MAX_IMAGEN_BYTES en lib/supabase-admin.ts
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lectura publica.
drop policy if exists "productos lectura publica" on storage.objects;
create policy "productos lectura publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'productos');

-- NO se crean policies de insert/update/delete a proposito.
-- Las escrituras entran por /api/admin/upload con la service_role key, que
-- ignora RLS. Darle INSERT a `anon` dejaria a cualquiera con la anon key
-- (que es publica, viaja en el bundle) subir archivos al proyecto.

-- =============================================================
-- El panel admin necesita ver tambien los productos inactivos.
-- No hace falta tocar RLS: /api/admin/products usa service_role.
-- La policy publica de schema.sql sigue siendo `activo = true`.
-- =============================================================
