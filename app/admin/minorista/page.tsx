'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CanalNav from '@/components/admin/CanalNav';
import ProductoModal from '@/components/admin/ProductoModal';
import { leerJson, mensajeDeError } from '@/lib/fetch-json';
import { formatARS } from '@/lib/format';
import { imagenesDe } from '@/lib/imagenes';
import type { FilaMinorista } from '@/lib/admin-minorista';
import type { CategoriaAdmin } from '@/lib/admin-categorias';
import type { Product, Variant } from '@/types';

type Toast = { id: number; texto: string; tipo: 'ok' | 'error' };
type Filtro = 'todos' | 'con' | 'sin';

/** Lo que se edita en pantalla: precio y peso como texto para no pelear con el input. */
type Borrador = { id: string; label: string; peso: string; precio: string };

/** Presentaciones de la lista de precios del cliente. */
const PLANTILLA: Borrador[] = [
  { id: 'min-500g', label: '1/2 kg', peso: '0.5', precio: '' },
  { id: 'min-1kg', label: '1 kg', peso: '1', precio: '' },
];

const aBorrador = (v: Variant[]): Borrador[] =>
  v.map((x) => ({ id: x.id, label: x.label, peso: String(x.peso_kg), precio: x.precio == null ? '' : String(x.precio) }));

const aVariantes = (b: Borrador[]): Variant[] =>
  b.map((x) => ({
    id: x.id,
    label: x.label.trim(),
    tipo: 'precio',
    // Vacio -> NaN, para que la validacion lo frene en vez de guardar $0.
    precio: x.precio.trim() === '' ? NaN : Number(x.precio),
    peso_kg: Number(x.peso),
  }));

/** id estable a partir del rotulo: "1/2 kg" -> "min-1-2-kg". */
const idDesdeLabel = (label: string, usados: Set<string>) => {
  const base = `min-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'var'}`;
  let id = base;
  for (let n = 2; usados.has(id); n++) id = `${base}-${n}`;
  return id;
};

export default function AdminMinoristaPage() {
  const [sesion, setSesion] = useState<'cargando' | 'si' | 'no'>('cargando');
  const [productos, setProductos] = useState<Product[]>([]);
  const [filas, setFilas] = useState<Map<string, FilaMinorista>>(new Map());
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  // Alta rapida: la tabla de productos es compartida con el panel mayorista.
  const [creando, setCreando] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((texto: string, tipo: Toast['tipo'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, texto, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tipo === 'ok' ? 2200 : 5000);
  }, []);

  /* ---- Sesion: misma cookie que el panel de catalogo ---- */
  useEffect(() => {
    fetch('/api/admin/login')
      .then((r) => leerJson<{ autenticado?: boolean }>(r))
      .then((d) => setSesion(d.autenticado ? 'si' : 'no'))
      .catch(() => setSesion('no'));
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [rp, rm] = await Promise.all([
        fetch('/api/admin/products', { cache: 'no-store' }),
        fetch('/api/admin/minoristas', { cache: 'no-store' }),
      ]);
      if (rp.status === 401 || rm.status === 401) return setSesion('no');
      const [{ products }, { filas }] = await Promise.all([
        leerJson<{ products: Product[] }>(rp),
        leerJson<{ filas: FilaMinorista[] }>(rm),
      ]);
      setProductos(products);
      setFilas(new Map(filas.map((f) => [f.product_id, f])));
    } catch (e) {
      setErrorCarga(mensajeDeError(e, 'No pudimos cargar los precios minoristas.'));
    } finally {
      setCargando(false);
    }
  }, []);

  /** Solo para el selector del modal de alta. Si falla, el modal igual abre. */
  const cargarCategorias = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' });
      if (res.status === 401) return setSesion('no');
      const { categories } = await leerJson<{ categories: CategoriaAdmin[] }>(res);
      setCategorias(categories);
    } catch {
      /* no fatal */
    }
  }, []);

  useEffect(() => {
    if (sesion === 'si') {
      void cargar();
      void cargarCategorias();
    }
  }, [sesion, cargar, cargarCategorias]);

  /**
   * Producto recien creado: entra a la lista sin fila minorista, y filtramos
   * por su nombre para que quede a mano cargarle 1/2 kg y 1 kg.
   */
  const onCreado = (p: Product) => {
    setProductos((ps) => [...ps.filter((x) => x.id !== p.id), p]);
    setCreando(false);
    setFiltro('todos');
    setBusqueda(p.nombre);
    push(`“${p.nombre}” creado. Cargale sus precios minoristas.`);
  };

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const tiene = filas.has(p.id);
      if (filtro === 'con' && !tiene) return false;
      if (filtro === 'sin' && tiene) return false;
      return !q || p.nombre.toLowerCase().includes(q) || (p.categoria ?? '').toLowerCase().includes(q);
    });
  }, [productos, filas, busqueda, filtro]);

  const guardar = async (p: Product, variantes: Variant[]) => {
    try {
      const res = await fetch(`/api/admin/minoristas/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantes }),
      });
      if (res.status === 401) {
        setSesion('no');
        return false;
      }
      const { fila } = await leerJson<{ fila: FilaMinorista | null }>(res);
      setFilas((m) => {
        const n = new Map(m);
        if (fila) n.set(p.id, fila);
        else n.delete(p.id);
        return n;
      });
      push(fila ? `“${p.nombre}” actualizado` : `“${p.nombre}” salió del canal minorista`);
      return true;
    } catch (e) {
      push(mensajeDeError(e, 'No pudimos guardar.'), 'error');
      return false;
    }
  };

  /* ---- Render ---- */
  if (sesion === 'cargando') {
    return <div className="flex min-h-dvh items-center justify-center bg-crema text-sm text-humo">Cargando…</div>;
  }

  if (sesion === 'no') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-crema px-5 text-center">
        <p className="text-sm text-humo">Tu sesión de admin expiró o no iniciaste sesión.</p>
        <Link
          href="/admin"
          className="inline-flex h-10 items-center rounded-full bg-[#1e6b32] px-5 text-sm font-semibold text-white"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const enCanal = productos.filter((p) => filas.has(p.id)).length;

  return (
    <div className="min-h-dvh bg-crema">
      <header className="sticky top-0 z-30 border-b border-carbon/10 bg-hueso/95 backdrop-blur">
        <div className="h-1 bg-gradient-to-r from-[#143620] via-tostado to-[#143620]" aria-hidden />
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-3.5">
          <div className="mr-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-tostado">Nutrirse</p>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-carbon">
              Precios minoristas
            </h1>
            <p className="text-xs text-humo">
              {enCanal} de {productos.length} productos en la tienda minorista
            </p>
          </div>

          <CanalNav activo="minorista" />

          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o categoría…"
            aria-label="Buscar"
            className="h-10 w-full max-w-xs rounded-full border border-carbon/10 bg-white px-4 text-sm text-carbon outline-none placeholder:text-humo/50 focus:border-[#143620]/40 focus:ring-2 focus:ring-[#143620]/12 sm:w-64"
          />

          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
            aria-label="Filtrar"
            className="h-10 rounded-full border border-carbon/10 bg-white px-3 text-sm text-carbon"
          >
            <option value="todos">Todos</option>
            <option value="con">Con precio minorista</option>
            <option value="sin">Sin precio minorista</option>
          </select>

          <Link
            href="/admin/balance"
            className="flex h-10 items-center rounded-full border border-carbon/10 bg-white px-4 text-sm font-medium text-carbon hover:bg-crema"
          >
            Balance
          </Link>

          <button
            onClick={() => void cargar()}
            disabled={cargando}
            className="h-10 rounded-full px-4 text-sm font-medium text-humo hover:bg-crema hover:text-carbon disabled:opacity-40"
          >
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>

          <button
            onClick={() => setCreando(true)}
            className="h-10 rounded-full bg-[#1e6b32] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_-12px_rgba(30,107,50,0.9)] transition-all duration-200 hover:bg-[#175427] hover:shadow-[0_16px_30px_-12px_rgba(30,107,50,0.95)] active:scale-95"
          >
            + Nuevo producto
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-3 px-5 py-6">
        <p className="text-sm text-humo">
          Solo aparecen en <code className="text-carbon">/minorista</code> los productos con al menos una
          presentación. Los precios se muestran únicamente a clientes logueados.
        </p>

        {errorCarga && (
          <p className="rounded-xl border border-[#b3261e]/20 bg-[#b3261e]/8 px-4 py-3 text-sm text-[#b3261e]">
            {errorCarga}
          </p>
        )}

        {visibles.map((p) => (
          <FilaProducto
            // Remonta al recargar: el borrador vuelve a lo guardado.
            key={`${p.id}:${filas.get(p.id)?.updated_at ?? 'nuevo'}`}
            producto={p}
            fila={filas.get(p.id) ?? null}
            onGuardar={(v) => guardar(p, v)}
          />
        ))}

        {!cargando && visibles.length === 0 && (
          <p className="rounded-2xl border border-carbon/5 bg-hueso py-16 text-center text-sm text-humo">
            No hay productos con este filtro.
          </p>
        )}
      </main>

      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <p
            key={t.id}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              t.tipo === 'ok' ? 'bg-[#143620]' : 'bg-[#b3261e]'
            }`}
          >
            {t.texto}
          </p>
        ))}
      </div>

      {creando && (
        <ProductoModal
          producto={null}
          categorias={categorias}
          onCategoriaCreada={() => void cargarCategorias()}
          onClose={() => setCreando(false)}
          onGuardado={onCreado}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FilaProducto({
  producto: p,
  fila,
  onGuardar,
}: {
  producto: Product;
  fila: FilaMinorista | null;
  onGuardar: (v: Variant[]) => Promise<boolean>;
}) {
  const original = useMemo(() => aBorrador(fila?.variantes ?? []), [fila]);
  const [borrador, setBorrador] = useState<Borrador[]>(original);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sucio = JSON.stringify(borrador) !== JSON.stringify(original);
  const foto = imagenesDe(p)[0];
  // Referencia: precio mayorista por kg de la primera variante con precio.
  const ref = p.precios_por_variante.find((v) => v.tipo === 'precio' && v.precio);

  const set = (i: number, cambios: Partial<Borrador>) =>
    setBorrador((b) => b.map((x, j) => (j === i ? { ...x, ...cambios } : x)));

  const agregar = () =>
    setBorrador((b) => [...b, { id: idDesdeLabel('nueva', new Set(b.map((x) => x.id))), label: '', peso: '', precio: '' }]);

  const enviar = async (variantes: Variant[]) => {
    setError(null);
    for (const v of variantes) {
      if (!v.label) return setError('Cada presentación necesita un nombre.');
      if (!(v.peso_kg > 0)) return setError(`El peso de “${v.label}” debe ser mayor a 0.`);
      if (!Number.isFinite(v.precio) || (v.precio ?? -1) < 0) return setError(`Falta el precio de “${v.label}”.`);
    }
    setGuardando(true);
    await onGuardar(variantes);
    setGuardando(false);
  };

  return (
    <article
      className={`rounded-2xl border bg-hueso p-4 shadow-sm ${fila ? 'border-[#2F7A4A]/25' : 'border-carbon/5'}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-crema">
          {foto && <Image src={foto} alt="" fill sizes="48px" className="object-cover" />}
        </div>
        <div className="mr-auto min-w-0">
          <p className="truncate font-medium text-carbon">
            {p.nombre}
            {!p.activo && <span className="ml-2 rounded-full bg-carbon/5 px-2 py-0.5 text-[10px] text-humo">Oculto</span>}
          </p>
          <p className="text-xs text-humo">
            {p.categoria ?? 'Sin categoría'}
            {ref && ` · Mayorista: ${formatARS(ref.precio ?? 0)} (${ref.label})`}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            fila ? 'bg-[#2F7A4A]/10 text-[#1f5a35]' : 'bg-carbon/5 text-humo'
          }`}
        >
          {fila ? 'En tienda minorista' : 'Sin precio minorista'}
        </span>
      </div>

      {borrador.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="hidden grid-cols-[minmax(0,1fr)_90px_130px_32px] gap-2 text-[10px] font-semibold uppercase tracking-wider text-humo/70 sm:grid">
            <span>Presentación</span>
            <span className="text-right">Peso (kg)</span>
            <span className="text-right">Precio</span>
            <span />
          </div>
          {borrador.map((v, i) => (
            <div key={v.id} className="grid grid-cols-[minmax(0,1fr)_80px_110px_32px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_90px_130px_32px]">
              <input
                aria-label="Presentación"
                value={v.label}
                onChange={(e) => set(i, { label: e.target.value })}
                placeholder="1/2 kg"
                className="h-9 rounded-xl border border-carbon/10 bg-white px-3 text-sm outline-none focus:border-[#143620]/40"
              />
              <input
                aria-label="Peso en kg"
                type="number"
                min={0}
                step="any"
                value={v.peso}
                onChange={(e) => set(i, { peso: e.target.value })}
                className="h-9 rounded-xl border border-carbon/10 bg-white px-3 text-right text-sm outline-none focus:border-[#143620]/40"
              />
              <input
                aria-label={`Precio ${v.label}`}
                type="number"
                min={0}
                step="1"
                value={v.precio}
                onChange={(e) => set(i, { precio: e.target.value })}
                placeholder="$"
                className="h-9 rounded-xl border border-carbon/10 bg-white px-3 text-right text-sm font-semibold tabular-nums outline-none focus:border-[#143620]/40"
              />
              <button
                type="button"
                aria-label={`Quitar ${v.label || 'presentación'}`}
                onClick={() => setBorrador((b) => b.filter((_, j) => j !== i))}
                className="h-8 w-8 rounded-full text-humo hover:bg-[#b3261e]/10 hover:text-[#b3261e]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {borrador.length === 0 ? (
          <button
            type="button"
            onClick={() => setBorrador(PLANTILLA)}
            className="rounded-full border border-[#1e6b32]/30 px-3.5 py-1.5 text-sm font-medium text-[#1e6b32] hover:bg-[#1e6b32]/5"
          >
            + Agregar 1/2 kg y 1 kg
          </button>
        ) : (
          <button type="button" onClick={agregar} className="text-sm font-medium text-[#1e6b32] hover:underline">
            + Otra presentación
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {fila && (
            <button
              type="button"
              disabled={guardando}
              onClick={() => void enviar([])}
              className="rounded-full px-3 py-1.5 text-sm text-humo hover:bg-[#b3261e]/10 hover:text-[#b3261e] disabled:opacity-40"
            >
              Quitar de minorista
            </button>
          )}
          {sucio && (
            <>
              <button
                type="button"
                disabled={guardando}
                onClick={() => {
                  setBorrador(original);
                  setError(null);
                }}
                className="rounded-full px-3 py-1.5 text-sm text-humo hover:bg-crema disabled:opacity-40"
              >
                Descartar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={() =>
                  void enviar(
                    aVariantes(
                      // Las nuevas toman el id del rotulo al guardar: "min-1-2-kg".
                      borrador.map((x, _i, todas) =>
                        x.id.startsWith('min-nueva')
                          ? { ...x, id: idDesdeLabel(x.label, new Set(todas.filter((y) => y !== x).map((y) => y.id))) }
                          : x
                      )
                    )
                  )
                }
                className="h-9 rounded-full bg-[#1e6b32] px-4 text-sm font-semibold text-white hover:bg-[#175427] disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-[#b3261e]">{error}</p>}
    </article>
  );
}
