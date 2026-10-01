-- =============================================================
-- Canal minorista (B2C) + captura de leads con Google
-- =============================================================
-- Correr despues de migracion_balance.sql (necesita public.clientes).
-- Idempotente: se puede volver a correr sin romper nada.

-- -------------------------------------------------------------
-- Precios minoristas
-- -------------------------------------------------------------
-- Tabla aparte y NO una columna en products: la policy publica de
-- products deja leer cualquier columna con la anon key, y el precio
-- minorista es justamente lo que se esconde a los anonimos.
--
-- `variantes` tiene la misma forma que products.precios_por_variante:
--   [{ "id": "min-500g", "label": "500 g", "tipo": "precio",
--      "precio": 4500, "peso_kg": 0.5 }]
-- Los ids llevan prefijo `min-` para no chocar en el carrito con las
-- variantes mayoristas del mismo producto.
create table if not exists public.precios_minoristas (
  product_id  uuid primary key references public.products (id) on delete cascade,
  variantes   jsonb not null default '[]'::jsonb check (jsonb_typeof(variantes) = 'array'),
  updated_at  timestamptz not null default now()
);

alter table public.precios_minoristas enable row level security;

-- Solo usuarios logueados. El servidor lee con service_role igual, pero
-- esto evita que alguien con la anon key la consulte directo.
drop policy if exists "minoristas_select_authenticated" on public.precios_minoristas;
create policy "minoristas_select_authenticated"
  on public.precios_minoristas for select
  to authenticated
  using (true);

-- -------------------------------------------------------------
-- Leads: clientes que entran con Google
-- -------------------------------------------------------------
alter table public.clientes
  add column if not exists email        text check (email is null or email = lower(email)),
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null,
  add column if not exists origen       text not null default 'admin'
                                        check (origen in ('admin', 'google')),
  add column if not exists acepta_marketing boolean not null default true;

create unique index if not exists clientes_email_uniq
  on public.clientes (email) where email is not null;

-- Alta automatica en el primer login. Va como trigger y no en el callback
-- de Next: si el callback falla o el usuario cierra la pestaña a mitad
-- del redirect, el lead queda registrado igual.
create or replace function public.registrar_lead_google()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email  text := lower(new.email);
  v_nombre text := left(coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(v_email, '@', 1),
    'Cliente'
  ), 160);
begin
  if v_email is null then
    return new;
  end if;

  -- Si el admin ya lo habia cargado a mano con ese email, solo se vincula.
  insert into public.clientes (nombre, email, auth_user_id, origen)
  values (v_nombre, v_email, new.id, 'google')
  on conflict (email) where email is not null
  do update set auth_user_id = excluded.auth_user_id;

  return new;
exception when others then
  -- Nunca bloquear el login por un problema con el CRM.
  raise warning 'registrar_lead_google: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_lead on auth.users;
create trigger on_auth_user_created_lead
  after insert on auth.users
  for each row execute function public.registrar_lead_google();
