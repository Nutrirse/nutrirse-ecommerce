'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Product, Variant } from '@/types';

/** Categorias del mega menu (components/Navbar.tsx). */
const CATEGORIAS = [
  'frutos-secos',
  'mixes',
  'snacks',
  'secos',
  'aceites',
  'chocolates',
  'reposteria',
  'reposteria-insumos',
  'reposteria-chocolates',
  'reposteria-coco',
  'reposteria-harinas',
  'semillas',
  'suplementos',
  'granola',
  'infusiones',
];

/** Plantilla del alta: el mismo esquema de 3 variantes del catalogo actual. */
const VARIANTES_BASE: Variant[] = [
  { id: '5kg', label: '5 kg', tipo: 'precio', precio: 0, peso_kg: 5 },
  { id: 'bolsa', label: 'Bulto Cerrado', tipo: 'precio', precio: 0, peso_kg: 10 },
  { id: 'mayorista', label: '+5 bultos (Consultar)', tipo: 'consultar', precio: null, peso_kg: 50 },
];

type Props = {
  /** null => alta. Con producto => edicion. */
  producto: Product | null;
  onClose: () => void;
  onGuardado: (p: Product, esNuevo: boolean) => void;
};

const input =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gray-900';
const label = 'text-xs font-semibold uppercase tracking-wider text-gray-500';

export default function ProductoModal({ producto, onClose, onGuardado }: Props) {
  const esNuevo = producto === null;

  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [categoria, setCategoria] = useState(producto?.categoria ?? 'frutos-secos');
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
  const [imagenUrl, setImagenUrl] = useState(producto?.imagen_url ?? '');
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [orden, setOrden] = useState(String(producto?.orden ?? 0));
  const [variantes, setVariantes] = useState<Variant[]>(
    producto?.precios_por_variante?.length ? producto.precios_por_variante : VARIANTES_BASE
  );

  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !guardando && !subiendo) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, guardando, subiendo]);

  /* ---------------- Variantes ---------------- */

  const setVar = (i: number, patch: Partial<Variant>) =>
    setVariantes((vs) => vs.map((v, k) => (k === i ? { ...v, ...patch } : v)));

  const agregarVariante = () =>
    setVariantes((vs) => [
      ...vs,
      { id: `var-${Date.now()}`, label: '', tipo: 'precio', precio: 0, peso_kg: 1 },
    ]);

  const quitarVariante = (i: number) =>
    setVariantes((vs) => (vs.length > 1 ? vs.filter((_, k) => k !== i) : vs));

  /* ---------------- Imagen ---------------- */

  const subir = async (file: File) => {
    setSubiendo(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slug', nombre || producto?.slug || 'producto');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No pudimos subir la imagen.');
      setImagenUrl(data.url as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir la imagen.');
    } finally {
      setSubiendo(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  /* ---------------- Guardado ---------------- */

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const body = {
      nombre: nombre.trim(),
      categoria: categoria || null,
      descripcion: descripcion.trim() || null,
      imagen_url: imagenUrl.trim() || null,
      activo,
      orden: Number(orden) || 0,
      precios_por_variante: variantes,
    };

    try {
      const res = await fetch(
        esNuevo ? '/api/admin/products' : `/api/admin/products/${producto!.id}`,
        {
          method: esNuevo ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No pudimos guardar.');
      onGuardado(data.product as Product, esNuevo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const ocupado = guardando || subiendo;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={ocupado ? undefined : onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={esNuevo ? 'Nuevo producto' : `Editar ${producto?.nombre}`}
        className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {esNuevo ? 'Agregar producto' : 'Editar producto'}
          </h2>
          <button
            onClick={onClose}
            disabled={ocupado}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={guardar} className="thin-scroll flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
            {/* ---------- Imagen ---------- */}
            <div>
              <p className={label}>Imagen</p>
              <div className="mt-2 relative aspect-square w-full overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
                {imagenUrl ? (
                  <Image
                    src={imagenUrl}
                    alt=""
                    fill
                    sizes="180px"
                    unoptimized
                    className="object-contain p-2"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-gray-400">
                    Sin imagen
                  </span>
                )}
                {subiendo && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-medium text-gray-600">
                    Subiendo…
                  </span>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void subir(f);
                }}
                className="mt-2 block w-full text-xs text-gray-500 file:mr-2 file:rounded-full file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-gray-700"
              />
              <p className="mt-1 text-[11px] text-gray-400">JPG, PNG, WEBP o AVIF. Máx 5 MB.</p>
              {imagenUrl && (
                <button
                  type="button"
                  onClick={() => setImagenUrl('')}
                  className="mt-1 text-[11px] text-red-600 hover:underline"
                >
                  Quitar imagen
                </button>
              )}
            </div>

            {/* ---------- Datos ---------- */}
            <div className="space-y-4">
              <div>
                <label className={label} htmlFor="p-nombre">Nombre</label>
                <input
                  id="p-nombre"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={`mt-1.5 ${input}`}
                  placeholder="Nuez Mariposa"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="p-cat">Categoría</label>
                  <select
                    id="p-cat"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className={`mt-1.5 ${input}`}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="p-orden">Orden</label>
                  <input
                    id="p-orden"
                    type="number"
                    value={orden}
                    onChange={(e) => setOrden(e.target.value)}
                    className={`mt-1.5 ${input}`}
                  />
                </div>
              </div>

              <div>
                <label className={label} htmlFor="p-desc">Descripción</label>
                <textarea
                  id="p-desc"
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className={`mt-1.5 ${input} resize-y`}
                  placeholder="Nuez pelada mitad mariposa, calibre extra."
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Visible en la web (destildar = sin stock)
              </label>
            </div>
          </div>

          {/* ---------- Variantes ---------- */}
          <div className="mt-7 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <p className={label}>Variantes y precios</p>
              <button
                type="button"
                onClick={agregarVariante}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline"
              >
                + Agregar variante
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {variantes.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3 sm:grid-cols-[1fr_110px_110px_100px_32px]"
                >
                  <input
                    value={v.label}
                    onChange={(e) => setVar(i, { label: e.target.value })}
                    placeholder="Nombre (5 kg)"
                    className={input}
                    aria-label="Nombre de la variante"
                  />
                  <select
                    value={v.tipo}
                    onChange={(e) => {
                      const tipo = e.target.value as Variant['tipo'];
                      // `consultar` no lleva precio: lo blanqueamos para que
                      // el server no lo rechace ni quede un numero fantasma.
                      setVar(i, { tipo, precio: tipo === 'consultar' ? null : (v.precio ?? 0) });
                    }}
                    className={input}
                    aria-label="Tipo"
                  >
                    <option value="precio">Con precio</option>
                    <option value="consultar">A consultar</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={v.tipo === 'consultar' ? '' : String(v.precio ?? 0)}
                    onChange={(e) => setVar(i, { precio: Number(e.target.value) })}
                    disabled={v.tipo === 'consultar'}
                    placeholder="Precio"
                    className={`${input} disabled:bg-gray-100 disabled:text-gray-400`}
                    aria-label="Precio"
                  />
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={String(v.peso_kg)}
                    onChange={(e) => setVar(i, { peso_kg: Number(e.target.value) })}
                    placeholder="kg"
                    className={input}
                    aria-label="Peso en kg"
                  />
                  <button
                    type="button"
                    onClick={() => quitarVariante(i)}
                    disabled={variantes.length === 1}
                    aria-label={`Quitar ${v.label || 'variante'}`}
                    className="flex h-9 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              El peso alimenta el cotizador de envíos. El id de cada variante no se puede
              cambiar desde acá: el carrito guardado de los clientes lo usa como clave.
            </p>
          </div>

          {error && (
            <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={ocupado}
            className="rounded-full px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={ocupado || !nombre.trim()}
            className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-40"
          >
            {guardando ? 'Guardando…' : esNuevo ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
