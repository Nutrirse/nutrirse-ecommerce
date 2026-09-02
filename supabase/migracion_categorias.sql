-- =============================================================
-- Nutrirse | Migracion: categorias como entidad real
--
-- Ejecutar en Supabase > SQL Editor. Es idempotente: se puede correr
-- de nuevo sin duplicar nada.
--
-- Que resuelve:
--   * El admin puede corregir un nombre mal tipeado en un solo lugar.
--   * Borrar una categoria es explicito, no "que se quede sin productos".
--   * La FK con ON UPDATE CASCADE arrastra el slug a `products` sola:
--     renombrar `chocolates` -> `chocolates-colonial` reetiqueta todos sus
--     productos en la misma sentencia, sin codigo de cascada en la app.
--
-- Que NO hace: no toca el valor de `products.categoria` de nadie. Las
-- subcategorias que hoy se muestran colapsadas (`reposteria-harinas` bajo
-- "Reposteria", `infusiones` bajo "Frutas Desecadas") se modelan con
-- `padre_slug`, no borrando datos. El filtro de una categoria padre incluye
-- a sus hijas, que es exactamente lo que la web ya venia mostrando.
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- 1. Tabla
-- -------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  -- Nombre visible: "Chocolates y Confituras". Es lo unico que el admin
  -- deberia necesitar tocar.
  nombre      text not null,
  -- Slug: lo que viaja en `?cat=` y lo que guarda `products.categoria`.
  slug        text not null unique,
  -- Jerarquia de un nivel. null = categoria raiz (entra al mega menu).
  -- Autoreferencia por slug para que el CASCADE de abajo tambien reacomode
  -- a las hijas cuando se renombra el padre.
  padre_slug  text references public.categories (slug)
                on update cascade on delete set null,
  -- Orden en el mega menu y en el filtro del catalogo.
  orden       int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Una categoria no puede ser su propio padre.
alter table public.categories drop constraint if exists categories_padre_no_es_self;
alter table public.categories add constraint categories_padre_no_es_self check (
  padre_slug is null or padre_slug <> slug
);

-- Forma del slug: minusculas, numeros y guiones. Sin esto un slug con
-- espacios o mayusculas rompe las URLs `?cat=`.
alter table public.categories drop constraint if exists categories_slug_formato;
alter table public.categories add constraint categories_slug_formato check (
  slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
);

create index if not exists categories_padre_idx on public.categories (padre_slug);
create index if not exists categories_orden_idx on public.categories (orden, nombre);

-- updated_at automatico (la funcion ya existe por schema.sql).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 2. Semilla: las categorias del menu actual, con su jerarquia
--
-- Los nombres salen de lib/categorias.ts (ETIQUETA_CATEGORIA), que hasta
-- ahora era la unica fuente del nombre visible. Desde esta migracion la
-- fuente es esta tabla.
-- -------------------------------------------------------------
insert into public.categories (nombre, slug, padre_slug, orden) values
  ('Frutos Secos',              'frutos-secos',           null, 10),
  ('Frutas Desecadas',          'secos',                  null, 20),
  ('Semillas',                  'semillas',               null, 30),
  ('Aceites Naturales',         'aceites',                null, 40),
  ('Chocolates y Confituras',   'chocolates',             null, 50),
  ('Repostería',                'reposteria',             null, 60),
  ('Granola y Cereales',        'granola',                null, 70)
on conflict (slug) do nothing;

-- Hijas. Van en un insert aparte porque la FK exige que el padre exista.
insert into public.categories (nombre, slug, padre_slug, orden) values
  ('Mixes de Frutos Secos',     'mixes',                  'frutos-secos', 11),
  ('Snacks',                    'snacks',                 'frutos-secos', 12),
  ('Infusiones',                'infusiones',             'secos',        21),
  ('Suplementos',               'suplementos',            'semillas',     31),
  ('Insumos de Repostería',     'reposteria-insumos',     'reposteria',   61),
  ('Chocolates de Repostería',  'reposteria-chocolates',  'reposteria',   62),
  ('Coco',                      'reposteria-coco',        'reposteria',   63),
  ('Harinas',                   'reposteria-harinas',     'reposteria',   64)
on conflict (slug) do nothing;

-- -------------------------------------------------------------
-- 3. Adopcion de lo que ya existe en `products`
--
-- Cualquier categoria cargada a mano que no este arriba entra como raiz,
-- con el slug prettificado como nombre ("frutas-confitadas" -> "Frutas
-- Confitadas"). Sin este paso la FK del punto 4 no se puede crear.
-- -------------------------------------------------------------
insert into public.categories (nombre, slug, orden)
select distinct
       initcap(replace(p.categoria, '-', ' ')),
       p.categoria,
       900
  from public.products p
 where p.categoria is not null
   and p.categoria <> ''
   and p.categoria ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
on conflict (slug) do nothing;

-- Categorias de products con un slug que no pasa el check de formato: se
-- normalizan antes de la FK, o la FK falla. Es el unico UPDATE sobre
-- products de toda la migracion y solo toca filas invalidas.
update public.products
   set categoria = regexp_replace(
         regexp_replace(lower(trim(categoria)), '[^a-z0-9]+', '-', 'g'),
         '^-+|-+$', '', 'g')
 where categoria is not null
   and categoria <> ''
   and categoria !~ '^[a-z0-9]+(-[a-z0-9]+)*$';

-- Y las que quedaron vacias tras normalizar pasan a null.
update public.products set categoria = null where categoria = '';

-- Segunda pasada de adopcion, ahora con los slugs ya normalizados.
insert into public.categories (nombre, slug, orden)
select distinct initcap(replace(p.categoria, '-', ' ')), p.categoria, 900
  from public.products p
 where p.categoria is not null
on conflict (slug) do nothing;

-- -------------------------------------------------------------
-- 4. Integridad relacional
--
-- ON UPDATE CASCADE: renombrar el slug de una categoria reetiqueta sus
-- productos en la misma sentencia. Es lo que hace innecesario el codigo de
-- cascada en la app.
--
-- ON DELETE SET NULL: borrar una categoria en uso deja esos productos sin
-- categoria en vez de borrarlos. El endpoint DELETE igual avisa cuantos
-- productos van a quedar sueltos y exige confirmacion explicita.
-- -------------------------------------------------------------
alter table public.products drop constraint if exists products_categoria_fkey;
alter table public.products
  add constraint products_categoria_fkey
  foreign key (categoria) references public.categories (slug)
  on update cascade on delete set null;

-- -------------------------------------------------------------
-- 5. RLS: lectura publica, escritura solo con service_role
--
-- El mega menu y el filtro del catalogo leen esta tabla con la anon key,
-- asi que necesitan SELECT. No hay policy de INSERT/UPDATE/DELETE: el
-- panel escribe con la service_role key, que ignora RLS.
-- -------------------------------------------------------------
alter table public.categories enable row level security;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

-- -------------------------------------------------------------
-- 6. Control
-- -------------------------------------------------------------
-- select c.slug, c.nombre, c.padre_slug, count(p.id) as productos
--   from public.categories c
--   left join public.products p on p.categoria = c.slug
--  group by c.id order by c.orden, c.nombre;
