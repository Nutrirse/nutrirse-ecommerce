-- =============================================================
-- Nutrirse | Migracion: Panel de Balance y CRM (clientes + transacciones)
-- Ejecutar en Supabase > SQL Editor. Es idempotente.
-- =============================================================

-- Solo el panel admin toca estas tablas, y lo hace con la service_role key
-- (ignora RLS). Se activa RLS SIN policies: la anon key del sitio publico
-- no puede leer ni escribir nada de aca.

-- -------------------------------------------------------------
-- Clientes
-- -------------------------------------------------------------
create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (char_length(nombre) between 1 and 160),
  -- Solo digitos, mismo formato que wa.me (ver sanitizeWhatsAppNumber).
  -- Es la llave natural con el checkout de WhatsApp.
  telefono    text check (telefono is null or telefono ~ '^[0-9]{8,15}$'),
  notas       text check (notas is null or char_length(notas) <= 500),
  created_at  timestamptz not null default now()
);

-- Un telefono = un cliente. Parcial: se permiten varios clientes sin telefono.
create unique index if not exists clientes_telefono_uniq
  on public.clientes (telefono) where telefono is not null;

alter table public.clientes enable row level security;

-- -------------------------------------------------------------
-- Transacciones (ingresos y gastos)
-- -------------------------------------------------------------
-- Numeracion de tickets de venta: NUT-000001, NUT-000002...
create sequence if not exists public.ticket_seq;

create table if not exists public.transacciones (
  id                uuid primary key default gen_random_uuid(),
  fecha             date not null default current_date,
  tipo              text not null check (tipo in ('ingreso', 'gasto')),
  cliente_id        uuid references public.clientes (id) on delete set null,
  -- Texto libre: el nombre del cliente o del proveedor tal como se ve en la
  -- grilla. Se guarda aunque haya cliente_id para que borrar un cliente no
  -- deje transacciones sin nombre.
  cliente_proveedor text not null check (char_length(cliente_proveedor) between 1 and 160),
  concepto          text not null check (char_length(concepto) between 1 and 300),
  medio_pago        text not null default 'transferencia'
                    check (medio_pago in ('transferencia', 'efectivo', 'mercadopago', 'tarjeta', 'otro')),
  valor             numeric(14, 2) not null check (valor >= 0),
  estado_pago       text not null default 'pendiente'
                    check (estado_pago in ('completado', 'pendiente', 'consulta')),
  -- Solo los ingresos llevan ticket. La API manda null en los gastos; en
  -- los ingresos omite la columna y toma este default.
  ref_ticket        text unique
                    default ('NUT-' || lpad(nextval('public.ticket_seq')::text, 6, '0')),
  -- Detalle del pedido para el ticket: [{ descripcion, cantidad, precio_unitario }]
  detalle           jsonb not null default '[]'::jsonb check (jsonb_typeof(detalle) = 'array'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists transacciones_fecha_idx on public.transacciones (fecha desc);
create index if not exists transacciones_cliente_idx on public.transacciones (cliente_id);

alter table public.transacciones enable row level security;

create or replace function public.transacciones_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists transacciones_touch on public.transacciones;
create trigger transacciones_touch
  before update on public.transacciones
  for each row execute function public.transacciones_touch();

comment on table public.transacciones is
  'Libro de ingresos y gastos del panel /admin/balance. Solo service_role.';
