-- =============================================================
-- Nutrirse | Migracion: nota de venta por producto
-- Ejecutar en Supabase > SQL Editor. Es idempotente.
-- =============================================================

-- Condicion comercial corta que se muestra destacada cerca del precio
-- ("A partir de 5 unidades. Por mas de 20 bolsitas, consultar precio").
-- No es la descripcion: es una regla de venta, y la UI la pinta como aviso.
alter table public.products
  add column if not exists nota_venta text;

alter table public.products drop constraint if exists products_nota_venta_largo;
alter table public.products add constraint products_nota_venta_largo check (
  nota_venta is null or char_length(nota_venta) <= 200
);

comment on column public.products.nota_venta is
  'Condicion especial de venta, una linea. Se muestra destacada junto al precio.';
