'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product, Variant } from '@/types';
import { comprimirImagen, formatearBytes } from '@/lib/image-compress';
import { leerJson, mensajeDeError } from '@/lib/fetch-json';
import { imagenesDe, MAX_IMAGENES } from '@/lib/imagenes';
import { indiceCategorias, slugCategoria, type Categoria } from '@/lib/categorias';
import { alcanzadasPorPrecioBase, aplicarPrecioBaseGlobal } from '@/lib/precio-base';

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
  /**
   * Categorias reales (tabla `categories`). El selector no acepta texto
   * libre: crear una categoria nueva la da de alta en la tabla, para que
   * despues se pueda renombrar o borrar desde su propio ABM.
   */
  categorias?: Categoria[];
  onClose: () => void;
  onGuardado: (p: Product, esNuevo: boolean) => void;
  /** Avisa al panel que la lista de categorias cambio, para releerla. */
  onCategoriaCreada?: (slug: string) => void;
};

const input =
  'w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon outline-none transition-colors placeholder:text-humo/50 focus:border-[#143620]/40 focus:ring-2 focus:ring-[#143620]/12';
const label = 'text-xs font-semibold uppercase tracking-wider text-tostado';

export default function ProductoModal({
  producto,
  categorias = [],
  onClose,
  onGuardado,
  onCategoriaCreada,
}: Props) {
  const esNuevo = producto === null;

  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [categoria, setCategoria] = useState(producto?.categoria ?? '');
  // `nuevaCategoria` solo se usa mientras el selector esta en modo "crear".
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
  const [composicion, setComposicion] = useState(producto?.composicion ?? '');
  const [imagenes, setImagenes] = useState<string[]>(producto ? imagenesDe(producto) : []);
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [variantes, setVariantes] = useState<Variant[]>(
    producto?.precios_por_variante?.length ? producto.precios_por_variante : VARIANTES_BASE
  );

  /**
   * Calculadora de carga: no se persiste ni viaja en el body. Solo sirve para
   * derivar los precios de las variantes desde el precio por kilo y evitar que
   * el admin haga la multiplicacion a mano.
   */
  const [precioKg, setPrecioKg] = useState('');

  const [subiendo, setSubiendo] = useState(false);
  const [faseImagen, setFaseImagen] = useState<string | null>(null);
  const [infoImagen, setInfoImagen] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nuevaCatRef = useRef<HTMLInputElement>(null);

  // Arbol de categorias: el selector las agrupa por principal, igual que el
  // mega menu, asi el admin ve donde va a caer el producto.
  const indice = useMemo(() => indiceCategorias(categorias), [categorias]);
  const conocidas = useMemo(() => new Set(categorias.map((c) => c.slug)), [categorias]);

  const libres = MAX_IMAGENES - imagenes.length;

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

  useEffect(() => {
    if (creandoCategoria) nuevaCatRef.current?.focus();
  }, [creandoCategoria]);

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

  /* ---------------- Calculadora por kilo ---------------- */

  const kgNumero = Number(precioKg);
  const kgValido = precioKg.trim() !== '' && Number.isFinite(kgNumero) && kgNumero > 0;

  /**
   * Rellena el precio de cada variante con `precio por kg * peso_kg`.
   *
   * Es un disparo puntual (no un useEffect): despues de aplicarlo el admin
   * sigue editando cada precio a mano, y un efecto que recalcule en cada
   * tecla le pisaria los redondeos (39.750 -> 39.000).
   */
  const aplicarPrecioKg = () => {
    if (!kgValido) return;
    setVariantes((vs) => aplicarPrecioBaseGlobal(vs, kgNumero));
  };

  /** Cuantas variantes tocaria el boton, para avisarlo antes de apretarlo. */
  const alcanzadas = alcanzadasPorPrecioBase(variantes);

  /* ---------------- Categoria creable ---------------- */

  const cancelarCategoria = () => {
    setCreandoCategoria(false);
    setNuevaCategoria('');
  };

  /**
   * Da de alta la categoria en la tabla `categories` y la selecciona.
   *
   * No alcanza con guardar el string en el producto: la FK
   * `products_categoria_fkey` exige que el slug exista como fila, y una
   * categoria que no es fila no se puede renombrar ni borrar desde el ABM.
   */
  const confirmarCategoria = async () => {
    const nombre = nuevaCategoria.trim();
    const slug = slugCategoria(nombre);
    if (!slug) {
      cancelarCategoria();
      return;
    }

    // Ya esta en la lista: no hace falta ir al servidor.
    if (conocidas.has(slug)) {
      setCategoria(slug);
      cancelarCategoria();
      return;
    }

    setGuardandoCategoria(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, slug }),
      });

      // 409 = el slug ya existia (creado en otra pestana, o fuera del menu).
      // Igual sirve: se selecciona esa y listo.
      if (res.status !== 409) await leerJson<{ category: Categoria }>(res);

      setCategoria(slug);
      onCategoriaCreada?.(slug);
      cancelarCategoria();
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos crear la categoria.'));
    } finally {
      setGuardandoCategoria(false);
    }
  };

  /* ---------------- Imagenes ---------------- */

  /**
   * Comprime en el navegador y despues sube, de a una y en orden. La
   * compresion es obligatoria, no un lujo: Vercel corta el request a los
   * 4.5 MB y devuelve un HTML plano, asi que una foto de celular sin tocar
   * nunca llegaria al endpoint.
   */
  const subir = async (elegidos: File[]) => {
    if (elegidos.length === 0) return;

    const cupo = elegidos.slice(0, libres);
    const sobrantes = elegidos.length - cupo.length;

    setSubiendo(true);
    setError(null);
    setInfoImagen(null);

    let pesoOriginal = 0;
    let pesoFinal = 0;
    const subidas: string[] = [];

    try {
      for (let i = 0; i < cupo.length; i++) {
        const original = cupo[i];
        const de = cupo.length > 1 ? ` (${i + 1} de ${cupo.length})` : '';

        setFaseImagen(`Optimizando…${de}`);
        const file = await comprimirImagen(original);

        // Red de contencion: si la compresion no alcanzo (imagen enorme o
        // navegador sin canvas), cortamos aca en vez de comerse el 413.
        if (file.size > LIMITE_SUBIDA_BYTES) {
          throw new Error(
            `"${original.name}" sigue pesando ${formatearBytes(file.size)} después de ` +
              'optimizarla. Recortala o exportala más chica antes de subirla.'
          );
        }

        setFaseImagen(`Subiendo…${de}`);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('slug', nombre || producto?.slug || 'producto');

        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const data = await leerJson<{ url: string; path: string }>(res);

        subidas.push(data.url);
        pesoOriginal += original.size;
        pesoFinal += file.size;
      }

      const cuenta = `${subidas.length} ${subidas.length === 1 ? 'imagen' : 'imágenes'}`;
      const info = `${cuenta}: ${formatearBytes(pesoOriginal)} → ${formatearBytes(pesoFinal)}.`;
      setInfoImagen(
        sobrantes > 0
          ? `${info} Se ignoraron ${sobrantes} porque el máximo es ${MAX_IMAGENES}.`
          : info
      );
    } catch (e) {
      setError(mensajeDeError(e, 'Error al subir la imagen.'));
    } finally {
      // Lo que alcanzo a subir se conserva: descartarlo obligaria a subir
      // todo de nuevo por un fallo en la ultima foto.
      if (subidas.length > 0) {
        setImagenes((prev) => [...new Set([...prev, ...subidas])].slice(0, MAX_IMAGENES));
      }
      setSubiendo(false);
      setFaseImagen(null);
      // Reset del input: sin esto, reintentar con el mismo archivo no dispara
      // el onChange.
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const quitarImagen = (i: number) => setImagenes((xs) => xs.filter((_, k) => k !== i));

  /** Manda una foto al frente: la posicion 0 es la que ve todo el sitio. */
  const hacerPrincipal = (i: number) =>
    setImagenes((xs) => (i === 0 ? xs : [xs[i], ...xs.filter((_, k) => k !== i)]));

  /* ---------------- Guardado ---------------- */

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const body = {
      nombre: nombre.trim(),
      categoria: categoria || null,
      descripcion: descripcion.trim() || null,
      composicion: composicion.trim() || null,
      // La principal la deriva el servidor de imagenes[0]. Se manda igual
      // para que la fila quede consistente incluso sin galeria.
      imagen_url: imagenes[0] ?? null,
      imagenes,
      activo,
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
          <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
            {/* ---------- Galeria ---------- */}
            <div>
              <div className="flex items-baseline justify-between">
                <p className={label}>Imágenes</p>
                <span className="text-[11px] text-humo/60">
                  {imagenes.length}/{MAX_IMAGENES}
                </span>
              </div>

              {/* La principal ocupa todo el contenedor: la foto llega al borde
                  y el redondeo se aplica sobre la imagen, sin marco blanco. */}
              <div className="mt-2 relative aspect-square w-full overflow-hidden rounded-xl bg-crema">
                {imagenes[0] ? (
                  <Image
                    src={imagenes[0]}
                    alt=""
                    fill
                    sizes="220px"
                    unoptimized
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center rounded-xl border border-dashed border-carbon/20 text-xs text-humo/60">
                    Sin imagen
                  </span>
                )}
                {subiendo && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/85 text-xs font-medium text-humo">
                    {faseImagen ?? 'Subiendo…'}
                  </span>
                )}
              </div>

              {/* Miniaturas. La primera es la principal; tocar otra la asciende. */}
              {imagenes.length > 0 && (
                <ul className="mt-2 grid grid-cols-3 gap-2">
                  {imagenes.map((url, i) => (
                    <li key={url} className="relative">
                      <button
                        type="button"
                        onClick={() => hacerPrincipal(i)}
                        disabled={ocupado || i === 0}
                        title={i === 0 ? 'Imagen principal' : 'Usar como principal'}
                        aria-label={
                          i === 0 ? 'Imagen principal' : `Usar imagen ${i + 1} como principal`
                        }
                        className={`relative block aspect-square w-full overflow-hidden rounded-lg ring-2 transition-all disabled:cursor-default ${
                          i === 0 ? 'ring-[#1e6b32]' : 'ring-transparent hover:ring-carbon/25'
                        }`}
                      >
                        <Image src={url} alt="" fill sizes="70px" unoptimized className="h-full w-full object-cover" />
                        {i === 0 && (
                          <span className="absolute inset-x-0 bottom-0 bg-[#1e6b32] py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-white">
                            Principal
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => quitarImagen(i)}
                        disabled={ocupado}
                        aria-label={`Quitar imagen ${i + 1}`}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#b3261e] text-white shadow-md transition-transform hover:scale-110 disabled:opacity-40"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={ocupado || libres === 0}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) void subir(files);
                }}
                className="mt-2 block w-full text-xs text-humo file:mr-2 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#143620] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#f5ebd9] hover:file:bg-[#0b1c0f] disabled:opacity-50"
              />
              <p className="mt-1 text-[11px] text-humo/60">
                {libres === 0
                  ? `Llegaste al máximo de ${MAX_IMAGENES}. Quitá una para subir otra.`
                  : `Hasta ${MAX_IMAGENES} fotos (podés elegir varias juntas). Se optimizan solas: subí la original sin preocuparte por el peso.`}
              </p>
              {infoImagen && (
                <p className="mt-1 text-[11px] font-medium text-[#175427]">{infoImagen}</p>
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

              <div>
                <div className="flex items-baseline justify-between">
                  <label className={label} htmlFor={creandoCategoria ? 'p-cat-nueva' : 'p-cat'}>
                    Categoría
                  </label>
                  {!creandoCategoria && (
                    <button
                      type="button"
                      onClick={() => setCreandoCategoria(true)}
                      className="text-xs font-medium text-[#175427] transition-colors hover:text-[#0b1c0f] hover:underline"
                    >
                      + Crear categoría
                    </button>
                  )}
                </div>

                {creandoCategoria ? (
                  <div className="mt-1.5 flex gap-2">
                    <input
                      ref={nuevaCatRef}
                      id="p-cat-nueva"
                      value={nuevaCategoria}
                      onChange={(e) => setNuevaCategoria(e.target.value)}
                      onKeyDown={(e) => {
                        // Enter dentro de un form haria submit: aca la tecla
                        // confirma la categoria, no guarda el producto.
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void confirmarCategoria();
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelarCategoria();
                        }
                      }}
                      placeholder="Frutas Confitadas"
                      className={input}
                    />
                    <button
                      type="button"
                      onClick={() => void confirmarCategoria()}
                      disabled={guardandoCategoria || !nuevaCategoria.trim()}
                      className="shrink-0 rounded-xl bg-[#1e6b32] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#175427] disabled:opacity-40"
                    >
                      {guardandoCategoria ? 'Creando...' : 'Crear'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelarCategoria}
                      disabled={guardandoCategoria}
                      className="shrink-0 rounded-xl px-2 text-sm text-humo transition-colors hover:text-carbon disabled:opacity-40"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <select
                    id="p-cat"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className={`mt-1.5 ${input}`}
                  >
                    <option value="">&mdash; Sin categoria &mdash;</option>

                    {/* Una categoria que no es fila de la tabla (base sin
                        migrar) tiene que poder verse seleccionada igual, o el
                        select la cambiaria en silencio al guardar. */}
                    {categoria && !conocidas.has(categoria) && (
                      <option value={categoria}>{categoria} (sin registrar)</option>
                    )}

                    {indice.raices.map((raiz) => {
                      const hijas = indice.hijas(raiz.slug);
                      if (hijas.length === 0) {
                        return <option key={raiz.id} value={raiz.slug}>{raiz.nombre}</option>;
                      }
                      return (
                        <optgroup key={raiz.id} label={raiz.nombre}>
                          <option value={raiz.slug}>{raiz.nombre} (general)</option>
                          {hijas.map((h) => (
                            <option key={h.id} value={h.slug}>{h.nombre}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                )}

                <p className="mt-1 text-[11px] text-humo/60">
                  {creandoCategoria
                    ? nuevaCategoria.trim()
                      ? `Se guardará como “${slugCategoria(nuevaCategoria) || '—'}”.`
                      : 'Escribí el nombre visible; el slug se genera solo.'
                    : 'Las categorías nuevas aparecen en el filtro del catálogo al guardar.'}
                </p>
              </div>

              <div>
                <label className={label} htmlFor="p-composicion">Composición</label>
                <input
                  id="p-composicion"
                  maxLength={200}
                  value={composicion}
                  onChange={(e) => setComposicion(e.target.value)}
                  className={`mt-1.5 ${input}`}
                  placeholder="Almendra, Nuez, Pasas"
                />
                <p className="mt-1 text-[11px] text-humo/60">
                  Opcional. Una línea con los ingredientes: se muestra como “Contiene: …”
                  debajo del nombre, antes de los precios. Útil en los mixes.
                </p>
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

            {/* ---------- Calculadora rapida ---------- */}
            <div className="mt-3 rounded-xl border border-[#1e6b32]/20 bg-[#1e6b32]/[0.06] p-3">
              <label className={label} htmlFor="p-precio-kg">
                Calculadora rápida: Precio por Kg
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="p-precio-kg"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={precioKg}
                  onChange={(e) => setPrecioKg(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter dentro del form haria submit: aca aplica el calculo.
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      aplicarPrecioKg();
                    }
                  }}
                  placeholder="7950"
                  className={`${input} bg-white`}
                />
                <button
                  type="button"
                  onClick={aplicarPrecioKg}
                  disabled={!kgValido || alcanzadas === 0}
                  className="shrink-0 rounded-xl bg-[#1e6b32] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#175427] disabled:opacity-40"
                >
                  Aplicar a variantes
                </button>
              </div>
              <p className="mt-1 text-[11px] text-humo/60">
                {kgValido && alcanzadas > 0
                  ? `Pisa el precio de ${alcanzadas} ${
                      alcanzadas === 1 ? 'variante' : 'variantes'
                    } con precio por kg × peso. Después podés ajustar cada uno a mano.`
                  : 'Auxiliar de carga: no se guarda en la base. Calcula precio por kg × peso de cada variante (ignora las “a consultar” y las sin peso).'}
              </p>
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
