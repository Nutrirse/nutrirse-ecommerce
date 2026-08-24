'use client';

import { useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

/* ------------------------------------------------------------------ */
/* Filtros                                                             */
/* ------------------------------------------------------------------ */

const RANGOS_PRECIO = [
  { id: 'todos', label: 'Todos', min: 0, max: Infinity },
  { id: 'hasta-30', label: 'Hasta $30.000', min: 0, max: 30000 },
  { id: '30-60', label: '$30.000 – $60.000', min: 30000, max: 60000 },
  { id: 'desde-60', label: 'Más de $60.000', min: 60000, max: Infinity },
];

// UI simulada: todavía no hay columna `marca` en la tabla `products`.
const MARCAS = ['Nutrirse', 'Selección Salta', 'Importado'];

const ORDENES = [
  { id: 'destacados', label: 'Más vendidos' },
  { id: 'precio-asc', label: 'Menor precio' },
  { id: 'precio-desc', label: 'Mayor precio' },
  { id: 'alfabetico', label: 'A – Z' },
];

/** Precio de referencia de un producto: el de la variante de 5 kg. */
const precioBase = (p: Product) =>
  p.precios_por_variante.find((v) => v.tipo === 'precio')?.precio ?? 0;

export default function CatalogView({
  products,
  initialCat = 'todos',
}: {
  products: Product[];
  initialCat?: string;
}) {
  const [cat, setCat] = useState(initialCat);
  const [rango, setRango] = useState('todos');
  const [marcas, setMarcas] = useState<string[]>([]);
  const [orden, setOrden] = useState('destacados');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const categorias = useMemo(() => {
    const propias = Array.from(
      new Set(products.map((p) => p.categoria).filter(Boolean) as string[])
    );
    // Una categoría que llega por ?cat= y no existe en el catálogo igual se
    // muestra activa, para que el filtro no mienta sobre lo que aplicó.
    if (initialCat !== 'todos' && !propias.includes(initialCat)) propias.push(initialCat);
    return ['todos', ...propias];
  }, [products, initialCat]);

  const visibles = useMemo(() => {
    const r = RANGOS_PRECIO.find((x) => x.id === rango) ?? RANGOS_PRECIO[0];

    const filtrados = products.filter((p) => {
      if (cat !== 'todos' && p.categoria !== cat) return false;
      const precio = precioBase(p);
      return precio >= r.min && precio <= r.max;
    });

    const ordenados = [...filtrados];
    if (orden === 'precio-asc') ordenados.sort((a, b) => precioBase(a) - precioBase(b));
    if (orden === 'precio-desc') ordenados.sort((a, b) => precioBase(b) - precioBase(a));
    if (orden === 'alfabetico') ordenados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return ordenados;
  }, [products, cat, rango, orden]);

  const toggleMarca = (m: string) =>
    setMarcas((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const limpiar = () => {
    setCat('todos');
    setRango('todos');
    setMarcas([]);
    setOrden('destacados');
  };

  const hayFiltros = cat !== 'todos' || rango !== 'todos' || marcas.length > 0;

  /* ---------------------------- Sidebar ---------------------------- */

  const sidebar = (
    <div className="space-y-8">
      <FiltroGrupo titulo="Categorías">
        <ul className="space-y-1.5">
          {categorias.map((c) => (
            <li key={c}>
              <button
                onClick={() => setCat(c)}
                className={`w-full rounded-md px-2 py-1.5 text-left text-sm capitalize transition-colors ${
                  cat === c ? 'bg-carbon text-hueso' : 'text-humo hover:bg-black/5 hover:text-carbon'
                }`}
              >
                {c.replace(/-/g, ' ')}
              </button>
            </li>
          ))}
        </ul>
      </FiltroGrupo>

      <FiltroGrupo titulo="Precio">
        <ul className="space-y-1.5">
          {RANGOS_PRECIO.map((r) => (
            <li key={r.id}>
              <label className="flex cursor-pointer items-center gap-2.5 px-2 py-1 text-sm text-humo hover:text-carbon">
                <input
                  type="radio"
                  name="rango-precio"
                  checked={rango === r.id}
                  onChange={() => setRango(r.id)}
                  className="h-4 w-4 accent-[#28a745]"
                />
                {r.label}
              </label>
            </li>
          ))}
        </ul>
      </FiltroGrupo>

      <FiltroGrupo titulo="Marca">
        <ul className="space-y-1.5">
          {MARCAS.map((m) => (
            <li key={m}>
              <label className="flex cursor-pointer items-center gap-2.5 px-2 py-1 text-sm text-humo hover:text-carbon">
                <input
                  type="checkbox"
                  checked={marcas.includes(m)}
                  onChange={() => toggleMarca(m)}
                  className="h-4 w-4 rounded accent-[#28a745]"
                />
                {m}
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-2 px-2 text-[11px] text-humo/70">
          Filtro de muestra: la tabla todavía no guarda marca.
        </p>
      </FiltroGrupo>

      <FiltroGrupo titulo="Ordenar por">
        <ul className="space-y-1.5">
          {ORDENES.map((o) => (
            <li key={o.id}>
              <label className="flex cursor-pointer items-center gap-2.5 px-2 py-1 text-sm text-humo hover:text-carbon">
                <input
                  type="radio"
                  name="orden"
                  checked={orden === o.id}
                  onChange={() => setOrden(o.id)}
                  className="h-4 w-4 accent-[#28a745]"
                />
                {o.label}
              </label>
            </li>
          ))}
        </ul>
      </FiltroGrupo>

      {hayFiltros && (
        <button
          onClick={limpiar}
          className="w-full rounded-lg border border-black/10 py-2.5 text-sm text-humo transition-colors hover:bg-black/5 hover:text-carbon"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  /* ---------------------------- Render ---------------------------- */

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <div className="flex items-center justify-between gap-4 border-b border-black/10 py-5">
        <p className="text-sm text-humo">
          {visibles.length} {visibles.length === 1 ? 'producto' : 'productos'}
        </p>
        <button
          onClick={() => setFiltrosAbiertos((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm text-carbon lg:hidden"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          Filtros
        </button>
      </div>

      <div className="grid gap-10 pt-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">{sidebar}</div>
        </aside>

        {/* Panel de filtros mobile */}
        {filtrosAbiertos && (
          <div className="rounded-2xl border border-black/5 bg-hueso p-5 lg:hidden">{sidebar}</div>
        )}

        <div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map((p) => (
              <ProductCard key={p.id} product={p} related={products} />
            ))}
          </div>

          {visibles.length === 0 && (
            <div className="rounded-2xl border border-black/5 bg-hueso py-20 text-center">
              <p className="text-humo">No hay productos con estos filtros.</p>
              <button
                onClick={limpiar}
                className="mt-4 rounded-full bg-carbon px-6 py-2.5 text-sm text-hueso"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FiltroGrupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-carbon">
        {titulo}
      </h3>
      {children}
    </div>
  );
}
