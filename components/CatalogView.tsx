'use client';

import { useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/types';
import { indiceCategorias, normalizarCategoria, type Categoria } from '@/lib/categorias';

/* ------------------------------------------------------------------ */
/* Filtros                                                             */
/* ------------------------------------------------------------------ */

type Canal = 'mayorista' | 'minorista';

/** Cortes de precio por canal: un bulto y un 1/2 kg no viven en la misma escala. */
const RANGOS: Record<Canal, { id: string; label: string; min: number; max: number }[]> = {
  mayorista: [
    { id: 'todos', label: 'Todos', min: 0, max: Infinity },
    { id: 'hasta-30', label: 'Hasta $30.000', min: 0, max: 30000 },
    { id: '30-60', label: '$30.000 – $60.000', min: 30000, max: 60000 },
    { id: 'desde-60', label: 'Más de $60.000', min: 60000, max: Infinity },
  ],
  minorista: [
    { id: 'todos', label: 'Todos', min: 0, max: Infinity },
    { id: 'hasta-5', label: 'Hasta $5.000', min: 0, max: 5000 },
    { id: '5-15', label: '$5.000 – $15.000', min: 5000, max: 15000 },
    { id: 'desde-15', label: 'Más de $15.000', min: 15000, max: Infinity },
  ],
};

// UI simulada: todavía no hay columna `marca` en la tabla `products`.
const MARCAS = ['Nutrirse', 'Selección Salta', 'Importado'];

const ORDENES = [
  { id: 'destacados', label: 'Más vendidos' },
  { id: 'precio-asc', label: 'Menor precio' },
  { id: 'precio-desc', label: 'Mayor precio' },
  { id: 'alfabetico', label: 'A – Z' },
];

/** Precio de referencia: la primera variante con precio (5 kg en mayorista, 1/2 kg en minorista). */
const precioBase = (p: Product) =>
  p.precios_por_variante.find((v) => v.tipo === 'precio')?.precio ?? 0;

/** Normaliza para buscar: minusculas y sin tildes ("mani" encuentra "maní"). */
const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function CatalogView({
  products,
  categorias: filas = [],
  initialCat = 'todos',
  initialQuery = '',
  preciosOcultos = false,
  canal = 'mayorista',
}: {
  products: Product[];
  /** Categorias reales (tabla `categories`). Vacio => fallback hardcodeado. */
  categorias?: Categoria[];
  initialCat?: string;
  /** Termino que llega por `?q=` desde el buscador del hero. */
  initialQuery?: string;
  /** Canal minorista sin sesion: las cards piden login en vez de precio. */
  preciosOcultos?: boolean;
  canal?: Canal;
}) {
  const RANGOS_PRECIO = RANGOS[canal];
  const indice = useMemo(() => indiceCategorias(filas), [filas]);
  // `?cat=reposteria-harinas` y compania caen bajo la unica "Repostería".
  const [cat, setCat] = useState(normalizarCategoria(initialCat));
  const [q, setQ] = useState(initialQuery);
  const [rango, setRango] = useState('todos');
  const [marcas, setMarcas] = useState<string[]>([]);
  const [orden, setOrden] = useState('destacados');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  /**
   * Chips del filtro: las categorías principales de la tabla que tengan al
   * menos un producto (contando los de sus subcategorías). Antes se derivaban
   * de `products`, así que una categoría recién creada no aparecía hasta
   * cargarle un producto, y una renombrada mostraba el slug viejo.
   */
  const categorias = useMemo(() => {
    const conProductos = new Set(
      products
        .map((p) => p.categoria)
        .filter((c): c is string => Boolean(c))
        .map((c) => indice.raiz(c))
    );

    const propias = indice.raices.map((c) => c.slug).filter((slug) => conProductos.has(slug));

    // Sin tabla (fallback) las raíces vienen vacías: se cae a lo que digan
    // los productos, como antes.
    const base = propias.length > 0 ? propias : [...conProductos];

    // Una categoría que llega por ?cat= y no existe en el catálogo igual se
    // muestra activa, para que el filtro no mienta sobre lo que aplicó.
    const inicial = indice.raiz(initialCat);
    if (inicial !== 'todos' && !base.includes(inicial)) base.push(inicial);
    return ['todos', ...base];
  }, [products, initialCat, indice]);

  const visibles = useMemo(() => {
    const r = RANGOS_PRECIO.find((x) => x.id === rango) ?? RANGOS_PRECIO[0];
    // Cada palabra del termino tiene que aparecer en algun lado: asi
    // "almendra 5" o "nuez light" siguen encontrando el producto.
    const terminos = normalizar(q).split(/\s+/).filter(Boolean);

    const filtrados = products.filter((p) => {
      if (!indice.incluye(p.categoria, cat)) return false;
      if (terminos.length > 0) {
        const texto = normalizar(
          `${p.nombre} ${p.descripcion ?? ''} ${p.categoria ?? ''}`
        );
        if (!terminos.every((t) => texto.includes(t))) return false;
      }
      const precio = precioBase(p);
      return precio >= r.min && precio <= r.max;
    });

    const ordenados = [...filtrados];
    if (orden === 'precio-asc') ordenados.sort((a, b) => precioBase(a) - precioBase(b));
    if (orden === 'precio-desc') ordenados.sort((a, b) => precioBase(b) - precioBase(a));
    if (orden === 'alfabetico') ordenados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return ordenados;
  }, [products, cat, rango, orden, q, indice, RANGOS_PRECIO]);

  const toggleMarca = (m: string) =>
    setMarcas((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const limpiar = () => {
    setQ('');
    setCat('todos');
    setRango('todos');
    setMarcas([]);
    setOrden('destacados');
    setFiltrosAbiertos(false);
  };

  const hayFiltros =
    cat !== 'todos' || rango !== 'todos' || marcas.length > 0 || q.trim() !== '';

  /**
   * Elegir categoria cierra el panel mobile. El sidebar es el mismo nodo en
   * desktop y en mobile, pero ahi `filtrosAbiertos` no se usa para nada:
   * cerrar de mas no tiene efecto visible.
   *
   * Solo aplica a categorias. Precio, marca y orden son multi-toque: cerrar
   * el panel obligaria a reabrirlo para el filtro siguiente.
   */
  const elegirCategoria = (c: string) => {
    setCat(c);
    setFiltrosAbiertos(false);
  };

  /* ---------------------------- Sidebar ---------------------------- */

  const sidebar = (
    <div className="space-y-8">
      <FiltroGrupo titulo="Categorías">
        <ul className="space-y-1.5">
          {categorias.map((c) => (
            <li key={c}>
              <button
                onClick={() => elegirCategoria(c)}
                className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  cat === c ? 'bg-carbon text-hueso' : 'text-humo hover:bg-black/5 hover:text-carbon'
                }`}
              >
                {c === 'todos' ? 'Todos' : indice.etiqueta(c)}
              </button>
            </li>
          ))}
        </ul>
      </FiltroGrupo>

      {/* Sin precios (minorista sin sesion) filtrar u ordenar por precio
          no tiene sentido: todos valen 0 para el filtro. */}
      {!preciosOcultos && (
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
      )}

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
          {ORDENES.filter((o) => !preciosOcultos || !o.id.startsWith('precio')).map((o) => (
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
      {/* Buscador del catalogo: filtra en vivo, sin recargar la ruta. */}
      <div className="pt-6">
        <div className="flex h-12 items-center gap-2 rounded-full border border-black/10 bg-hueso px-4">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-humo" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            role="searchbox"
            aria-label="Buscar en el catálogo"
            placeholder="Buscar por nombre, descripción o categoría…"
            /* 16 px en mobile: evita el auto-zoom de iOS al enfocar. */
            className="h-full min-w-0 flex-1 bg-transparent text-base text-carbon outline-none placeholder:text-humo/70 sm:text-sm"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              aria-label="Borrar búsqueda"
              className="shrink-0 rounded-full p-1 text-humo transition-colors hover:bg-black/5 hover:text-carbon"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-black/10 py-5">
        <p className="min-w-0 text-sm text-humo">
          {visibles.length} {visibles.length === 1 ? 'producto' : 'productos'}
          {q.trim() && <span className="break-words"> para “{q.trim()}”</span>}
        </p>
        <button
          onClick={() => setFiltrosAbiertos((v) => !v)}
          aria-expanded={filtrosAbiertos}
          aria-controls="filtros-mobile"
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

        {/* Panel de filtros mobile. Se desmonta al elegir categoria via
            `elegirCategoria`, asi los productos quedan a la vista. */}
        {filtrosAbiertos && (
          <div
            id="filtros-mobile"
            className="rounded-2xl border border-black/5 bg-hueso p-5 lg:hidden"
          >
            {sidebar}
          </div>
        )}

        <div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map((p) => (
              <ProductCard key={p.id} product={p} related={products} preciosOcultos={preciosOcultos} />
            ))}
          </div>

          {visibles.length === 0 && (
            <div className="rounded-2xl border border-black/5 bg-hueso py-20 text-center">
              <p className="text-humo">
                {q.trim()
                  ? `No encontramos productos para “${q.trim()}”.`
                  : 'No hay productos con estos filtros.'}
              </p>
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
