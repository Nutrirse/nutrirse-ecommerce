'use client';

import type { PresetRango, Rango } from '@/lib/balance';

const PRESETS: { id: PresetRango; label: string }[] = [
  { id: 'mes', label: 'Este mes' },
  { id: '6m', label: 'Últimos 6 meses' },
  { id: 'custom', label: 'Personalizado' },
];

const fecha =
  'h-9 rounded-full border border-carbon/10 bg-white px-3 text-sm text-carbon outline-none focus:border-[#143620]/40';

export default function FiltroFechas({
  preset,
  rango,
  onPreset,
  onRango,
}: {
  preset: PresetRango;
  rango: Rango;
  onPreset: (p: PresetRango) => void;
  onRango: (r: Rango) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label="Período" className="flex rounded-full bg-hueso p-1 ring-1 ring-carbon/10">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={preset === p.id}
            onClick={() => onPreset(p.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              preset === p.id ? 'bg-[#143620] text-[#f5ebd9]' : 'text-humo hover:text-carbon'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Desde"
            value={rango.desde}
            max={rango.hasta}
            onChange={(e) => e.target.value && onRango({ ...rango, desde: e.target.value })}
            className={fecha}
          />
          <span className="text-humo">→</span>
          <input
            type="date"
            aria-label="Hasta"
            value={rango.hasta}
            min={rango.desde}
            onChange={(e) => e.target.value && onRango({ ...rango, hasta: e.target.value })}
            className={fecha}
          />
        </div>
      )}
    </div>
  );
}
