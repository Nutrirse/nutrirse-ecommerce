-- =============================================================
-- Nutrirse | Migracion: galeria de hasta 3 imagenes por producto
-- Ejecutar en Supabase > SQL Editor. Es idempotente.
-- =============================================================

-- `imagenes` es la galeria completa y ordenada. La posicion 1 es la
-- principal: la que se ve en la card del catalogo, en el carrito y en el
-- Open Graph.
--
-- `imagen_url` NO se elimina. Sigue siendo la imagen principal denormalizada
-- y es lo que leen el store del carrito (localStorage ya persistido), el
-- JSON-LD y lib/fallback-products.ts. El servidor la mantiene sincronizada
-- con imagenes[1] en cada write (ver lib/admin-products.ts), asi que nada
-- del codigo viejo se rompe.
alter table public.products
  add column if not exists imagenes text[] not null default '{}'::text[];

-- Backfill: los productos que ya tenian una foto arrancan con esa galeria.
update public.products
   set imagenes = array[imagen_url]
 where imagen_url is not null
   and coalesce(array_length(imagenes, 1), 0) = 0;

-- Tope duro de 3. La UI ya lo limita, pero la service_role key ignora RLS:
-- si alguna vez se escribe desde otro lado, la base corta igual.
alter table public.products drop constraint if exists products_imagenes_max;
alter table public.products add constraint products_imagenes_max check (
  coalesce(array_length(imagenes, 1), 0) <= 3
);

-- Coherencia: si hay galeria, la principal tiene que ser la posicion 1.
-- Se valida como constraint y no con un trigger para que un write mal armado
-- falle ruidoso en vez de quedar con la card mostrando otra foto.
alter table public.products drop constraint if exists products_imagen_principal;
alter table public.products add constraint products_imagen_principal check (
  coalesce(array_length(imagenes, 1), 0) = 0 or imagenes[1] = imagen_url
);
