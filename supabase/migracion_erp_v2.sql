-- =============================================================
-- Nutrirse | Migracion: ERP v2 (CRM con DNI/CUIT y numero de cliente,
-- pago parcial / sena en transacciones)
-- Correr despues de migracion_balance.sql. Es idempotente.
-- =============================================================

-- -------------------------------------------------------------
-- Clientes: documento + numero de referencia CLI-0001
-- -------------------------------------------------------------
create sequence if not exists public.cliente_seq;

alter table public.clientes
  add column if not exists documento text
    check (documento is null or documento ~ '^[0-9]{7,11}$');

-- Default volatil: al agregar la columna Postgres lo evalua fila por fila,
-- asi que los clientes existentes (incluidos los leads de Google) tambien
-- reciben su numero.
alter table public.clientes
  add column if not exists ref_cliente text unique
    default ('CLI-' || lpad(nextval('public.cliente_seq')::text, 4, '0'));

-- -------------------------------------------------------------
-- Transacciones: estado "parcial" + monto entregado a cuenta
-- -------------------------------------------------------------
alter table public.transacciones
  drop constraint if exists transacciones_estado_pago_check;
alter table public.transacciones
  add constraint transacciones_estado_pago_check
    check (estado_pago in ('completado', 'pendiente', 'parcial', 'consulta'));

alter table public.transacciones
  add column if not exists monto_entregado numeric(14, 2)
    check (monto_entregado is null or monto_entregado >= 0);

-- Solo un pago parcial lleva sena, y nunca supera el total.
alter table public.transacciones
  drop constraint if exists transacciones_parcial_check;
alter table public.transacciones
  add constraint transacciones_parcial_check
    check (
      (estado_pago = 'parcial' and monto_entregado is not null and monto_entregado <= valor)
      or (estado_pago <> 'parcial' and monto_entregado is null)
    );

-- Las lineas de `detalle` suman `unidad` ('kg' | 'gr' | 'ml' | 'unidad' |
-- 'bulto'). Es jsonb: no hace falta cambiar la columna.
