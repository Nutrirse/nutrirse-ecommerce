-- =============================================================
-- Nutrirse | Migracion: baja de la presentacion de 5 kg (mayorista)
-- Ejecutar en Supabase > SQL Editor. Es idempotente.
--
-- La venta mayorista pasa a ser solo por bulto cerrado (o volumen). Las
-- variantes no viven en una tabla propia: son elementos del jsonb
-- `products.precios_por_variante`, asi que se editan los arrays y no se
-- borran filas.
--
-- Criterio "variante de 5 kg": el label es una presentacion de 5 kg
-- exactos ("5 kg", "Bolsa 5 kg", "Caja 5 kilos") y NO es un bulto. El
-- regex no toca "Bolsa 25 kg", "2.5 kg" ni "+5 bultos (Consultar)": el 5
-- no puede venir pegado a otro digito, a un punto o a una coma. Los labels
-- con "bulto" quedan afuera: "Bulto Cerrado (5 kg)" es el bulto de un
-- producto que se vende en caja de 5 kg, no la presentacion dada de baja.
--
-- Dos casos:
--   a) El producto tiene otra variante con precio (el bulto): la de 5 kg
--      se quita del array.
--   b) La de 5 kg es su unica variante con precio (cajas de datiles,
--      mixes): esa caja ES el bulto cerrado. Se convierte en
--      { id: 'bolsa', label: 'Bulto Cerrado (5 kg)' } con el mismo precio
--      y peso, en vez de dejar el producto sin nada que vender.
--
-- No se toca `precios_minoristas` (1/2 kg y 1 kg del canal minorista).
-- =============================================================

-- -------------------------------------------------------------
-- 0. Vista previa (correr sola primero para revisar)
-- -------------------------------------------------------------
-- select p.slug, v ->> 'id' as id, v ->> 'label' as label, v ->> 'precio' as precio,
--        exists (
--          select 1 from jsonb_array_elements(p.precios_por_variante) o
--          where o ->> 'tipo' = 'precio' and o is distinct from v
--        ) as tiene_otro_precio   -- true => caso a (se quita), false => caso b (pasa a bulto)
-- from public.products p
-- cross join lateral jsonb_array_elements(p.precios_por_variante) v
-- where v ->> 'label' ~* '(^|[^0-9.,])5\s*(kg|kilos?)\y'
--   and v ->> 'label' !~* 'bulto'
-- order by p.slug;

begin;

-- -------------------------------------------------------------
-- 1. Backup de los arrays que se van a modificar
-- -------------------------------------------------------------
create table if not exists public.backup_variantes_5kg (
  product_id           uuid primary key,
  precios_por_variante jsonb not null,
  respaldado_en        timestamptz not null default now()
);

-- El backup no tiene que ser legible con la anon key.
alter table public.backup_variantes_5kg enable row level security;

insert into public.backup_variantes_5kg (product_id, precios_por_variante)
select p.id, p.precios_por_variante
from public.products p
where exists (
  select 1 from jsonb_array_elements(p.precios_por_variante) v
  where v ->> 'label' ~* '(^|[^0-9.,])5\s*(kg|kilos?)\y'
    and v ->> 'label' !~* 'bulto'
)
on conflict (product_id) do nothing;  -- re-ejecutar no pisa el backup original

-- -------------------------------------------------------------
-- 2. Reescribir los arrays
-- -------------------------------------------------------------
with marcadas as (
  select
    p.id,
    e.v,
    e.ord,
    (e.v ->> 'label' ~* '(^|[^0-9.,])5\s*(kg|kilos?)\y'
      and e.v ->> 'label' !~* 'bulto') as es_5kg
  from public.products p
  cross join lateral jsonb_array_elements(p.precios_por_variante) with ordinality as e(v, ord)
),
por_producto as (
  select
    id,
    bool_or(es_5kg) as tiene_5kg,
    -- Hay otra variante con precio ademas de la(s) de 5 kg => caso a.
    bool_or(not es_5kg and v ->> 'tipo' = 'precio') as tiene_otro_precio
  from marcadas
  group by id
),
nuevo as (
  select
    m.id,
    coalesce(
      jsonb_agg(
        case
          when not m.es_5kg then m.v
          -- caso b: la caja de 5 kg pasa a ser el bulto cerrado
          else m.v || jsonb_build_object('id', 'bolsa', 'label', 'Bulto Cerrado (5 kg)')
        end
        order by m.ord
      ) filter (where not m.es_5kg or not pp.tiene_otro_precio),
      '[]'::jsonb
    ) as variantes
  from marcadas m
  join por_producto pp on pp.id = m.id
  where pp.tiene_5kg
  group by m.id
)
update public.products p
set precios_por_variante = n.variantes
from nuevo n
where n.id = p.id
  and n.variantes is distinct from p.precios_por_variante;

commit;

-- -------------------------------------------------------------
-- 3. Verificacion
-- -------------------------------------------------------------
-- a) Debe dar 0: ninguna variante de 5 kg que no sea bulto.
select count(*) as variantes_5kg_restantes
from public.products p
cross join lateral jsonb_array_elements(p.precios_por_variante) v
where v ->> 'label' ~* '(^|[^0-9.,])5\s*(kg|kilos?)\y'
  and v ->> 'label' !~* 'bulto';

-- b) Debe dar 0: ningun producto con dos variantes 'bolsa' (si el caso b
--    convirtio una caja de 5 kg en un producto que ya tenia bulto).
select p.slug
from public.products p
where (
  select count(*) from jsonb_array_elements(p.precios_por_variante) v
  where v ->> 'id' = 'bolsa'
) > 1;

-- -------------------------------------------------------------
-- Rollback (si hiciera falta)
-- -------------------------------------------------------------
-- update public.products p
-- set precios_por_variante = b.precios_por_variante
-- from public.backup_variantes_5kg b
-- where b.product_id = p.id;
