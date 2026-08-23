-- =============================================================
-- Nutrirse | Seed real de catalogo
-- Requiere que supabase/schema.sql ya este ejecutado.
-- Idempotente: se puede correr las veces que haga falta.
--
-- Estructura de peso por variante:
--   5 kg            ->  5 kg
--   Bolsa cerrada   -> 10 kg
--   +5 bolsas       -> 50 kg (a cotizar, precio null)
-- El peso alimenta el cotizador de /api/shipping.
-- =============================================================

begin;

-- Baja logica del seed de ejemplo del schema (no borra nada cargado a mano).
update public.products
   set activo = false
 where slug in (
   'nuez-mariposa', 'almendra-nonpareil', 'castana-caju',
   'mani-tostado', 'pasa-uva-sultanina', 'ciruela-desc'
 );

insert into public.products
  (slug, nombre, descripcion, imagen_url, categoria, orden, activo, precios_por_variante)
values

('nuez-mariposa-light',
 'Nuez Mariposa Light',
 'Nuez pelada mitad mariposa, color light. Calibre extra, cosecha del año.',
 'https://images.unsplash.com/photo-1590082871875-06428eb31464?w=500',
 'frutos-secos', 1, true,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":45000,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":85000,"peso_kg":10},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":50}]'::jsonb),

('almendra-guara',
 'Almendra Guara',
 'Almendra Guara sin cáscara, origen nacional. Grano parejo y crocante.',
 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500',
 'frutos-secos', 2, true,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":52000,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":98000,"peso_kg":10},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":50}]'::jsonb),

('castanas-caju-w4',
 'Castañas de Cajú W4',
 'Cajú entero calibre W4, tostado natural sin sal. Alta rotación en góndola.',
 'https://images.unsplash.com/photo-1627993427389-bb01c37c2299?w=500',
 'frutos-secos', 3, true,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":60000,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":115000,"peso_kg":10},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":50}]'::jsonb),

('mix-tropical',
 'Mix Tropical',
 'Mezcla de frutas desecadas tropicales y frutos secos. Listo para fraccionar.',
 'https://images.unsplash.com/photo-1599577180579-24231b539da6?w=500',
 'mixes', 4, true,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":28000,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":52000,"peso_kg":10},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":50}]'::jsonb),

('pasas-uva-morocha',
 'Pasas de Uva Morocha',
 'Pasa morocha sin semilla, húmeda y flexible. Ideal panificación y repostería.',
 'https://images.unsplash.com/photo-1604924760233-255e2d83296c?w=500',
 'secos', 5, true,
 '[{"id":"5kg","label":"5 kg","tipo":"precio","precio":15000,"peso_kg":5},
   {"id":"bolsa","label":"Bolsa cerrada","tipo":"precio","precio":28000,"peso_kg":10},
   {"id":"mayorista","label":"Más de 5 bolsas (Consultar)","tipo":"consultar","precio":null,"peso_kg":50}]'::jsonb)

on conflict (slug) do update set
  nombre               = excluded.nombre,
  descripcion          = excluded.descripcion,
  imagen_url           = excluded.imagen_url,
  categoria            = excluded.categoria,
  orden                = excluded.orden,
  activo               = excluded.activo,
  precios_por_variante = excluded.precios_por_variante;

commit;

-- Verificacion rapida
-- select slug, nombre, categoria,
--        precios_por_variante -> 0 ->> 'precio' as precio_5kg
--   from public.products where activo order by orden;
