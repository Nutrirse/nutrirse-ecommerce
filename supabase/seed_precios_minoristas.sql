-- =============================================================
-- Nutrirse | Seed de precios minoristas (lista de precios del cliente)
-- Requiere supabase/migracion_minorista.sql. Idempotente: vuelve a pisar
-- las variantes de cada producto listado con los valores de aca.
--
-- Cada producto se busca primero por slug (el que genera
-- scripts/migrar-productos.mjs) y, si no esta, por un patron sobre el
-- nombre sin tildes. Al final hay un SELECT con los que NO matchearon:
-- revisarlo antes de dar por cargada la lista.
--
-- Para sumar productos: agregar filas al VALUES con el mismo formato.
-- Variantes: ids con prefijo `min-` (no chocan en el carrito con las
-- mayoristas del mismo producto).
-- =============================================================

begin;

create temp table _lista_minorista (
  slug        text not null,
  patron      text not null,   -- ILIKE sobre el nombre en minusculas y sin tildes
  precio_500  integer not null,
  precio_1kg  integer not null
) on commit drop;

insert into _lista_minorista (slug, patron, precio_500, precio_1kg) values
  ('mani-tostado-sin-sal',                       '%mani tostado sin sal%',           2100,  4000),
  ('pasas-morochas-flame-primera-calidad',       '%pasa%flame%',                     2700,  5150),
  ('datil-medjoul-con-carozo',                   '%datil medjoul%con carozo%',      11200, 22000),
  ('nuez-mariposa-chandler-extra-light-mendoza', '%nuez mariposa chandler%light%',   9300, 18500),
  ('almendra-nom-pareil-mediana-grande-chilena', '%almendra no_ pareil%',           16200, 32000),
  ('almendra-guara-mediana',                     '%almendra guara mediana%',        13300, 26500),
  ('castanas-de-caju-w1-mi-brazil',              '%caju w1%',                       10200, 20000);
  -- 'no_ pareil': el cliente escribe "Nom Pareil" y "Non Pareil" indistinto.

create temp table _match on commit drop as
select distinct on (l.slug)
       l.*, p.id as product_id, p.nombre
  from _lista_minorista l
  join public.products p
    on p.slug = l.slug
    or translate(lower(p.nombre), 'áéíóúüñ', 'aeiouun') ilike l.patron
 -- Gana el match por slug; despues, el producto activo.
 order by l.slug, (p.slug = l.slug) desc, p.activo desc, p.orden;

insert into public.precios_minoristas (product_id, variantes, updated_at)
select product_id,
       jsonb_build_array(
         jsonb_build_object('id', 'min-500g', 'label', '1/2 kg', 'tipo', 'precio',
                            'precio', precio_500, 'peso_kg', 0.5),
         jsonb_build_object('id', 'min-1kg',  'label', '1 kg',   'tipo', 'precio',
                            'precio', precio_1kg, 'peso_kg', 1)
       ),
       now()
  from _match
on conflict (product_id) do update
   set variantes  = excluded.variantes,
       updated_at = now();

-- Cargados
select m.nombre, m.precio_500, m.precio_1kg from _match m order by m.nombre;

-- Sin producto en la base: corregir slug/patron o cargar el producto.
select l.slug, l.patron
  from _lista_minorista l
 where not exists (select 1 from _match m where m.slug = l.slug);

commit;
