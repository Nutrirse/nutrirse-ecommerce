'use client';

import { useState } from 'react';
import { useCart, selectPesoTotal } from '@/store/cart';
import { formatARS } from '@/lib/format';
import type { ShippingOption } from '@/types';

export default function ShippingCalculator({ compact = false }: { compact?: boolean }) {
  const { cp, setCp, shipping, setShipping } = useCart();
  const pesoTotal = useCart(selectPesoTotal);

  const [opciones, setOpciones] = useState<ShippingOption[]>([]);
  const [zona, setZona] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peso = pesoTotal > 0 ? pesoTotal : 5;

  const cotizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOpciones([]);
    try {
      const res = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cp, peso_kg: peso }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No pudimos cotizar el envío.');
      setOpciones(data.opciones);
      setZona(data.zona);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? '' : 'rounded-2xl border border-black/5 bg-hueso p-6'}>
      {!compact && (
        <>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-tostado">Envíos</p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-carbon">
            Calculá el costo hasta tu depósito
          </h3>
          <p className="mt-1.5 text-sm text-humo">
            Despachamos desde Salta Capital. Cotización sobre {peso} kg.
          </p>
        </>
      )}

      <form onSubmit={cotizar} className="mt-4 flex gap-2">
        <input
          value={cp}
          onChange={(e) => setCp(e.target.value)}
          placeholder="Código postal"
          inputMode="numeric"
          aria-label="Código postal"
          className="h-11 min-w-0 flex-1 rounded-full border border-black/10 bg-crema px-4 text-sm outline-none transition-colors focus:border-carbon"
        />
        <button
          type="submit"
          disabled={loading || cp.trim().length < 4}
          className="h-11 shrink-0 rounded-full bg-carbon px-5 text-sm font-medium text-hueso transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          {loading ? 'Cotizando…' : 'Calcular'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {opciones.length > 0 && (
        <div className="mt-5">
          {zona && (
            <p className="mb-3 text-xs uppercase tracking-wider text-humo">
              Zona detectada: {zona}
            </p>
          )}
          <ul className="space-y-2">
            {opciones.map((o) => {
              const activo = shipping?.id === o.id;
              return (
                <li key={o.id}>
                  <button
                    onClick={() => setShipping(activo ? null : o)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      activo
                        ? 'border-carbon bg-carbon text-hueso'
                        : 'border-black/10 bg-crema hover:border-carbon/30'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-medium">{o.label}</span>
                      <span className={`block text-xs ${activo ? 'text-hueso/70' : 'text-humo'}`}>
                        {o.eta_dias[0]}–{o.eta_dias[1]} días hábiles
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">{formatARS(o.price)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-humo">
            Valores estimados. Se confirman al cerrar el pedido por WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}
