'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCart, selectPesoTotal } from '@/store/cart';
import { formatARS } from '@/lib/format';
import type { ShippingOption } from '@/types';

type Props = {
  /** Sin encabezado ni marco: para embeber dentro de otro bloque. */
  compact?: boolean;
  /** `oscuro` invierte la paleta para fondos verdes (banner de logística). */
  tone?: 'claro' | 'oscuro';
  /**
   * Peso a cotizar, en kg. Si se pasa, pisa el peso del carrito: el modal de
   * producto cotiza sobre la variante y cantidad que el usuario esta viendo,
   * que todavia no estan en el carrito.
   */
  pesoKg?: number;
};

export default function ShippingCalculator({ compact = false, tone = 'claro', pesoKg }: Props) {
  const { cp, setCp, shipping, setShipping } = useCart();
  const pesoTotal = useCart(selectPesoTotal);

  const [opciones, setOpciones] = useState<ShippingOption[]>([]);
  const [zona, setZona] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prioridad: peso explicito (modal de producto) > peso del carrito > 5 kg.
  const peso = pesoKg && pesoKg > 0 ? pesoKg : pesoTotal > 0 ? pesoTotal : 5;
  const dark = tone === 'oscuro';

  const cotizar = useCallback(async () => {
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
  }, [cp, peso]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void cotizar();
  };

  /* ---- Re-cotiza cuando cambia el peso (variante o cantidad en el modal).
         Solo si ya habia una cotizacion en pantalla: mostrar precios de un
         peso viejo seria peor que no mostrar nada. La opcion elegida se
         descarta porque su precio ya no corresponde. ---- */
  const hayCotizacion = opciones.length > 0;
  const pesoPrevio = useRef(peso);
  useEffect(() => {
    if (pesoPrevio.current === peso) return;
    pesoPrevio.current = peso;
    if (!hayCotizacion) return;
    setShipping(null);
    const t = setTimeout(() => void cotizar(), 250);
    return () => clearTimeout(t);
  }, [peso, hayCotizacion, cotizar, setShipping]);

  /* ---------------- Paleta por tono ---------------- */
  const cls = dark
    ? {
        wrap: '',
        input:
          'border-white/20 bg-white/10 text-[#f5ebd9] placeholder:text-[#f5ebd9]/45 focus:border-[#d6b26a]',
        submit: 'bg-[#f5ebd9] text-[#0b1c0f]',
        error: 'text-red-300',
        muted: 'text-[#f5ebd9]/55',
        optOn: 'border-[#d6b26a] bg-[#d6b26a] text-[#0b1c0f]',
        optOff: 'border-white/15 bg-white/5 text-[#f5ebd9] hover:border-white/35',
        optSubOn: 'text-[#0b1c0f]/70',
        optSubOff: 'text-[#f5ebd9]/55',
      }
    : {
        wrap: compact ? '' : 'rounded-2xl border border-black/5 bg-hueso p-6',
        input: 'border-black/10 bg-crema text-carbon focus:border-carbon',
        submit: 'bg-carbon text-hueso',
        error: 'text-red-700',
        muted: 'text-humo',
        optOn: 'border-carbon bg-carbon text-hueso',
        optOff: 'border-black/10 bg-crema text-carbon hover:border-carbon/30',
        optSubOn: 'text-hueso/70',
        optSubOff: 'text-humo',
      };

  return (
    <div className={cls.wrap}>
      {!compact && !dark && (
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

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          value={cp}
          onChange={(e) => setCp(e.target.value)}
          placeholder="Código postal"
          inputMode="numeric"
          aria-label="Código postal"
          className={`h-11 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none transition-colors ${cls.input}`}
        />
        <button
          type="submit"
          disabled={loading || cp.trim().length < 4}
          className={`h-11 shrink-0 rounded-full px-5 text-sm font-medium transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 ${cls.submit}`}
        >
          {loading ? 'Cotizando…' : 'Calcular'}
        </button>
      </form>

      {error && <p className={`mt-3 text-sm ${cls.error}`}>{error}</p>}

      {opciones.length > 0 && (
        <div className="mt-5">
          {zona && (
            <p className={`mb-3 text-xs uppercase tracking-wider ${cls.muted}`}>
              Zona detectada: {zona} · {peso} kg
            </p>
          )}
          <ul className="grid gap-2 sm:grid-cols-2">
            {opciones.map((o) => {
              const activo = shipping?.id === o.id;
              return (
                <li key={o.id}>
                  <button
                    onClick={() => setShipping(activo ? null : o)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      activo ? cls.optOn : cls.optOff
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{o.label}</span>
                      <span
                        className={`block text-xs ${activo ? cls.optSubOn : cls.optSubOff}`}
                      >
                        {o.eta_dias[0]}–{o.eta_dias[1]} días hábiles
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">{formatARS(o.price)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className={`mt-3 text-xs ${cls.muted}`}>
            Valores estimados. Se confirman al cerrar el pedido por WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}
