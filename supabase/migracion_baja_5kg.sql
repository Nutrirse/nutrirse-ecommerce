-- =============================================================
-- Nutrirse | Migracion: baja de la presentacion de 5 kg (mayorista)
-- Ejecutar en Supabase > SQL Editor. Es idempotente.
--
-- La venta mayorista pasa a ser solo por bulto cerrado (o volumen). Las
-- variantes no viven en una tabla propia: son elementos del jsonb
-- `products.precios_por_variante`, asi que se quitan del array y no se
-- borran filas.
--
-- Criterio: el label es una presentacion de 5 kg exactos ("5 kg",
-- "Bolsa 5 kg", "Caja 5 kilos"). El regex NO toca "Bolsa 25 kg", "2.5 kg"
-- ni "+5 bultos (Consultar)": el 5 no puede venir pegado a otro digito,
-- a un punto o a una coma, y tiene que ir seguido de kg/kilo(s).
--
-- No se toca `precios_minoristas` (1/2 kg y 1 kg del canal minorista).
-- =============================================================

-- -------------------------------------------------------------
-- 0. Vista previa (correr sola primero para revisar)
-- -------------------------------------------------------------
-- select p.slug, v ->> 'id' as id, v ->> 'label' as label, v ->> 'precio' as precio
-- from public.products p
-- cross join lateral jsonb_array_elements(p.precios_por_variante) v
-- where v ->> 'label' ~* '(^|[^0-9.,])5\s*(kg|kilos?)\y'
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

insert into public.backup_variantes_5kg (product_id, precios_por_variante)
select p.id, p.precios_por_variante
from public.products p
where exists (
  select 1 from jsonb_array_elements(p.precios_por_variante) v
  where v ->> 'label' ~* '(^|[^0-9.,])5\s*(kg|kilos?)\y'
)
on conflict (product_id) do nothing;  -- re-ejecutar no pisa el backup original

-- El backup no tiene que ser legible con la anon key.
alter table public.backup_variantes_5kg enable row level security;

-- -------------------------------------------------------------
-- 2. Quitar las variantes de 5 kg
-- -------------------------------------------------------------
-- Se saltean los productos que quedarian sin ninguna variante con precio
-- (la de 5 kg era la unica): ocultarlos o vaciarlos es decision comercial,
-- se listan en el paso 3 para resolverlos a mano desde el admin.
with limpio as (
  select
    p.id,
    coalesce(
      jsonb_agg(v order by ord) filter (
        where not (v ->> 'label' ~* '(^|[^0-9.,])5\s*(kg|kilos?)\y')
      ),
      '[]'::jsonb
    ) as variantes
  from public.products p
  cross join lateral jsonb_array_elements(p.precios_por_variante) with ordinality as e(v, ord)
  group by p.id
)
update public.products p
set precios_por_variante = l.variantes
from limpio l
where l.id = p.id
  and l.variantes is distinct from p.precios_por_variante
  and exists (
    select 1 from jsonb_array_elements(l.variantes) v where v ->> 'tipo' = 'precio'
  );

commit;

-- -------------------------------------------------------------
-- 3. Verificacion
-- -------------------------------------------------------------
-- Debe listar SOLO productos que quedaron sin tocar porque la de 5 kg era
-- su unica presentacion con precio. Si no devuelve filas, limpieza completa.
select p.slug, p.nombre, p.precios_por_variante
from public.products p
where exists (
  select 1 from jsonb_array_elements(p.precios_por_variante) v
  where v ->> 'label' ~* '(^|[^0-9.,])5\s*(kg|kilos?)\y'
);

-- -------------------------------------------------------------
-- Rollback (si hiciera falta)
-- -------------------------------------------------------------
-- update public.products p
-- set precios_por_variante = b.precios_por_variante
-- from public.backup_variantes_5kg b
-- where b.product_id = p.id;
