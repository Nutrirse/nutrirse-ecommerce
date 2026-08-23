-- =============================================================
-- Nutrirse | Esquema B2B mayorista
-- Ejecutar en Supabase > SQL Editor
-- =============================================================

create extension if not exists "pgcrypto";

-- Tipos de variante soportados:
--   'precio'    -> tiene precio numerico visible
--   'consultar' -> sin precio, se cotiza por WhatsApp
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  nombre        text not null,
  descripcion   text,
  imagen_url    text,
  categoria     text,
  -- precios_por_variante:
  -- [
  --   { "id": "5kg",       "label": "5 kg",                    "tipo": "precio",    "precio": 18500, "peso_kg": 5 },
  --   { "id": "bolsa",     "label": "Bolsa cerrada",           "tipo": "precio",    "precio": 82000, "peso_kg": 25 },
  --   { "id": "mayorista", "label": "Más de 5 bolsas (Consultar)", "tipo": "consultar", "precio": null,  "peso_kg": 125 }
  -- ]
  precios_por_variante jsonb not null default '[]'::jsonb,
  activo        boolean not null default true,
  orden         int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists products_activo_orden_idx on public.products (activo, orden);
create index if not exists products_categoria_idx     on public.products (categoria);
create index if not exists products_variantes_gin_idx on public.products using gin (precios_por_variante);

-- Validacion de forma del jsonb
alter table public.products drop constraint if exists products_variantes_shape;
alter table public.products add constraint products_variantes_shape check (
  jsonb_typeof(precios_por_variante) = 'array'
);

-- updated_at automatico
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- RLS: catalogo publico de solo lectura
alter table public.products enable row level security;

drop policy if exists "public read active products" on public.products;
create policy "public read active products"
  on public.products for select
  to anon, authenticated
  using (activo = true);

-- =============================================================
-- Seed de ejemplo (frutos secos, precios ARS de referencia)
-- =============================================================
insert into public.products (slug, nombre, descripcion, imagen_url, categoria, orden, precios_por_variante)
values
('nuez-mariposa', 'Nuez Mariposa', 'Nuez pelada mitad mariposa, calibre extra. Cosecha reciente.', null, 'frutos-secos', 1,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":52000,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":238000,"peso_kg":25},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":125}]'::jsonb),

('almendra-nonpareil', 'Almendra Nonpareil', 'Almendra californiana sin cáscara, calibre 23/25.', null, 'frutos-secos', 2,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":61000,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":285000,"peso_kg":25},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":125}]'::jsonb),

('castana-caju', 'Castaña de Cajú W320', 'Cajú entero W320 tostado natural, origen Brasil.', null, 'frutos-secos', 3,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":78000,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":365000,"peso_kg":25},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":125}]'::jsonb),

('mani-tostado', 'Maní Tostado Pelado', 'Maní tipo runner tostado sin sal, alta rotación.', null, 'frutos-secos', 4,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":14500,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":66000,"peso_kg":25},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":125}]'::jsonb),

('pasa-uva-sultanina', 'Pasa de Uva Sultanina', 'Pasa sultanina sin semilla, húmeda, San Juan.', null, 'secos', 5,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":19800,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":91000,"peso_kg":25},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":125}]'::jsonb),

('ciruela-desc', 'Ciruela Desecada s/carozo', 'Ciruela D''Agen sin carozo, calibre 60/70.', null, 'secos', 6,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":24500,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":112000,"peso_kg":25},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":125}]'::jsonb)
on conflict (slug) do nothing;
