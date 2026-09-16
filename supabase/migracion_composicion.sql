-- =============================================================
-- Nutrirse | Migracion: composicion corta de los productos
-- Ejecutar en Supabase > SQL Editor. Es idempotente.
-- =============================================================

-- `composicion` es la linea de ingredientes que se muestra bajo el titulo,
-- arriba de los precios ("Contiene: Almendra, Nuez, Pasas"). Nacio para los
-- Mixes, pero sirve para cualquier producto compuesto.
--
-- No reemplaza a `descripcion`: esa sigue siendo el parrafo comercial largo
-- que va mas abajo. Son dos campos distintos a proposito, porque la UI los
-- renderiza en lugares y jerarquias diferentes.
alter table public.products
  add column if not exists composicion text;

-- Tope de largo: es una linea, no un parrafo. La UI la muestra en una sola
-- fila y el panel ya valida 200, pero la service_role key ignora RLS: si
-- alguna vez se escribe desde otro lado, la base corta igual.
alter table public.products drop constraint if exists products_composicion_largo;
alter table public.products add constraint products_composicion_largo check (
  composicion is null or char_length(composicion) <= 200
);

comment on column public.products.composicion is
  'Ingredientes en una linea, ej. "Almendra, Nuez, Pasas de uva". Se muestra bajo el titulo, antes de los precios.';
