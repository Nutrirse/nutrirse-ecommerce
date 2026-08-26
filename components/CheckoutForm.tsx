'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/store/cart';
import { formatARS } from '@/lib/format';
import {
  buildTicket,
  buildWhatsAppUrl,
  calcularTotales,
  METODOS_PAGO,
} from '@/lib/whatsapp';
import ShippingCalculator from './ShippingCalculator';
import type { Customer, MetodoPago } from '@/types';

const EMPTY: Customer = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  cp: '',
  provincia: '',
  ciudad: '',
  direccion: '',
  altura: '',
  piso: '',
  indicaciones: '',
  metodoPago: 'transferencia',
};

type Errors = Partial<Record<keyof Customer, string>>;

function validar(c: Customer, requiereEnvio: boolean): Errors {
  const e: Errors = {};
  if (c.nombre.trim().length < 2) e.nombre = 'Ingresá tu nombre.';
  if (c.apellido.trim().length < 2) e.apellido = 'Ingresá tu apellido.';
  if (!/^\d{7,11}$/.test(c.dni.replace(/\D/g, ''))) e.dni = 'DNI o CUIT sin puntos ni guiones.';
  if (c.telefono.replace(/\D/g, '').length < 8) e.telefono = 'Teléfono inválido.';
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) e.email = 'Email inválido.';

  // Con retiro en depósito no hace falta el domicilio de entrega.
  if (requiereEnvio) {
    if (c.cp.trim().length < 4) e.cp = 'Código postal requerido.';
    if (c.provincia.trim().length < 3) e.provincia = 'Provincia requerida.';
    if (c.ciudad.trim().length < 2) e.ciudad = 'Ciudad requerida.';
    if (c.direccion.trim().length < 3) e.direccion = 'Calle requerida.';
    if (c.altura.trim().length < 1) e.altura = 'Altura requerida.';
  }
  return e;
}

export default function CheckoutForm() {
  const { items, shipping, cp, setCp, clear } = useCart();

  const [customer, setCustomer] = useState<Customer>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [enviado, setEnviado] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // El CP del cotizador de envío y el del formulario son el mismo dato.
  useEffect(() => {
    if (cp && !customer.cp) setCustomer((c) => ({ ...c, cp }));
  }, [cp, customer.cp]);

  const t = useMemo(
    () => calcularTotales(items, shipping, customer.metodoPago),
    [items, shipping, customer.metodoPago]
  );

  const set =
    (k: keyof Customer) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setCustomer((c) => ({ ...c, [k]: value }));
      if (k === 'cp') setCp(value);
      setErrors((prev) => ({ ...prev, [k]: undefined }));
    };

  const ticket = useMemo(
    () => buildTicket({ customer, items, shipping, nota: customer.indicaciones || undefined }),
    [customer, items, shipping]
  );

  const confirmar = () => {
    const e = validar(customer, t.metodo.requiereEnvio);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document.querySelector<HTMLElement>('[data-error="true"]')?.focus();
      return;
    }
    window.open(buildWhatsAppUrl(ticket), '_blank', 'noopener,noreferrer');
    setEnviado(true);
  };

  if (!mounted) return <div className="mt-10 h-64 animate-pulse rounded-2xl bg-white" />;

  if (items.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-gray-100 bg-white p-12 text-center">
        <p className="text-gray-500">Tu pedido está vacío.</p>
        <Link
          href="/productos"
          className="mt-5 inline-flex items-center rounded-lg bg-[#28a745] px-7 py-3 text-sm font-bold uppercase tracking-wide text-white"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_400px]">
      {/* ================= Columna izquierda: formulario ================= */}
      <div className="space-y-6">
        {/* ---------- 1. Datos personales ---------- */}
        <Bloque numero={1} titulo="Datos personales">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" error={errors.nombre}>
              <input
                value={customer.nombre}
                onChange={set('nombre')}
                autoComplete="given-name"
                data-error={!!errors.nombre}
                className={input(errors.nombre)}
              />
            </Field>
            <Field label="Apellido" error={errors.apellido}>
              <input
                value={customer.apellido}
                onChange={set('apellido')}
                autoComplete="family-name"
                data-error={!!errors.apellido}
                className={input(errors.apellido)}
              />
            </Field>
            <Field label="DNI / CUIT" error={errors.dni} hint="Sin puntos ni guiones">
              <input
                value={customer.dni}
                onChange={set('dni')}
                inputMode="numeric"
                data-error={!!errors.dni}
                className={input(errors.dni)}
              />
            </Field>
            <Field label="Teléfono / WhatsApp" error={errors.telefono}>
              <input
                type="tel"
                value={customer.telefono}
                onChange={set('telefono')}
                autoComplete="tel"
                placeholder="387 411 2233"
                data-error={!!errors.telefono}
                className={input(errors.telefono)}
              />
            </Field>
            <Field label="Email (opcional)" error={errors.email} className="sm:col-span-2">
              <input
                type="email"
                value={customer.email}
                onChange={set('email')}
                autoComplete="email"
                data-error={!!errors.email}
                className={input(errors.email)}
              />
            </Field>
          </div>
        </Bloque>

        {/* ---------- 2. Datos de envío ---------- */}
        <Bloque
          numero={2}
          titulo="Datos de envío"
          subtitulo={
            t.metodo.requiereEnvio
              ? 'Despachamos desde Salta Capital.'
              : 'Elegiste retiro en depósito: no necesitás cargar domicilio.'
          }
        >
          {t.metodo.requiereEnvio ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Código postal" error={errors.cp}>
                  <input
                    value={customer.cp}
                    onChange={set('cp')}
                    autoComplete="postal-code"
                    data-error={!!errors.cp}
                    className={input(errors.cp)}
                  />
                </Field>
                <Field label="Provincia" error={errors.provincia}>
                  <input
                    value={customer.provincia}
                    onChange={set('provincia')}
                    autoComplete="address-level1"
                    data-error={!!errors.provincia}
                    className={input(errors.provincia)}
                  />
                </Field>
                <Field label="Ciudad" error={errors.ciudad} className="sm:col-span-2">
                  <input
                    value={customer.ciudad}
                    onChange={set('ciudad')}
                    autoComplete="address-level2"
                    data-error={!!errors.ciudad}
                    className={input(errors.ciudad)}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_120px_140px]">
                <Field label="Dirección" error={errors.direccion}>
                  <input
                    value={customer.direccion}
                    onChange={set('direccion')}
                    autoComplete="address-line1"
                    placeholder="Calle"
                    data-error={!!errors.direccion}
                    className={input(errors.direccion)}
                  />
                </Field>
                <Field label="Altura" error={errors.altura}>
                  <input
                    value={customer.altura}
                    onChange={set('altura')}
                    inputMode="numeric"
                    data-error={!!errors.altura}
                    className={input(errors.altura)}
                  />
                </Field>
                <Field label="Piso / Dpto">
                  <input
                    value={customer.piso}
                    onChange={set('piso')}
                    placeholder="Opcional"
                    className={input()}
                  />
                </Field>
              </div>

              <Field label="Indicaciones adicionales" className="mt-4">
                <textarea
                  value={customer.indicaciones}
                  onChange={set('indicaciones')}
                  rows={3}
                  placeholder="Horario de recepción, referencias, transporte propio…"
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus:border-[#28a745] focus:ring-2 focus:ring-[#28a745]/25"
                />
              </Field>

              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Costo de envío
                </p>
                <ShippingCalculator compact />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-5 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Retiro en depósito</p>
              <p className="mt-1">Salta Capital, CP 4400. Coordinamos el turno por WhatsApp.</p>
            </div>
          )}
        </Bloque>

        {/* ---------- 3. Método de pago ---------- */}
        <Bloque numero={3} titulo="Método de pago">
          <div className="space-y-3" role="radiogroup" aria-label="Método de pago">
            {METODOS_PAGO.map((m) => {
              const activo = customer.metodoPago === m.id;
              return (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    activo
                      ? 'border-[#28a745] bg-[#28a745]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="metodo-pago"
                    checked={activo}
                    onChange={() =>
                      setCustomer((c) => ({ ...c, metodoPago: m.id as MetodoPago }))
                    }
                    className="mt-0.5 h-4 w-4 accent-[#28a745]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{m.label}</span>
                    <span className="block text-xs text-gray-500">{m.detalle}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </Bloque>
      </div>

      {/* ================= Columna derecha: resumen sticky ================= */}
      <aside className="lg:sticky lg:top-28">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-black">
            Resumen del pedido
          </h2>

          <ul className="mt-5 space-y-4 border-b border-gray-100 pb-5">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                  {i.imagen_url ? (
                    <Image
                      src={i.imagen_url}
                      alt={i.nombre}
                      fill
                      sizes="56px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-xl text-gray-200">
                      {i.nombre.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{i.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {i.variantLabel} × {i.cantidad}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-gray-900">
                  {i.tipo === 'consultar'
                    ? 'A Consultar'
                    : formatARS((i.precio ?? 0) * i.cantidad)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 text-sm">
            <Row label="Subtotal" value={formatARS(t.subtotal)} />
            {t.descuento > 0 && (
              <Row
                label={`Descuento ${Math.round(t.metodo.descuento * 100)} %`}
                value={`-${formatARS(t.descuento)}`}
                acento
              />
            )}
            <Row label="Peso" value={`${t.peso} kg`} />
            <Row
              label="Envío"
              value={
                !t.metodo.requiereEnvio
                  ? 'Retiro'
                  : t.envioBonificado
                    ? 'Gratis'
                    : shipping
                      ? formatARS(t.envio)
                      : 'a calcular'
              }
              acento={t.envioBonificado}
            />
          </dl>

          {/* Empuje al envio gratis. Solo con envio a domicilio y si falta poco. */}
          {t.metodo.requiereEnvio && t.faltaParaEnvioGratis > 0 && (
            <p className="mt-3 rounded-lg bg-[#28a745]/8 px-3 py-2 text-[11px] leading-relaxed text-[#218838]">
              Te faltan <strong>{formatARS(t.faltaParaEnvioGratis)}</strong> en productos para
              que el envío sea gratis.
            </p>
          )}

          <div className="mt-5 flex items-baseline justify-between border-t border-gray-100 pt-5">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-3xl font-bold text-black">{formatARS(t.total)}</span>
          </div>

          {t.hayConsultar && (
            <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
              Incluye ítems por volumen a cotizar: el total puede variar.
            </p>
          )}

          <button
            onClick={confirmar}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#28a745] py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#218838] active:scale-[0.99]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22z" />
            </svg>
            Confirmar pedido por WhatsApp
          </button>

          {enviado && (
            <button
              onClick={() => {
                clear();
                setEnviado(false);
              }}
              className="mt-2.5 w-full rounded-lg border border-gray-200 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              Vaciar pedido
            </button>
          )}

          <p className="mt-3 text-center text-[11px] text-gray-400">
            No se procesan pagos en el sitio
          </p>
        </div>

        <details className="mt-4 rounded-2xl border border-gray-100 bg-white p-5">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Ver el mensaje que se envía
          </summary>
          <pre className="thin-scroll mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 text-xs leading-relaxed text-gray-600">
            {ticket}
          </pre>
        </details>
      </aside>
    </div>
  );
}

/* ---------------------------- helpers de UI ---------------------------- */

const input = (error?: string) =>
  `h-11 w-full rounded-lg border bg-white px-4 text-sm text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus:ring-2 ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-200 focus:border-[#28a745] focus:ring-[#28a745]/25'
  }`;

function Bloque({
  numero,
  titulo,
  subtitulo,
  children,
}: {
  numero: number;
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <header className="mb-6 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#28a745] text-xs font-bold text-white">
          {numero}
        </span>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-black">
            {titulo}
          </h2>
          {subtitulo && <p className="mt-0.5 text-sm text-gray-500">{subtitulo}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  className = '',
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>
      )}
    </label>
  );
}

function Row({ label, value, acento }: { label: string; value: string; acento?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`font-medium ${acento ? 'text-[#28a745]' : 'text-gray-900'}`}>{value}</dd>
    </div>
  );
}
