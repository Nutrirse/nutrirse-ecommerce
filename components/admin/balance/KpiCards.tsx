import { formatARS } from '@/lib/format';
import type { Resumen } from '@/lib/balance';

const TARJETAS: { key: keyof Resumen; titulo: string; nota: string; acento: string }[] = [
  { key: 'facturado', titulo: 'Facturado', nota: 'Ventas confirmadas', acento: 'bg-[#2F7A4A]' },
  { key: 'cobrado', titulo: 'Cobrado', nota: 'Ingresos completados', acento: 'bg-[#B8822F]' },
  { key: 'porCobrar', titulo: 'Por cobrar', nota: 'Ventas pendientes de pago', acento: 'bg-carbon/30' },
  { key: 'gastos', titulo: 'Gastos', nota: 'Egresos del período', acento: 'bg-[#b3261e]/70' },
];

export default function KpiCards({ resumen, etiquetaPeriodo }: { resumen: Resumen; etiquetaPeriodo: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {TARJETAS.map((t) => (
        <div key={t.key} className="relative overflow-hidden rounded-2xl border border-carbon/10 bg-white p-4 sm:p-5">
          <span className={`absolute inset-y-0 left-0 w-1 ${t.acento}`} aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-humo">
            {t.titulo} <span className="font-normal normal-case tracking-normal text-humo/60">· {etiquetaPeriodo}</span>
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tabular-nums text-carbon sm:text-2xl">
            {formatARS(resumen[t.key])}
          </p>
          <p className="mt-1 text-[11px] text-humo/70">{t.nota}</p>
        </div>
      ))}
    </div>
  );
}
