import { formatARS } from '@/lib/format';

/**
 * Recordatorio de la promo Andreani debajo del total (carrito y checkout
 * minorista). Si el envio cotizado ya tiene el 20 % aplicado, muestra
 * cuanto se ahorra; si no, queda como recordatorio estatico.
 */
export default function PromoAndreaniAviso({
  aplicado = 0,
  className = '',
}: {
  aplicado?: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-[#28a745]/25 bg-[#28a745]/[0.06] px-3 py-2.5 text-xs leading-relaxed text-gray-700 ${className}`}
    >
      <p>
        <span aria-hidden>🚚 </span>
        <strong className="font-semibold text-gray-900">Envíos fuera de Salta Capital:</strong>{' '}
        Tenés un 20% de descuento asegurado despachando con Andreani.
      </p>
      {aplicado > 0 && (
        <p className="mt-1 font-semibold text-[#28a745]">
          Ya aplicado: ahorrás {formatARS(aplicado)} en el envío.
        </p>
      )}
    </div>
  );
}
