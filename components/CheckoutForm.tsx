'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  useCart,
  selectSubtotal,
  selectPesoTotal,
  selectTieneConsultar,
} from '@/store/cart';
import { formatARS } from '@/lib/format';
import { buildTicket, buildWhatsAppUrl } from '@/lib/whatsapp';
import ShippingCalculator from './ShippingCalculator';
import type { Customer } from '@/types';

const EMPTY: Customer = {
  nombre: '',
  email: '',
  telefono: '',
  dni: '',
  cp: '',
  localidad: '',
  direccion: '',
};

type Errors = Partial<Record<keyof Customer, string>>;

function validar(c: Customer): Errors {
  const e: Errors = {};
  if (c.nombre.trim().length < 3) e.nombre = 'Ingresá nombre y apellido o razón social.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) e.email = 'Email inválido.';
  if (c.telefono.replace(/\D/g, '').length < 8) e.telefono = 'Teléfono inválido.';
  if (!/^\d{7,11}$/.test(c.dni.replace(/\D/g, ''))) e.dni = 'DNI o CUIT sin puntos ni guiones.';
  if (c.cp.trim().length < 4) e.cp = 'Código postal requerido.';
  if (c.localidad.trim().length < 2) e.localidad = 'Localidad requerida.';
  if (c.direccion.trim().length < 5) e.direccion = 'Dirección requerida.';
  return e;
}

export default function CheckoutForm() {
  const { items, shipping, cp, setCp, clear } = useCart();
  const subtotal = useCart(selectSubtotal);
  const peso = useCart(selectPesoTotal);
  const hayConsultar = useCart(selectTieneConsultar);

  const [customer, setCustomer] = useState<Customer>(EMPTY);
  const [nota, setNota] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [enviado, setEnviado] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // El CP del calculador de envío y el del formulario son el mismo dato.
  useEffect(() => {
    if (cp && !customer.cp) setCustomer((c) => ({ ...c, cp }));
  }, [cp, customer.cp]);

  const total = subtotal + (shipping?.price ?? 0);

  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomer((c) => ({ ...c, [k]: value }));
    if (k === 'cp') setCp(value);
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const ticket = useMemo(
    () => buildTicket({ customer, items, shipping, nota: nota.trim() || undefined }),
    [customer, items, shipping, nota]
  );

  const enviar = () => {
    const e = validar(customer);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document.querySelector<HTMLElement>('[data-error="true"]')?.focus();
      return;
    }
    window.open(buildWhatsAppUrl(ticket), '_blank', 'noopener,noreferrer');
    setEnviado(true);
  };

  if (!mounted) return <div className="mt-10 h-64 animate-pulse rounded-2xl bg-hueso" />;

  if (items.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-black/5 bg-hueso p-10 text-center">
        <p className="text-humo">Tu pedido está vacío.</p>
        <Link
          href="/#catalogo"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-carbon px-6 text-sm font-medium text-hueso"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      {/* ---------- Datos del cliente ---------- */}
      <section className="rounded-2xl border border-black/5 bg-hueso p-6 sm:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-carbon">
          Datos de facturación y entrega
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre / Razón social" error={errors.nombre} className="sm:col-span-2">
            <input
              value={customer.nombre}
              onChange={set('nombre')}
              autoComplete="name"
              data-error={!!errors.nombre}
              className={inputCls(errors.nombre)}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={customer.email}
              onChange={set('email')}
              autoComplete="email"
              data-error={!!errors.email}
              className={inputCls(errors.email)}
            />
          </Field>

          <Field label="Teléfono" error={errors.telefono}>
            <input
              type="tel"
              value={customer.telefono}
              onChange={set('telefono')}
              autoComplete="tel"
              placeholder="387 411 2233"
              data-error={!!errors.telefono}
              className={inputCls(errors.telefono)}
            />
          </Field>

          <Field label="DNI / CUIT" error={errors.dni}>
            <input
              value={customer.dni}
              onChange={set('dni')}
              inputMode="numeric"
              placeholder="Sin puntos ni guiones"
              data-error={!!errors.dni}
              className={inputCls(errors.dni)}
            />
          </Field>

          <Field label="Código postal" error={errors.cp}>
            <input
              value={customer.cp}
              onChange={set('cp')}
              autoComplete="postal-code"
              data-error={!!errors.cp}
              className={inputCls(errors.cp)}
            />
          </Field>

          <Field label="Localidad / Provincia" error={errors.localidad} className="sm:col-span-2">
            <input
              value={customer.localidad}
              onChange={set('localidad')}
              autoComplete="address-level2"
              data-error={!!errors.localidad}
              className={inputCls(errors.localidad)}
            />
          </Field>

          <Field label="Dirección" error={errors.direccion} className="sm:col-span-2">
            <input
              value={customer.direccion}
              onChange={set('direccion')}
              autoComplete="street-address"
              placeholder="Calle, número, piso/depto"
              data-error={!!errors.direccion}
              className={inputCls(errors.direccion)}
            />
          </Field>

          <Field label="Nota (opcional)" className="sm:col-span-2">
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={3}
              placeholder="Horario de recepción, transporte propio, etc."
              className="w-full resize-none rounded-xl border border-black/10 bg-crema px-4 py-3 text-sm outline-none transition-colors focus:border-carbon"
            />
          </Field>
        </div>

        <div className="mt-8 border-t border-black/5 pt-6" id="envios">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-carbon">
            Método de envío
          </h3>
          <p className="mt-1 text-sm text-humo">Cotización desde Salta sobre {peso} kg.</p>
          <ShippingCalculator compact />
        </div>
      </section>

      {/* ---------- Resumen ---------- */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-black/5 bg-hueso p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-carbon">
            Resumen
          </h2>

          <ul className="mt-5 space-y-3 border-b border-black/5 pb-5">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate text-carbon">{i.nombre}</span>
                  <span className="text-xs text-humo">
                    {i.variantLabel} × {i.cantidad}
                  </span>
                </span>
                <span className="shrink-0 font-medium text-carbon">
                  {i.tipo === 'consultar' ? 'a cotizar' : formatARS((i.precio ?? 0) * i.cantidad)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 text-sm">
            <Row label="Subtotal" value={formatARS(subtotal)} />
            <Row label="Peso" value={`${peso} kg`} />
            <Row label="Envío" value={shipping ? formatARS(shipping.price) : 'a calcular'} />
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-black/5 pt-5">
            <span className="text-sm text-humo">Total estimado</span>
            <span className="font-[family-name:var(--font-display)] text-3xl font-semibold text-nuez">
              {formatARS(total)}
            </span>
          </div>

          {hayConsultar && (
            <p className="mt-2 text-xs text-humo">
              Hay ítems por volumen a cotizar; el total puede variar.
            </p>
          )}

          <button
            onClick={enviar}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-sm font-semibold text-[#0B3D25] transition-transform hover:scale-[1.02] active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22z" />
            </svg>
            Enviar pedido por WhatsApp
          </button>

          {enviado && (
            <button
              onClick={() => {
                clear();
                setEnviado(false);
              }}
              className="mt-3 w-full rounded-full border border-black/10 py-2.5 text-sm text-humo transition-colors hover:bg-crema"
            >
              Vaciar pedido
            </button>
          )}

          <p className="mt-3 text-center text-xs text-humo">
            No se procesan pagos en el sitio.
          </p>
        </div>

        <details className="mt-4 rounded-2xl border border-black/5 bg-hueso p-5">
          <summary className="cursor-pointer text-sm font-medium text-carbon">
            Ver ticket que se envía
          </summary>
          <pre className="thin-scroll mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-crema p-4 text-xs leading-relaxed text-humo">
            {ticket}
          </pre>
        </details>
      </aside>
    </div>
  );
}

/* ---------- helpers de UI ---------- */

const inputCls = (error?: string) =>
  `h-11 w-full rounded-xl border bg-crema px-4 text-sm outline-none transition-colors focus:border-carbon ${
    error ? 'border-red-400' : 'border-black/10'
  }`;

function Field({
  label,
  error,
  className = '',
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-humo">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-humo">{label}</dt>
      <dd className="font-medium text-carbon">{value}</dd>
    </div>
  );
}
