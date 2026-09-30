'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatARS } from '@/lib/format';
import type { PuntoMensual } from '@/lib/balance';

/**
 * Paleta validada (scripts/validate_palette.js del skill dataviz, modo
 * claro): pasa banda de luminosidad, croma, separacion CVD y contraste.
 * Verde = Facturado, dorado = Cobrado; la leyenda siempre acompana.
 */
const SERIES = [
  { key: 'facturado', nombre: 'Facturado', color: '#2F7A4A' },
  { key: 'cobrado', nombre: 'Cobrado', color: '#B8822F' },
] as const;

const compacto = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 });

export default function EvolucionChart({ datos }: { datos: PuntoMensual[] }) {
  const vacio = datos.every((d) => d.facturado === 0 && d.cobrado === 0);

  return (
    <section className="rounded-2xl border border-carbon/10 bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-carbon">Evolución mes a mes</h2>
      <p className="text-xs text-humo">Cobrado vs. facturado</p>

      <div className="relative mt-4 h-64 sm:h-72">
        {vacio && (
          <p className="absolute inset-0 z-10 flex items-center justify-center text-sm text-humo/70">
            Sin movimientos en el período.
          </p>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1C1A17" strokeOpacity={0.06} vertical={false} />
            <XAxis
              dataKey="etiqueta"
              tick={{ fontSize: 11, fill: '#6F6A62' }}
              tickLine={false}
              axisLine={{ stroke: '#1C1A17', strokeOpacity: 0.15 }}
            />
            <YAxis
              tickFormatter={(v: number) => `$${compacto.format(v)}`}
              tick={{ fontSize: 11, fill: '#6F6A62' }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              formatter={(v) => formatARS(Number(v))}
              cursor={{ stroke: '#1C1A17', strokeOpacity: 0.2 }}
              contentStyle={{ borderRadius: 12, border: '1px solid rgba(28,26,23,0.1)', fontSize: 12 }}
              labelStyle={{ color: '#1C1A17', fontWeight: 600 }}
            />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: '#6F6A62' }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.nombre}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                animationDuration={900}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
