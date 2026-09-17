-- =============================================================
-- Nutrirse | Carga inicial de `composicion` en los Mixes
-- Requiere haber corrido antes supabase/migracion_composicion.sql
-- Ejecutar en Supabase > SQL Editor. Es idempotente (reescribe el valor).
-- =============================================================

-- Los patrones evitan la vocal acentuada ("Amaz%nico", "Cl%sico") porque
-- ILIKE ignora mayusculas pero NO acentos: si una fila se cargo como
-- "Mix Clasico" un patron con tilde no la encontraria.
--
-- El `and categoria = 'mixes'` acota el blast radius: sin eso, un producto
-- nuevo que se llame "Mix Premium de Almendras" se comeria la composicion
-- del mix de frutos secos.

update public.products set composicion =
  'Nuez mariposa, castañas de cajú, chips de banana, pasas de uva s/semilla, pasas de uva rubia s/semilla, maní tostado'
 where nombre ilike '%Mix%Cl%sico%' and categoria = 'mixes';

update public.products set composicion =
  'Nuez mariposa, almendra Nonpareil, chips de banana, pasas de uva s/semilla, pasas de uva rubia s/semilla, maní tostado'
 where nombre ilike '%Mix%Deportivo%' and categoria = 'mixes';

update public.products set composicion =
  'Nuez mariposa, almendra Nonpareil, castaña de cajú, pasas de uva morocha s/semilla'
 where nombre ilike '%Mix%Tradicional%' and categoria = 'mixes';

update public.products set composicion =
  'Nuez mariposa, almendra Nonpareil, chips de banana, pasas de uva morocha, maní tostado, ananá en cubos'
 where nombre ilike '%Mix%Tropical%' and categoria = 'mixes';

update public.products set composicion =
  'Nuez mariposa, almendra Nonpareil, castaña de cajú, avellana'
 where nombre ilike '%Mix%Premium%' and categoria = 'mixes';

update public.products set composicion =
  'Nuez mariposa, almendra Nonpareil, castaña de cajú, pasas de uva rubia s/semilla, pasas de arándano, coco en escamas'
 where nombre ilike '%Mix%Patag%nico%' and categoria = 'mixes';

update public.products set composicion =
  'Almendra amazónica, banana, pasas morochas s/semilla, maní, girasol'
 where nombre ilike '%Mix%Amaz%nico%' and categoria = 'mixes';

-- Control: las 7 filas tienen que salir con texto. Si alguna aparece en
-- null, el nombre o la categoria de esa fila no coinciden con el patron.
select nombre, categoria, composicion
  from public.products
 where categoria = 'mixes'
 order by nombre;
