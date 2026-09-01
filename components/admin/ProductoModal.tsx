'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Product, Variant } from '@/types';
import { comprimirImagen, formatearBytes } from '@/lib/image-compress';
import { leerJson, mensajeDeError } from '@/lib/fetch-json';

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
  'granola',
];

/**
 * Techo del payload que aceptamos mandar. Las Serverless Functions de Vercel
 * cortan en 4.5 MB y responden texto plano, no JSON: nos quedamos por debajo
 * para fallar con un mensaje nuestro y no con un 413 opaco.
 */
const LIMITE_SUBIDA_BYTES = 4 * 1024 * 1024;

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
  'w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon outline-none transition-colors placeholder:text-humo/50 focus:border-[#143620]/40 focus:ring-2 focus:ring-[#143620]/12';
const label = 'text-xs font-semibold uppercase tracking-wider text-tostado';

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
  const [faseImagen, setFaseImagen] = useState<'optimizando' | 'subiendo' | null>(null);
  const [infoImagen, setInfoImagen] = useState<string | null>(null);
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

  /**
   * Comprime en el navegador y despues sube. La compresion es obligatoria, no
   * un lujo: Vercel corta el request a los 4.5 MB y devuelve un HTML plano,
   * asi que una foto de celular sin tocar nunca llegaria al endpoint.
   */
  const subir = async (original: File) => {
    setSubiendo(true);
    setError(null);
    setInfoImagen(null);

    try {
      setFaseImagen('optimizando');
      const file = await comprimirImagen(original);

      // Red de contencion: si la compresion no alcanzo (imagen enorme o
      // navegador sin canvas), cortamos aca en vez de comerse el 413.
      if (file.size > LIMITE_SUBIDA_BYTES) {
        throw new Error(
          `La imagen sigue pesando ${formatearBytes(file.size)} después de optimizarla. ` +
            'Recortala o exportala más chica antes de subirla.'
        );
      }

      setFaseImagen('subiendo');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slug', nombre || producto?.slug || 'producto');

      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await leerJson<{ url: string; path: string }>(res);

      setImagenUrl(data.url);
      setInfoImagen(
        file.size < original.size
          ? `Optimizada: ${formatearBytes(original.size)} → ${formatearBytes(file.size)}.`
          : `Subida (${formatearBytes(file.size)}).`
      );
    } catch (e) {
      setError(mensajeDeError(e, 'Error al subir la imagen.'));
    } finally {
      setSubiendo(false);
      setFaseImagen(null);
      // Reset del input: sin esto, reintentar con el mismo archivo no dispara
      // el onChange.
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
      const data = await leerJson<{ product: Product }>(res);
      onGuardado(data.product, esNuevo);
    } catch (e) {
      setError(mensajeDeError(e, 'Error al guardar.'));
    } finally {
      setGuardando(false);
    }
  };

  const ocupado = guardando || subiendo;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-[#0b1c0f]/60 backdrop-blur-[2px]" onClick={ocupado ? undefined : onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={esNuevo ? 'Nuevo producto' : `Editar ${producto?.nombre}`}
        className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-[#fdfbf7] shadow-[0_45px_90px_-35px_rgba(11,28,15,0.75)] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-carbon/10 bg-gradient-to-r from-[#143620] to-[#0b1c0f] px-6 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#f5ebd9]">
            {esNuevo ? 'Agregar producto' : 'Editar producto'}
          </h2>
          <button
            onClick={onClose}
            disabled={ocupado}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#f5ebd9]/60 transition-colors hover:bg-white/10 hover:text-[#f5ebd9] disabled:opacity-40"
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
              <div className="mt-2 relative aspect-square w-full overflow-hidden rounded-xl border border-dashed border-carbon/20 bg-crema">
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
                  <span className="flex h-full items-center justify-center text-xs text-humo/60">
                    Sin imagen
                  </span>
                )}
                {subiendo && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-medium text-humo">
                    {faseImagen === 'optimizando' ? 'Optimizando…' : 'Subiendo…'}
                  </span>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={ocupado}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void subir(f);
                }}
                className="mt-2 block w-full text-xs text-humo file:mr-2 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#143620] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#f5ebd9] hover:file:bg-[#0b1c0f]"
              />
              <p className="mt-1 text-[11px] text-humo/60">
                JPG, PNG, WEBP o AVIF. Se optimiza sola: subí la foto original sin
                preocuparte por el peso.
              </p>
              {infoImagen && (
                <p className="mt-1 text-[11px] font-medium text-[#175427]">{infoImagen}</p>
              )}
              {imagenUrl && (
                <button
                  type="button"
                  onClick={() => setImagenUrl('')}
                  className="mt-1 text-[11px] text-[#b3261e] hover:underline"
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

              <label className="flex items-center gap-2 text-sm text-carbon">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 rounded border-carbon/25 accent-[#1e6b32]"
                />
                Visible en la web (destildar = sin stock)
              </label>
            </div>
          </div>

          {/* ---------- Variantes ---------- */}
          <div className="mt-7 border-t border-carbon/10 pt-5">
            <div className="flex items-center justify-between">
              <p className={label}>Variantes y precios</p>
              <button
                type="button"
                onClick={agregarVariante}
                className="text-xs font-medium text-[#175427] transition-colors hover:text-[#0b1c0f] hover:underline"
              >
                + Agregar variante
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {variantes.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-2 rounded-xl border border-carbon/[0.07] bg-crema/70 p-3 transition-colors hover:border-carbon/15 sm:grid-cols-[1fr_110px_110px_100px_32px]"
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
                    className={`${input} disabled:bg-crema disabled:text-humo/50`}
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
                    className="flex h-9 w-8 items-center justify-center rounded-lg text-humo/60 transition-colors hover:bg-[#b3261e]/10 hover:text-[#b3261e] disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-humo/60">
              El peso alimenta el cotizador de envíos. El id de cada variante no se puede
              cambiar desde acá: el carrito guardado de los clientes lo usa como clave.
            </p>
          </div>

          {error && (
            <p className="mt-5 rounded-xl border border-[#b3261e]/20 bg-[#b3261e]/8 px-3.5 py-2.5 text-sm text-[#b3261e]">{error}</p>
          )}
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-carbon/10 bg-crema px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={ocupado}
            className="rounded-full px-4 py-2.5 text-sm font-medium text-humo transition-colors hover:bg-carbon/8 hover:text-carbon disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={ocupado || !nombre.trim()}
            className="rounded-full bg-[#1e6b32] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_-12px_rgba(30,107,50,0.9)] transition-all duration-200 hover:bg-[#175427] active:scale-95 disabled:opacity-40 disabled:shadow-none"
          >
            {guardando ? 'Guardando…' : esNuevo ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
