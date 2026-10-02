import Link from 'next/link';

/**
 * Selector entre los dos paneles de catalogo: precios por bulto
 * (/admin) y precios minoristas (/admin/minorista).
 */
export default function CanalNav({ activo }: { activo: 'mayorista' | 'minorista' }) {
  const items = [
    { id: 'mayorista', href: '/admin', label: 'Mayorista · bultos' },
    { id: 'minorista', href: '/admin/minorista', label: 'Minorista' },
  ] as const;

  return (
    <nav aria-label="Canal de venta" className="flex rounded-full border border-carbon/10 bg-white p-1">
      {items.map((it) => (
        <Link
          key={it.id}
          href={it.href}
          aria-current={activo === it.id ? 'page' : undefined}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activo === it.id ? 'bg-tostado text-carbon shadow-sm' : 'text-humo hover:text-carbon'
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
