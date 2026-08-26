'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProductoModal from '@/components/admin/ProductoModal';
import { formatARS } from '@/lib/format';
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No pudimos validar la contraseña.');
      try {
        localStorage.setItem(RECORDARME_KEY, recordarme ? '1' : '0');
      } catch {
        /* no es critico */
      }
      onOk();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
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
      <span className="w-24 shrink-0 truncate text-[11px] text-humo/70" title={variante.label}>
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
        className="w-24 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium tabular-nums text-carbon outline-none transition-colors hover:border-carbon/15 hover:bg-white focus:border-[#143620]/40 focus:bg-white focus:ring-2 focus:ring-[#143620]/12"
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
      <div className="flex min-h-dvh items-center justify-center bg-[#0b1c0f] text-sm text-[#f5ebd9]/60">
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
              {productos.length} productos · {productos.filter((p) => p.activo).length} visibles
            </p>
          </div>

          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o categoría…"
            aria-label="Buscar"
            className="h-10 w-full max-w-xs rounded-full border border-carbon/10 bg-white px-4 text-sm text-carbon outline-none transition-colors placeholder:text-humo/50 focus:border-[#143620]/40 focus:ring-2 focus:ring-[#143620]/12 sm:w-64"
          />

          <button
            onClick={() => void cargar()}
            disabled={cargando}
            className="h-10 rounded-full px-4 text-sm font-medium text-humo transition-colors hover:bg-crema hover:text-carbon disabled:opacity-40"
          >
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>

          <button
            onClick={() => setModal({ abierto: true, producto: null })}
            className="h-10 rounded-full bg-[#1e6b32] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_-12px_rgba(30,107,50,0.9)] transition-all duration-200 hover:bg-[#175427] hover:shadow-[0_16px_30px_-12px_rgba(30,107,50,0.95)] active:scale-95"
          >
            + Agregar producto
          </button>

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

        <p className="mb-3 text-xs text-humo">
          Los precios y el estado se guardan solos al salir de la celda. Los cambios impactan en
          la web al instante.
        </p>

        <div className="overflow-hidden rounded-2xl border border-carbon/10 bg-hueso shadow-[0_24px_50px_-35px_rgba(28,26,23,0.5)]">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#143620] to-[#0b1c0f] text-left text-xs uppercase tracking-wider text-[#f5ebd9]/75">
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
                    className={`border-b border-carbon/[0.07] transition-colors duration-200 last:border-0 ${
                      estado === 'ok'
                        ? 'bg-[#1e6b32]/8'
                        : estado === 'error'
                          ? 'bg-[#b3261e]/8'
                          : 'hover:bg-crema/70'
                    } ${p.activo ? '' : 'opacity-55'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-carbon/[0.07] bg-crema">
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
                          <span className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-lg text-tostado/60">
                            {p.nombre.charAt(0)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModal({ abierto: true, producto: p })}
                        className="text-left font-semibold text-carbon underline-offset-2 transition-colors hover:text-[#1e6b32] hover:underline"
                      >
                        {p.nombre}
                      </button>
                      <p className="font-mono text-[11px] text-humo/60">/{p.slug}</p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-crema px-2.5 py-1 text-xs capitalize text-humo">
                        {(p.categoria ?? '—').replace(/-/g, ' ')}
                      </span>
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
                          <span className="text-xs italic text-humo/60">Solo a consultar</span>
                        )}
                        {conPrecio.length > 0 && (
                          <p className="pl-[6.5rem] text-[11px] text-humo/60">
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
                            ? 'border-[#1e6b32]/25 bg-[#1e6b32]/10 text-[#175427]'
                            : 'border-carbon/10 bg-crema text-humo'
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
                        className="w-16 rounded-lg border border-transparent px-2 py-1 text-sm font-medium tabular-nums text-carbon outline-none transition-colors hover:border-carbon/15 hover:bg-white focus:border-[#143620]/40 focus:bg-white focus:ring-2 focus:ring-[#143620]/12"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal({ abierto: true, producto: p })}
                          aria-label={`Editar ${p.nombre}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-humo/60 transition-colors hover:bg-[#1e6b32]/10 hover:text-[#175427]"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => void eliminar(p)}
                          aria-label={`Eliminar ${p.nombre}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-humo/60 transition-colors hover:bg-[#b3261e]/10 hover:text-[#b3261e]"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                          </svg>
                        </button>
                        {estado === 'guardando' && (
                          <span className="text-[11px] text-tostado">…</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && !cargando && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-humo/70">
                    {productos.length === 0
                      ? 'Todavía no hay productos. Empezá con "Agregar producto".'
                      : 'Ningún producto coincide con la búsqueda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
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
          onClose={() => setModal({ abierto: false, producto: null })}
          onGuardado={onGuardado}
        />
      )}
    </div>
  );
}
