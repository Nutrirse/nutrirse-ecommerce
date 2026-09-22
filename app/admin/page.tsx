'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProductoModal from '@/components/admin/ProductoModal';
import CategoriasPanel from '@/components/admin/CategoriasPanel';
import CalculadoraPrecioBase from '@/components/admin/CalculadoraPrecioBase';
import { leerJson, mensajeDeError } from '@/lib/fetch-json';
import { imagenesDe } from '@/lib/imagenes';
import { indiceCategorias } from '@/lib/categorias';
import type { CategoriaAdmin } from '@/lib/admin-categorias';
import { formatARS } from '@/lib/format';
import { aplicarPrecioBase } from '@/lib/precio-base';
import type { EscalaPeso } from '@/lib/precio-base';
import { NEGOCIO } from '@/lib/site';
import type { Product, Variant } from '@/types';

/** Preferencia del checkbox "Recordarme", no la sesion. */
const RECORDARME_KEY = 'nutrirse_admin_recordarme';

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
  const [recordarme, setRecordarme] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // La preferencia del checkbox se recuerda entre visitas; la sesion en si
  // vive en la cookie httpOnly que emite /api/admin/login.
  useEffect(() => {
    try {
      setRecordarme(localStorage.getItem(RECORDARME_KEY) === '1');
    } catch {
      /* modo privado o storage bloqueado: se queda en false */
    }
  }, []);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, recordarme }),
      });
      await leerJson<{ ok: true }>(res);
      try {
        localStorage.setItem(RECORDARME_KEY, recordarme ? '1' : '0');
      } catch {
        /* no es critico */
      }
      onOk();
    } catch (err) {
      setError(mensajeDeError(err, 'No pudimos validar la contraseña.'));
      setPassword('');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[#0b1c0f] via-[#143620] to-[#0b1c0f] px-4 py-10">
      {/* La animacion vive en un wrapper aparte: si el `transform` corre en el
          mismo elemento que hace el clip redondeado, el navegador rasteriza el
          borde antes de transformarlo y deja los cortes blancos en las esquinas. */}
      <div className="w-full max-w-5xl animate-fade-up">
        <div className="isolate overflow-hidden rounded-3xl bg-[#fdfbf7] shadow-[0_55px_110px_-35px_rgba(0,0,0,0.85)]">
        <div className="grid md:grid-cols-[0.95fr_1fr]">
          {/* ---------------- Columna izquierda: marca ---------------- */}
          <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#143620] to-[#0b1c0f] p-8 pb-0 md:p-10 md:pb-0">
            {/* Halo cálido, el mismo recurso del LogisticsBanner. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(70% 50% at 50% 85%, rgba(214,178,106,0.22), transparent 70%)',
              }}
              aria-hidden
            />

            <div className="relative">
              <Image
                src="/Logo.png"
                alt="Nutrirse"
                width={280}
                height={280}
                priority
                className="h-12 w-auto object-contain"
              />
              <p className="mt-7 font-[family-name:var(--font-hand)] text-[clamp(1.7rem,3vw,2.2rem)] leading-none text-[#d6b26a]">
                Panel interno
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-[1.15] text-[#f5ebd9]">
                Gestión de catálogo y precios mayoristas en tiempo real.
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#f5ebd9]/60">
                Cada cambio que guardás acá impacta al instante en la web y en las
                cotizaciones que reciben tus clientes.
              </p>
            </div>

            {/* `object-bottom` + el `pb-0` del aside la apoyan en la base del
                bloque verde en vez de dejarla flotando. Es decoración: en
                pantallas bajas se recorta por arriba sin romper nada. */}
            <div className="relative mt-8 hidden h-72 w-full self-end lg:h-80 md:block">
              <Image
                src="/chica-nutrirse.png"
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 768px) 0px, 460px"
                className="object-contain object-bottom drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)]"
              />
            </div>
          </aside>

          {/* ---------------- Columna derecha: formulario ---------------- */}
          <form onSubmit={entrar} className="flex flex-col justify-center p-8 sm:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-tostado">
              Acceso interno
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-carbon">
              Iniciar sesión
            </h1>

            {!configurado ? (
              <p className="mt-6 rounded-xl border border-tostado/25 bg-tostado/10 px-4 py-3.5 text-sm leading-relaxed text-nuez">
                Falta definir <code className="font-mono">ADMIN_PASSWORD</code> en el entorno del
                servidor. Agregala a <code className="font-mono">.env.local</code> y reiniciá
                <code className="font-mono"> npm run dev</code>.
              </p>
            ) : (
              <>
                <div className="mt-7">
                  <label
                    htmlFor="admin-email"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-tostado"
                  >
                    Usuario
                  </label>
                  {/* El panel autentica solo con ADMIN_PASSWORD: este campo
                      identifica la cuenta, no es un factor de login. Va
                      readOnly para que no parezca editable. */}
                  <input
                    id="admin-email"
                    type="email"
                    readOnly
                    value={NEGOCIO.email}
                    autoComplete="username"
                    aria-describedby="admin-email-nota"
                    className="w-full cursor-default rounded-xl border border-carbon/10 bg-crema px-4 py-3 text-sm text-humo outline-none"
                  />
                  <p id="admin-email-nota" className="mt-1 text-[11px] text-humo/60">
                    Cuenta única del negocio.
                  </p>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="pass"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-tostado"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="pass"
                      type={verPass ? 'text' : 'password'}
                      autoFocus
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-carbon/10 bg-white px-4 py-3 pr-12 text-sm text-carbon outline-none transition-colors placeholder:text-humo/40 focus:border-[#143620]/45 focus:ring-2 focus:ring-[#143620]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setVerPass((v) => !v)}
                      aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-humo/60 transition-colors hover:bg-crema hover:text-carbon"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                        {verPass && <path d="m3 3 18 18" />}
                      </svg>
                    </button>
                  </div>
                </div>

                <label className="mt-5 flex w-fit cursor-pointer items-center gap-2.5 text-sm text-carbon">
                  <input
                    type="checkbox"
                    checked={recordarme}
                    onChange={(e) => setRecordarme(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-carbon/25 accent-[#143620]"
                  />
                  Recordarme
                  <span className="text-xs text-humo/60">(7 días)</span>
                </label>

                {error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-[#b3261e]/20 bg-[#b3261e]/8 px-3.5 py-2.5 text-sm text-[#b3261e]"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={cargando || password.length === 0}
                  className="mt-6 w-full rounded-full bg-[#143620] py-3.5 text-sm font-semibold tracking-wide text-[#f5ebd9] shadow-[0_14px_30px_-14px_rgba(11,28,15,0.9)] transition-all duration-200 hover:bg-[#0b1c0f] hover:shadow-[0_18px_35px_-14px_rgba(11,28,15,0.95)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {cargando ? 'Verificando…' : 'Ingresar'}
                </button>

                <p className="mt-5 text-center text-[11px] leading-relaxed text-humo/60">
                  Sesión cifrada en cookie httpOnly. Si olvidaste la clave, se rota desde
                  las variables de entorno del servidor.
                </p>
              </>
            )}
          </form>
        </div>
        </div>
      </div>
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
  movil = false,
}: {
  variante: Variant;
  onGuardar: (nuevo: number) => Promise<void>;
  /** En la tarjeta la etiqueta se estira y el input se va al borde derecho. */
  movil?: boolean;
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
    <label className={`flex items-center gap-1.5 ${movil ? 'w-full' : ''}`}>
      <span
        className={`truncate text-[11px] text-humo/70 ${movil ? 'flex-1' : 'w-24 shrink-0'}`}
        title={variante.label}
      >
        {variante.label}
      </span>
      <span className="text-xs text-tostado">$</span>
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
        className={`rounded-lg border bg-transparent px-2 text-sm font-medium tabular-nums text-carbon outline-none transition-colors hover:border-carbon/15 hover:bg-white focus:border-[#143620]/40 focus:bg-white focus:ring-2 focus:ring-[#143620]/12 ${
          movil ? 'h-9 w-28 border-carbon/10 bg-white/70 text-right' : 'w-24 border-transparent py-1'
        }`}
      />
    </label>
  );
}

type EstadoFila = 'idle' | 'guardando' | 'ok' | 'error';

/* ================================================================== */
/* Piezas compartidas entre la tabla y la tarjeta                      */
/* ================================================================== */

/**
 * Todo lo que una fila necesita para pintarse y guardar.
 *
 * Las dos vistas (tabla en `>= sm`, tarjetas en `< sm`) consumen este mismo
 * objeto: los handlers viven una sola vez en el panel, asi que el PATCH
 * optimista, el estado de la fila y los toasts se comportan igual en las dos.
 * Si cada vista armara sus propios callbacks, arreglar un bug de guardado
 * obligaria a arreglarlo dos veces.
 */
type FilaProps = {
  producto: Product;
  estado: EstadoFila;
  /** Nombre visible de la categoria, ya resuelto contra el arbol. */
  etiquetaCategoria: string;
  /** false => el slug no existe como fila en `categories` (base sin migrar). */
  categoriaRegistrada: boolean;
  onEditar: () => void;
  onEliminar: () => void;
  onEstado: (activo: boolean) => void;
  onPrecioBase: (base: number, escala: EscalaPeso) => Promise<void>;
  onPrecioVariante: (variantId: string, precio: number) => Promise<void>;
};

function Miniatura({ producto, clase }: { producto: Product; clase: string }) {
  const fotos = imagenesDe(producto);
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl bg-crema ${clase}`}>
      {fotos[0] ? (
        <Image
          src={fotos[0]}
          alt=""
          fill
          sizes="56px"
          unoptimized
          className="h-full w-full rounded-xl object-cover"
        />
      ) : (
        <span className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-lg text-tostado/60">
          {producto.nombre.charAt(0)}
        </span>
      )}
      {fotos.length > 1 && (
        <span className="absolute bottom-0 right-0 rounded-tl-md bg-carbon/75 px-1 text-[9px] font-semibold text-white">
          {fotos.length}
        </span>
      )}
    </div>
  );
}

function BadgeCategoria({
  producto,
  etiqueta,
  registrada,
}: {
  producto: Product;
  etiqueta: string;
  registrada: boolean;
}) {
  return (
    <span
      className={`inline-block max-w-full truncate rounded-full px-2.5 py-1 text-xs ${
        producto.categoria && !registrada
          ? 'bg-[#b3261e]/10 text-[#b3261e]'
          : 'bg-crema text-humo'
      }`}
      title={producto.categoria ?? undefined}
    >
      {producto.categoria ? etiqueta : 'Sin categoría'}
    </span>
  );
}

function SelectorEstado({
  producto,
  onEstado,
  clase = '',
}: {
  producto: Product;
  onEstado: (activo: boolean) => void;
  clase?: string;
}) {
  return (
    <select
      value={producto.activo ? 'activo' : 'inactivo'}
      onChange={(e) => onEstado(e.target.value === 'activo')}
      aria-label={`Estado de ${producto.nombre}`}
      className={`rounded-full border font-medium outline-none transition-colors ${
        producto.activo
          ? 'border-[#1e6b32]/25 bg-[#1e6b32]/10 text-[#175427]'
          : 'border-carbon/10 bg-crema text-humo'
      } ${clase}`}
    >
      <option value="activo">Activo</option>
      <option value="inactivo">Sin stock</option>
    </select>
  );
}

function Acciones({
  producto,
  onEditar,
  onEliminar,
  guardando,
  clase,
}: {
  producto: Product;
  onEditar: () => void;
  onEliminar: () => void;
  guardando: boolean;
  /** Tamano del area tactil: mas grande en la tarjeta. */
  clase: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onEditar}
        aria-label={`Editar ${producto.nombre}`}
        className={`flex items-center justify-center rounded-lg text-humo/60 transition-colors hover:bg-[#1e6b32]/10 hover:text-[#175427] ${clase}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      <button
        onClick={onEliminar}
        aria-label={`Eliminar ${producto.nombre}`}
        className={`flex items-center justify-center rounded-lg text-humo/60 transition-colors hover:bg-[#b3261e]/10 hover:text-[#b3261e] ${clase}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
      {guardando && <span className="text-[11px] text-tostado">…</span>}
    </div>
  );
}

/** Variantes con precio, editables una por una. */
function Desglose({
  producto,
  onPrecioVariante,
  movil = false,
}: {
  producto: Product;
  onPrecioVariante: FilaProps['onPrecioVariante'];
  movil?: boolean;
}) {
  const conPrecio = producto.precios_por_variante.filter((v) => v.tipo === 'precio');

  if (conPrecio.length === 0) {
    return <span className="text-xs italic text-humo/60">Solo a consultar</span>;
  }

  return (
    <div className={movil ? 'space-y-1' : 'space-y-0.5'}>
      {conPrecio.map((v) => (
        <CeldaPrecio
          key={v.id}
          variante={v}
          movil={movil}
          onGuardar={(n) => onPrecioVariante(v.id, n)}
        />
      ))}
      <p className={`text-[11px] text-humo/60 ${movil ? '' : 'pl-[6.5rem]'}`}>
        {formatARS(conPrecio[0].precio ?? 0)} el más bajo
      </p>
    </div>
  );
}

/** Color de fondo segun el resultado del ultimo guardado. */
function tintado(estado: EstadoFila, base: string): string {
  if (estado === 'ok') return 'bg-[#1e6b32]/8';
  if (estado === 'error') return 'bg-[#b3261e]/8';
  return base;
}

/* ================================================================== */
/* Vista movil: tarjeta apilada (< sm)                                 */
/* ================================================================== */

/**
 * Orden deliberado: identificar el producto, cambiar el precio base, revisar
 * como quedaron las variantes, y recien despues estado y acciones.
 *
 * El precio base va arriba del desglose porque es lo que el cliente viene a
 * hacer desde el telefono; las acciones destructivas quedan al fondo, lejos
 * del pulgar que tipea.
 */
function TarjetaProducto({
  producto,
  estado,
  etiquetaCategoria,
  categoriaRegistrada,
  onEditar,
  onEliminar,
  onEstado,
  onPrecioBase,
  onPrecioVariante,
}: FilaProps) {
  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border border-carbon/10 p-4 transition-colors duration-200 ${tintado(
        estado,
        'bg-hueso'
      )} ${producto.activo ? '' : 'opacity-60'}`}
    >
      {/* Fila 1: identidad */}
      <div className="flex items-start gap-3">
        <Miniatura producto={producto} clase="h-14 w-14" />
        <div className="min-w-0 flex-1">
          {/* line-clamp-2: un nombre largo no puede empujar el badge fuera
              de la tarjeta ni estirarla a cuatro lineas. */}
          <button
            onClick={onEditar}
            className="block w-full overflow-hidden text-left font-semibold leading-snug text-carbon [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]"
          >
            {producto.nombre}
          </button>
          <div className="mt-1">
            <BadgeCategoria
              producto={producto}
              etiqueta={etiquetaCategoria}
              registrada={categoriaRegistrada}
            />
          </div>
        </div>
      </div>

      {/* Fila 2: la accion principal */}
      <CalculadoraPrecioBase
        variantes={producto.precios_por_variante}
        idBase={`${producto.id}-movil`}
        nombre={producto.nombre}
        onGuardar={onPrecioBase}
        grande
      />

      {/* Fila 3: como quedaron las variantes */}
      <Desglose producto={producto} onPrecioVariante={onPrecioVariante} movil />

      {/* Fila 4: estado y acciones */}
      <div className="flex items-center justify-between gap-2 border-t border-carbon/[0.07] pt-3">
        <SelectorEstado producto={producto} onEstado={onEstado} clase="h-10 px-4 text-sm" />
        <Acciones
          producto={producto}
          onEditar={onEditar}
          onEliminar={onEliminar}
          guardando={estado === 'guardando'}
          clase="h-10 w-10"
        />
      </div>
    </li>
  );
}

/* ================================================================== */
/* Vista escritorio: fila de tabla (>= sm)                             */
/* ================================================================== */

function FilaProducto({
  producto,
  estado,
  etiquetaCategoria,
  categoriaRegistrada,
  onEditar,
  onEliminar,
  onEstado,
  onPrecioBase,
  onPrecioVariante,
}: FilaProps) {
  return (
    <tr
      className={`border-b border-carbon/[0.07] transition-colors duration-200 last:border-0 ${tintado(
        estado,
        'hover:bg-crema/70'
      )} ${producto.activo ? '' : 'opacity-55'}`}
    >
      <td className="px-4 py-3">
        <Miniatura producto={producto} clase="h-11 w-11" />
      </td>

      <td className="px-4 py-3">
        <button
          onClick={onEditar}
          className="text-left font-semibold text-carbon underline-offset-2 transition-colors hover:text-[#1e6b32] hover:underline"
        >
          {producto.nombre}
        </button>
        <p className="font-mono text-[11px] text-humo/60">/{producto.slug}</p>
      </td>

      <td className="px-4 py-3">
        <BadgeCategoria
          producto={producto}
          etiqueta={etiquetaCategoria}
          registrada={categoriaRegistrada}
        />
      </td>

      <td className="px-4 py-3">
        <div className="space-y-2">
          <CalculadoraPrecioBase
            variantes={producto.precios_por_variante}
            idBase={`${producto.id}-tabla`}
            nombre={producto.nombre}
            onGuardar={onPrecioBase}
          />
          <Desglose producto={producto} onPrecioVariante={onPrecioVariante} />
        </div>
      </td>

      <td className="px-4 py-3">
        <SelectorEstado
          producto={producto}
          onEstado={onEstado}
          clase="w-full px-3 py-1.5 text-xs"
        />
      </td>

      <td className="px-4 py-3">
        <Acciones
          producto={producto}
          onEditar={onEditar}
          onEliminar={onEliminar}
          guardando={estado === 'guardando'}
          clase="h-8 w-8"
        />
      </td>
    </tr>
  );
}

/* ================================================================== */
/* Panel                                                              */
/* ================================================================== */


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

  /* ---- Categorias (tabla `categories`) ---- */
  const [vista, setVista] = useState<'productos' | 'categorias'>('productos');
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [sueltos, setSueltos] = useState<{ slug: string; productos: number }[]>([]);
  const [cargandoCats, setCargandoCats] = useState(false);

  const { toasts, push } = useToasts();

  /* ---- Sesion ---- */
  useEffect(() => {
    fetch('/api/admin/login')
      .then((r) => leerJson<{ configurado?: boolean; autenticado?: boolean }>(r))
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
      if (res.status === 401) {
        setSesion('no');
        return;
      }
      const data = await leerJson<{ products: Product[] }>(res);
      setProductos(data.products);
    } catch (e) {
      setErrorCarga(mensajeDeError(e, 'No pudimos cargar el catálogo.'));
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarCategorias = useCallback(async () => {
    setCargandoCats(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.status === 401) {
        setSesion('no');
        return;
      }
      const data = await leerJson<{
        categories: CategoriaAdmin[];
        sueltos: { slug: string; productos: number }[];
      }>(res);
      setCategorias(data.categories);
      setSueltos(data.sueltos ?? []);
    } catch (e) {
      // No es fatal para la vista de productos: el selector del modal cae a
      // las categorias que ya usan los productos.
      setErrorCarga(mensajeDeError(e, 'No pudimos cargar las categorías.'));
    } finally {
      setCargandoCats(false);
    }
  }, []);

  /**
   * Renombrar una categoria reetiqueta productos via el CASCADE de la FK, asi
   * que despues de tocar categorias hay que releer las dos tablas.
   */
  const recargarTodo = useCallback(() => {
    void cargar();
    void cargarCategorias();
  }, [cargar, cargarCategorias]);

  useEffect(() => {
    if (sesion === 'si') {
      void cargar();
      void cargarCategorias();
    }
  }, [sesion, cargar, cargarCategorias]);

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
      if (res.status === 401) {
        setSesion('no');
        return;
      }
      const data = await leerJson<{ product: Product }>(res);

      setProductos((ps) => ps.map((x) => (x.id === p.id ? data.product : x)));
      marcar(p.id, 'ok');
      push(`${etiqueta} guardado`);
    } catch (e) {
      setProductos(previo);
      marcar(p.id, 'error');
      push(mensajeDeError(e, 'Error al guardar'), 'error');
    }
  };

  const cambiarPrecio = (p: Product, variantId: string, precio: number) => {
    const variantes = p.precios_por_variante.map((v) =>
      v.id === variantId ? { ...v, precio } : v
    );
    return patch(p, { precios_por_variante: variantes }, 'Precio');
  };

  /**
   * Reescribe las variantes **de una escala** desde su precio base y guarda
   * el producto completo con el mismo PATCH optimista que usa el estado
   * Activo/Inactivo.
   *
   * Manda el array entero de variantes (no solo las recalculadas) para que
   * el precio de la otra escala viaje tal cual estaba: el endpoint reemplaza
   * `precios_por_variante` completo.
   */
  const cambiarPrecioBase = (p: Product, base: number, escala: EscalaPeso) => {
    const variantes = aplicarPrecioBase(p.precios_por_variante, base, escala);
    return patch(p, { precios_por_variante: variantes }, 'Precio base');
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
      await leerJson<{ ok: true }>(res);
      setProductos((ps) => ps.filter((x) => x.id !== p.id));
      push(`"${p.nombre}" eliminado`);
    } catch (e) {
      marcar(p.id, 'error');
      push(mensajeDeError(e, 'Error al eliminar'), 'error');
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
      <div className="flex min-h-dvh items-center justify-center bg-[#0b1c0f] text-sm text-[#f5ebd9]/60">
        Cargando…
      </div>
    );
  }

  if (sesion === 'no') {
    return <Login configurado={configurado} onOk={() => setSesion('si')} />;
  }

  // Indice del arbol de categorias: resuelve nombres visibles con la tabla
  // real y cae a los mapas hardcodeados si todavia no se migro.
  const indice = indiceCategorias(categorias);
  const conocidas = new Set(categorias.map((c) => c.slug));

  /**
   * Adapta un producto a las props que consumen las dos vistas. Vive aca (y
   * no dentro de cada vista) para que la tarjeta y la fila compartan
   * exactamente los mismos callbacks: mismo PATCH optimista, mismo estado de
   * fila, mismos toasts.
   */
  const filaProps = (p: Product) => ({
    producto: p,
    estado: estados[p.id] ?? ('idle' as EstadoFila),
    etiquetaCategoria: p.categoria ? indice.etiqueta(p.categoria) : '',
    categoriaRegistrada: p.categoria ? conocidas.has(p.categoria) : true,
    onEditar: () => setModal({ abierto: true, producto: p }),
    onEliminar: () => void eliminar(p),
    onEstado: (activo: boolean) => void patch(p, { activo }, 'Estado'),
    onPrecioBase: (base: number, escala: EscalaPeso) => cambiarPrecioBase(p, base, escala),
    onPrecioVariante: (variantId: string, precio: number) =>
      cambiarPrecio(p, variantId, precio),
  });

  const vacio =
    productos.length === 0
      ? 'Todavía no hay productos. Empezá con "Agregar producto".'
      : 'Ningún producto coincide con la búsqueda.';

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) || (p.categoria ?? '').toLowerCase().includes(q)
      )
    : productos;

  return (
    <div className="min-h-dvh bg-crema">
      {/* ---------- Barra superior ---------- */}
      <header className="sticky top-0 z-30 border-b border-carbon/10 bg-hueso/95 backdrop-blur">
        {/* Filete dorado: el acento de marca que separa el panel del contenido. */}
        <div className="h-1 bg-gradient-to-r from-[#143620] via-tostado to-[#143620]" aria-hidden />
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-3.5">
          <div className="mr-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-tostado">
              Nutrirse
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-carbon">
              Catálogo
            </h1>
            <p className="text-xs text-humo">
              {productos.length} productos · {productos.filter((p) => p.activo).length} visibles ·{' '}
              {categorias.length} categorías
            </p>
          </div>

          {/* Pestañas: catálogo y ABM de categorías. */}
          <div
            role="tablist"
            aria-label="Secciones del panel"
            className="flex rounded-full bg-crema p-1"
          >
            {(['productos', 'categorias'] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={vista === v}
                onClick={() => setVista(v)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  vista === v
                    ? 'bg-[#143620] text-[#f5ebd9] shadow-sm'
                    : 'text-humo hover:text-carbon'
                }`}
              >
                {v === 'productos' ? 'Productos' : 'Categorías'}
              </button>
            ))}
          </div>

          {vista === 'productos' && (
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o categoría…"
              aria-label="Buscar"
              className="h-10 w-full max-w-xs rounded-full border border-carbon/10 bg-white px-4 text-sm text-carbon outline-none transition-colors placeholder:text-humo/50 focus:border-[#143620]/40 focus:ring-2 focus:ring-[#143620]/12 sm:w-64"
            />
          )}

          <button
            onClick={recargarTodo}
            disabled={cargando || cargandoCats}
            className="h-10 rounded-full px-4 text-sm font-medium text-humo transition-colors hover:bg-crema hover:text-carbon disabled:opacity-40"
          >
            {cargando || cargandoCats ? 'Actualizando…' : 'Actualizar'}
          </button>

          {vista === 'productos' && (
            <button
              onClick={() => setModal({ abierto: true, producto: null })}
              className="h-10 rounded-full bg-[#1e6b32] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_-12px_rgba(30,107,50,0.9)] transition-all duration-200 hover:bg-[#175427] hover:shadow-[0_16px_30px_-12px_rgba(30,107,50,0.95)] active:scale-95"
            >
              + Agregar producto
            </button>
          )}

          <button
            onClick={() => void salir()}
            className="h-10 rounded-full px-3.5 text-sm text-humo/80 transition-colors hover:bg-crema hover:text-carbon"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6">
        {errorCarga && (
          <p className="mb-4 rounded-xl border border-[#b3261e]/20 bg-[#b3261e]/8 px-4 py-3 text-sm text-[#b3261e]">{errorCarga}</p>
        )}

        {vista === 'categorias' ? (
          <CategoriasPanel
            categorias={categorias}
            sueltos={sueltos}
            cargando={cargandoCats}
            onRecargar={recargarTodo}
            push={push}
          />
        ) : (
        <>
        <p className="mb-3 text-xs text-humo">
          Los precios y el estado se guardan solos al salir del campo. Cambiá el Precio Base y
          se recalculan todas las variantes del producto.
        </p>

        {/* La vista movil no es un reflow de la tabla: con `min-w-[900px]`
            el telefono obligaba a scrollear en horizontal hasta la columna de
            precios, que es justo lo unico que el cliente viene a tocar. Las
            dos vistas se arman con los mismos handlers (`filaProps`). */}
        <ul className="space-y-3 sm:hidden">
          {filtrados.map((p) => (
            <TarjetaProducto key={p.id} {...filaProps(p)} />
          ))}
          {filtrados.length === 0 && !cargando && (
            <li className="rounded-xl border border-carbon/10 bg-hueso px-4 py-12 text-center text-sm text-humo/70">
              {vacio}
            </li>
          )}
        </ul>

        <div className="hidden overflow-hidden rounded-2xl border border-carbon/10 bg-hueso shadow-[0_24px_50px_-35px_rgba(28,26,23,0.5)] sm:block">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#143620] to-[#0b1c0f] text-left text-xs uppercase tracking-wider text-[#f5ebd9]/75">
                <th className="w-16 px-4 py-3 font-semibold">Foto</th>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="w-40 px-4 py-3 font-semibold">Categoría</th>
                <th className="w-64 px-4 py-3 font-semibold">Precios</th>
                <th className="w-36 px-4 py-3 font-semibold">Estado</th>
                <th className="w-28 px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <FilaProducto key={p.id} {...filaProps(p)} />
              ))}

              {filtrados.length === 0 && !cargando && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-humo/70">
                    {vacio}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
        </>
        )}
      </main>

      {/* ---------- Toasts ---------- */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ${
              t.tipo === 'ok' ? 'bg-[#143620] text-[#f5ebd9]' : 'bg-[#b3261e] text-white'
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
          categorias={categorias}
          onCategoriaCreada={() => void cargarCategorias()}
          onClose={() => setModal({ abierto: false, producto: null })}
          onGuardado={onGuardado}
        />
      )}
    </div>
  );
}
