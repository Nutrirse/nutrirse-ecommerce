'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProductoModal from '@/components/admin/ProductoModal';
import { formatARS } from '@/lib/format';
import type { Product, Variant } from '@/types';

/* ================================================================== */
/* Toasts                                                             */
/* ================================================================== */

type Toast = { id: number; texto: string; tipo: 'ok' | 'error' };

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((texto: string, tipo: Toast['tipo'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, texto, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tipo === 'ok' ? 2200 : 5000);
  }, []);
  return { toasts, push };
}

/* ================================================================== */
/* Login                                                              */
/* ================================================================== */

function Login({ onOk, configurado }: { onOk: () => void; configurado: boolean }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No pudimos validar la contraseña.');
      onOk();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setPassword('');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-100 px-5">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.4)]"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Nutrirse</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">Panel de catálogo</h1>

        {!configurado ? (
          <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-800">
            Falta definir <code className="font-mono">ADMIN_PASSWORD</code> en el entorno del
            servidor. Agregala a <code className="font-mono">.env.local</code> y reiniciá
            <code className="font-mono"> npm run dev</code>.
          </p>
        ) : (
          <>
            <label htmlFor="pass" className="sr-only">Contraseña</label>
            <input
              id="pass"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="mt-6 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900"
            />
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={cargando || password.length === 0}
              className="mt-4 w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-40"
            >
              {cargando ? 'Verificando…' : 'Entrar'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

/* ================================================================== */
/* Celda de precio editable                                           */
/* ================================================================== */

/**
 * Guarda al salir del input (onBlur) o con Enter, y solo si el valor cambio.
 * No se guarda en cada tecla: serian decenas de UPDATE por precio tipeado.
 */
function CeldaPrecio({
  variante,
  onGuardar,
}: {
  variante: Variant;
  onGuardar: (nuevo: number) => Promise<void>;
}) {
  const [valor, setValor] = useState(String(variante.precio ?? 0));
  const original = useRef(String(variante.precio ?? 0));

  // El valor puede cambiar por fuera (alta, edicion en el modal, refresh).
  useEffect(() => {
    const v = String(variante.precio ?? 0);
    setValor(v);
    original.current = v;
  }, [variante.precio]);

  const commit = async () => {
    if (valor === original.current) return;
    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) {
      setValor(original.current);
      return;
    }
    original.current = valor;
    await onGuardar(Math.round(n));
  };

  return (
    <label className="flex items-center gap-1.5">
      <span className="w-24 shrink-0 truncate text-[11px] text-gray-400" title={variante.label}>
        {variante.label}
      </span>
      <span className="text-xs text-gray-400">$</span>
      <input
        type="number"
        min={0}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setValor(original.current);
        }}
        aria-label={`Precio de ${variante.label}`}
        className="w-24 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm tabular-nums outline-none transition-colors hover:border-gray-200 focus:border-gray-900 focus:bg-white"
      />
    </label>
  );
}

/* ================================================================== */
/* Panel                                                              */
/* ================================================================== */

type EstadoFila = 'idle' | 'guardando' | 'ok' | 'error';

export default function AdminPage() {
  const [sesion, setSesion] = useState<'cargando' | 'no' | 'si'>('cargando');
  const [configurado, setConfigurado] = useState(true);

  const [productos, setProductos] = useState<Product[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [estados, setEstados] = useState<Record<string, EstadoFila>>({});
  const [modal, setModal] = useState<{ abierto: boolean; producto: Product | null }>({
    abierto: false,
    producto: null,
  });

  const { toasts, push } = useToasts();

  /* ---- Sesion ---- */
  useEffect(() => {
    fetch('/api/admin/login')
      .then((r) => r.json())
      .then((d) => {
        setConfigurado(Boolean(d.configurado));
        setSesion(d.autenticado ? 'si' : 'no');
      })
      .catch(() => setSesion('no'));
  }, []);

  /* ---- Catalogo ---- */
  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (res.status === 401) {
        setSesion('no');
        return;
      }
      if (!res.ok) throw new Error(data.error ?? 'No pudimos cargar el catálogo.');
      setProductos(data.products as Product[]);
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (sesion === 'si') void cargar();
  }, [sesion, cargar]);

  const marcar = (id: string, estado: EstadoFila) => {
    setEstados((s) => ({ ...s, [id]: estado }));
    if (estado === 'ok') setTimeout(() => setEstados((s) => ({ ...s, [id]: 'idle' })), 1600);
  };

  /**
   * UPDATE inmediato de un campo. Optimista: pinta el cambio y lo revierte
   * si el server lo rechaza, para que la grilla no mienta.
   */
  const patch = async (p: Product, cambios: Record<string, unknown>, etiqueta: string) => {
    const previo = productos;
    marcar(p.id, 'guardando');
    setProductos((ps) => ps.map((x) => (x.id === p.id ? { ...x, ...cambios } : x)));

    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      });
      const data = await res.json();
      if (res.status === 401) {
        setSesion('no');
        return;
      }
      if (!res.ok) throw new Error(data.error ?? 'No pudimos guardar.');

      setProductos((ps) => ps.map((x) => (x.id === p.id ? (data.product as Product) : x)));
      marcar(p.id, 'ok');
      push(`${etiqueta} guardado`);
    } catch (e) {
      setProductos(previo);
      marcar(p.id, 'error');
      push(e instanceof Error ? e.message : 'Error al guardar', 'error');
    }
  };

  const cambiarPrecio = (p: Product, variantId: string, precio: number) => {
    const variantes = p.precios_por_variante.map((v) =>
      v.id === variantId ? { ...v, precio } : v
    );
    return patch(p, { precios_por_variante: variantes }, 'Precio');
  };

  const eliminar = async (p: Product) => {
    // confirm() nativo: es un panel interno de un solo usuario, no justifica
    // un modal propio. Bloquea el hilo, pero aca no hay animaciones vivas.
    const ok = window.confirm(
      `¿Eliminar "${p.nombre}"?\n\nSe borra el producto y su imagen del Storage. Esta acción no se puede deshacer.\n\nSi solo querés ocultarlo de la web, cambiá el estado a "Sin stock".`
    );
    if (!ok) return;

    marcar(p.id, 'guardando');
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No pudimos eliminar.');
      setProductos((ps) => ps.filter((x) => x.id !== p.id));
      push(`"${p.nombre}" eliminado`);
    } catch (e) {
      marcar(p.id, 'error');
      push(e instanceof Error ? e.message : 'Error al eliminar', 'error');
    }
  };

  const salir = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setSesion('no');
    setProductos([]);
  };

  const onGuardado = (p: Product, esNuevo: boolean) => {
    setProductos((ps) => (esNuevo ? [...ps, p] : ps.map((x) => (x.id === p.id ? p : x))));
    setModal({ abierto: false, producto: null });
    push(esNuevo ? 'Producto creado' : 'Cambios guardados');
  };

  /* ---------------- Render ---------------- */

  if (sesion === 'cargando') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-100 text-sm text-gray-500">
        Cargando…
      </div>
    );
  }

  if (sesion === 'no') {
    return <Login configurado={configurado} onOk={() => setSesion('si')} />;
  }

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) || (p.categoria ?? '').toLowerCase().includes(q)
      )
    : productos;

  return (
    <div className="min-h-dvh bg-gray-100">
      {/* ---------- Barra superior ---------- */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-3.5">
          <div className="mr-auto">
            <h1 className="text-base font-semibold text-gray-900">Catálogo</h1>
            <p className="text-xs text-gray-500">
              {productos.length} productos · {productos.filter((p) => p.activo).length} visibles
            </p>
          </div>

          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o categoría…"
            aria-label="Buscar"
            className="h-10 w-full max-w-xs rounded-full border border-gray-200 px-4 text-sm outline-none transition-colors focus:border-gray-900 sm:w-64"
          />

          <button
            onClick={() => void cargar()}
            disabled={cargando}
            className="h-10 rounded-full px-4 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>

          <button
            onClick={() => setModal({ abierto: true, producto: null })}
            className="h-10 rounded-full bg-gray-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            + Agregar producto
          </button>

          <button
            onClick={() => void salir()}
            className="h-10 rounded-full px-3 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6">
        {errorCarga && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorCarga}</p>
        )}

        <p className="mb-3 text-xs text-gray-500">
          Los precios y el estado se guardan solos al salir de la celda. Los cambios impactan en
          la web al instante.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="w-16 px-4 py-3 font-semibold">Foto</th>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="w-40 px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Precios</th>
                <th className="w-36 px-4 py-3 font-semibold">Estado</th>
                <th className="w-20 px-4 py-3 font-semibold">Orden</th>
                <th className="w-28 px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const estado = estados[p.id] ?? 'idle';
                const conPrecio = p.precios_por_variante.filter((v) => v.tipo === 'precio');
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-100 transition-colors last:border-0 ${
                      estado === 'ok' ? 'bg-green-50/60' : estado === 'error' ? 'bg-red-50/60' : 'hover:bg-gray-50/60'
                    } ${p.activo ? '' : 'opacity-60'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-gray-50">
                        {p.imagen_url ? (
                          <Image
                            src={p.imagen_url}
                            alt=""
                            fill
                            sizes="44px"
                            unoptimized
                            className="object-contain p-0.5"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-lg text-gray-300">
                            {p.nombre.charAt(0)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModal({ abierto: true, producto: p })}
                        className="text-left font-medium text-gray-900 hover:underline"
                      >
                        {p.nombre}
                      </button>
                      <p className="font-mono text-[11px] text-gray-400">/{p.slug}</p>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {(p.categoria ?? '—').replace(/-/g, ' ')}
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {conPrecio.length > 0 ? (
                          conPrecio.map((v) => (
                            <CeldaPrecio
                              key={v.id}
                              variante={v}
                              onGuardar={(n) => cambiarPrecio(p, v.id, n)}
                            />
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Solo a consultar</span>
                        )}
                        {conPrecio.length > 0 && (
                          <p className="pl-[6.5rem] text-[11px] text-gray-400">
                            {formatARS(conPrecio[0].precio ?? 0)} el más bajo
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={p.activo ? 'activo' : 'inactivo'}
                        onChange={(e) =>
                          void patch(p, { activo: e.target.value === 'activo' }, 'Estado')
                        }
                        aria-label={`Estado de ${p.nombre}`}
                        className={`w-full rounded-full border px-3 py-1.5 text-xs font-medium outline-none transition-colors ${
                          p.activo
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-gray-200 bg-gray-100 text-gray-600'
                        }`}
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Sin stock</option>
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        defaultValue={p.orden}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n !== p.orden) void patch(p, { orden: n }, 'Orden');
                        }}
                        aria-label={`Orden de ${p.nombre}`}
                        className="w-16 rounded border border-transparent px-1.5 py-1 text-sm tabular-nums outline-none transition-colors hover:border-gray-200 focus:border-gray-900"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal({ abierto: true, producto: p })}
                          aria-label={`Editar ${p.nombre}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => void eliminar(p)}
                          aria-label={`Eliminar ${p.nombre}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                          </svg>
                        </button>
                        {estado === 'guardando' && (
                          <span className="text-[11px] text-gray-400">…</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && !cargando && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    {productos.length === 0
                      ? 'Todavía no hay productos. Empezá con "Agregar producto".'
                      : 'Ningún producto coincide con la búsqueda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ---------- Toasts ---------- */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ${
              t.tipo === 'ok' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {t.tipo === 'ok' ? '✓ ' : '✕ '}
            {t.texto}
          </div>
        ))}
      </div>

      {modal.abierto && (
        <ProductoModal
          producto={modal.producto}
          onClose={() => setModal({ abierto: false, producto: null })}
          onGuardado={onGuardado}
        />
      )}
    </div>
  );
}
