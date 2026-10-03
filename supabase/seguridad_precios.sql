-- =============================================================
-- Nutrirse | Seguridad: precios fuera de la API publica
-- Ejecutar en Supabase > SQL Editor. Idempotente.
--
-- Problema: la anon key viaja en el JS del sitio (NEXT_PUBLIC_...), y con
-- ella cualquiera podia pedir a la API REST/GraphQL de Supabase
--   GET /rest/v1/products?select=precios_por_variante
-- y llevarse la lista de precios mayorista entera, con o sin sesion.
--
-- Solucion: privilegios POR COLUMNA. Los roles publicos (anon y
-- authenticated) pueden leer todas las columnas de products MENOS
-- precios_por_variante. Las filas siguen filtradas por la policy RLS
-- "public read active products" (activo = true).
--
-- El sitio lee los precios desde el servidor con la service_role key
-- (lib/products.ts), que no depende de estos grants, y los entrega en null
-- a quien no tiene sesion (lib/catalogo.ts). El panel /admin usa
-- service_role en todas sus rutas: no se ve afectado.
--
-- `authenticated` tambien queda sin la columna: un cliente logueado con
-- Google no tiene por que poder bajar la lista cruda por la API; los
-- precios le llegan por la web, filtrados por el servidor.
--
-- IMPORTANTE: desplegar primero el codigo que lee con service_role (o
-- tener SUPABASE_SERVICE_ROLE_KEY configurada en Vercel). Si no, el
-- catalogo se muestra sin presentaciones hasta que este la key.
-- =============================================================

begin;

-- 1) Sacar todo privilegio de tabla a los roles publicos. Un GRANT de
--    tabla le gana a cualquier restriccion por columna, asi que hay que
--    revocarlo entero. Escritura ya estaba bloqueada por RLS (no hay
--    policies de insert/update/delete), esto lo hace explicito.
revoke all on table public.products from anon, authenticated;

-- 2) Devolver SELECT columna por columna, todas menos los precios. Se
--    arma desde el catalogo del sistema para no olvidar columnas que
--    agregaron migraciones (imagenes, composicion, nota_venta, ...).
do $$
declare
  columnas text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into columnas
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'products'
     and column_name <> 'precios_por_variante';

  execute format('grant select (%s) on table public.products to anon, authenticated', columnas);
end $$;

-- 3) service_role conserva todo (admin + lectura de precios del servidor).
grant all on table public.products to service_role;

commit;

-- Nota: una columna que se agregue a products en el futuro NO queda
-- visible para anon/authenticated hasta volver a correr este script. Es el
-- default seguro; si la columna es publica, re-ejecutarlo.

-- -------------------------------------------------------------
-- Verificacion (debe dar: false, true, true)
-- -------------------------------------------------------------
select
  has_column_privilege('anon', 'public.products', 'precios_por_variante', 'select') as anon_ve_precios,
  has_column_privilege('anon', 'public.products', 'nombre', 'select')               as anon_ve_nombre,
  has_column_privilege('service_role', 'public.products', 'precios_por_variante', 'select') as server_ve_precios;
