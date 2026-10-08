-- =============================================================
-- Nutrirse | Migracion: visibilidad por canal (mayorista / minorista)
-- Ejecutar en Supabase > SQL Editor. Es idempotente.
--
-- IMPORTANTE: correr ANTES de desplegar el codigo que filtra por estas
-- columnas. Si el codigo llega primero, la consulta del catalogo falla y
-- la web cae al catalogo estatico de respaldo.
-- =============================================================

begin;

-- Default true: todo el catalogo actual sigue visible en las dos tiendas.
-- `activo` sigue siendo el interruptor general (sin stock); estas columnas
-- deciden en que tienda aparece un producto activo. Un duplicado
-- "(Minorista)" queda con visible_mayorista = false y no ensucia el
-- catalogo mayorista.
alter table public.products
  add column if not exists visible_mayorista boolean not null default true,
  add column if not exists visible_minorista boolean not null default true;

comment on column public.products.visible_mayorista is
  'Se lista en /mayorista y /productos (ademas de activo = true).';
comment on column public.products.visible_minorista is
  'Se lista en /minorista y /minorista/productos (ademas de activo = true).';

-- seguridad_precios.sql da SELECT columna por columna a los roles
-- publicos: una columna nueva no es legible hasta darle el grant. Sin esto
-- el lector de respaldo con anon key (lib/products.ts) fallaria al filtrar.
grant select (visible_mayorista, visible_minorista) on table public.products to anon, authenticated;

commit;

-- -------------------------------------------------------------
-- Verificacion (debe dar: true, true, 0 recien migrado)
-- -------------------------------------------------------------
select
  has_column_privilege('anon', 'public.products', 'visible_mayorista', 'select') as anon_ve_mayorista,
  has_column_privilege('anon', 'public.products', 'visible_minorista', 'select') as anon_ve_minorista,
  (select count(*) from public.products where not visible_mayorista or not visible_minorista) as ocultos;
