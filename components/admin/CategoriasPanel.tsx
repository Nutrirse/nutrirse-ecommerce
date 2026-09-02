'use client';

import { useMemo, useState } from 'react';
import { leerJson, mensajeDeError } from '@/lib/fetch-json';
import { slugCategoria } from '@/lib/categorias';
import type { CategoriaAdmin } from '@/lib/admin-categorias';

type Props = {
  categorias: CategoriaAdmin[];
  /** Productos con una categoria que no existe en la tabla (sin FK puesta). */
  sueltos?: { slug: string; productos: number }[];
  cargando: boolean;
  /** Recarga categorias y catalogo: un rename arrastra productos. */
  onRecargar: () => void;
  push: (texto: string, tipo?: 'ok' | 'error') => void;
};

const input =
  'w-full rounded-lg border border-carbon/10 bg-white px-2.5 py-1.5 text-sm text-carbon outline-none transition-colors placeholder:text-humo/50 focus:border-[#143620]/40 focus:ring-2 focus:ring-[#143620]/12';

/** Cambios pendientes de una fila, mientras el admin edita. */
type Borrador = { nombre: string; slug: string; padre_slug: string };

export default function CategoriasPanel({
  categorias,
  sueltos = [],
  cargando,
  onRecargar,
  push,
}: Props) {
  // Solo las filas tocadas viven acá: las demás se pintan desde `categorias`.
  const [borradores, setBorradores] = useState<Record<string, Borrador>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPadre, setNuevoPadre] = useState('');
  const [creando, setCreando] = useState(false);

  // Padres posibles: solo las raíces. La jerarquía es de un nivel, igual que
  // el mega menú.
  const raices = useMemo(() => categorias.filter((c) => c.padre_slug === null), [categorias]);

  /**
   * Orden de pantalla: cada raíz seguida de sus hijas. Es el mismo orden del
   * mega menú, así el admin ve la estructura que va a publicar.
   */
  const ordenadas = useMemo(() => {
    const hijas = (slug: string) => categorias.filter((c) => c.padre_slug === slug);
    const sinPadre = categorias.filter(
      (c) => c.padre_slug !== null && !categorias.some((x) => x.slug === c.padre_slug)
    );
    return [...raices.flatMap((r) => [r, ...hijas(r.slug)]), ...sinPadre];
  }, [categorias, raices]);

  const borradorDe = (c: CategoriaAdmin): Borrador =>
    borradores[c.id] ?? { nombre: c.nombre, slug: c.slug, padre_slug: c.padre_slug ?? '' };

  const editar = (c: CategoriaAdmin, patch: Partial<Borrador>) =>
    setBorradores((b) => ({ ...b, [c.id]: { ...borradorDe(c), ...patch } }));

  const descartar = (id: string) =>
    setBorradores((b) => {
      const { [id]: _fuera, ...resto } = b;
      return resto;
    });

  const sucia = (c: CategoriaAdmin) => {
    const d = borradores[c.id];
    if (!d) return false;
    return (
      d.nombre.trim() !== c.nombre ||
      d.slug.trim() !== c.slug ||
      d.padre_slug !== (c.padre_slug ?? '')
    );
  };

  /* ---------------- Crear ---------------- */

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = nuevoNombre.trim();
    if (!nombre) return;

    setCreando(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, padre_slug: nuevoPadre || null }),
      });
      await leerJson<{ category: CategoriaAdmin }>(res);
      setNuevoNombre('');
      setNuevoPadre('');
      push(`Categoría "${nombre}" creada`);
      onRecargar();
    } catch (err) {
      push(mensajeDeError(err, 'No pudimos crear la categoría'), 'error');
    } finally {
      setCreando(false);
    }
  };

  /* ---------------- Guardar ---------------- */

  const guardar = async (c: CategoriaAdmin) => {
    const d = borradorDe(c);
    const slugNuevo = slugCategoria(d.slug || d.nombre);

    // Cambiar el slug rompe los links viejos (`?cat=`) y lo que el cliente
    // haya compartido. Vale la pena avisarlo antes, no después.
    if (slugNuevo !== c.slug) {
      const ok = window.confirm(
        `Vas a cambiar el slug de "${c.slug}" a "${slugNuevo}".\n\n` +
          `${c.productos} producto(s) se reetiquetan solos.\n` +
          'Los links viejos con ?cat=' +
          c.slug +
          ' dejan de filtrar.\n\n¿Continuamos?'
      );
      if (!ok) return;
    }

    setOcupado(c.id);
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: d.nombre.trim(),
          slug: slugNuevo,
          padre_slug: d.padre_slug || null,
        }),
      });
      const data = await leerJson<{ category: CategoriaAdmin; reetiquetados: number }>(res);
      descartar(c.id);
      push(
        data.reetiquetados > 0
          ? `Guardado · ${data.reetiquetados} producto(s) reetiquetados`
          : 'Categoría guardada'
      );
      onRecargar();
    } catch (err) {
      push(mensajeDeError(err, 'No pudimos guardar la categoría'), 'error');
    } finally {
      setOcupado(null);
    }
  };

  /* ---------------- Eliminar ---------------- */

  /**
   * Dos pasos: el primer DELETE sin `forzar` devuelve 409 con el conteo de
   * afectados, y ese conteo es el que se le muestra al admin. Así el warning
   * dice la verdad en vez de estimarla desde el estado del cliente.
   */
  const eliminar = async (c: CategoriaAdmin) => {
    setOcupado(c.id);
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });

      if (res.status === 409) {
        const info = (await res.json()) as { productos: number; hijas: number };
        const partes = [
          info.productos > 0 ? `${info.productos} producto(s) quedan sin categoría` : null,
          info.hijas > 0 ? `${info.hijas} subcategoría(s) pasan a ser principales` : null,
        ].filter(Boolean);

        const ok = window.confirm(
          `¿Eliminar "${c.nombre}"?\n\n${partes.join('\n')}\n\n` +
            'Los productos NO se borran: quedan sin categoría y hay que reasignarlos.\n' +
            'Esta acción no se puede deshacer.'
        );
        if (!ok) return;

        const forzado = await fetch(`/api/admin/categories/${c.id}?forzar=1`, {
          method: 'DELETE',
        });
        await leerJson<{ ok: true }>(forzado);
      } else {
        await leerJson<{ ok: true }>(res);
      }

      push(`"${c.nombre}" eliminada`);
      onRecargar();
    } catch (err) {
      push(mensajeDeError(err, 'No pudimos eliminar la categoría'), 'error');
    } finally {
      setOcupado(null);
    }
  };

  return (
    <>
      {/* ---------- Alta ---------- */}
      <form
        onSubmit={crear}
        className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-carbon/10 bg-hueso p-4 shadow-[0_24px_50px_-40px_rgba(28,26,23,0.5)]"
      >
        <div className="min-w-[200px] flex-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-tostado" htmlFor="cat-nombre">
            Nueva categoría
          </label>
          <input
            id="cat-nombre"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Chocolates Colonial"
            className={`mt-1.5 ${input}`}
          />
          <p className="mt-1 text-[11px] text-humo/60">
            Slug: <span className="font-mono">{slugCategoria(nuevoNombre) || '—'}</span>
          </p>
        </div>

        <div className="w-full sm:w-56">
          <label className="text-xs font-semibold uppercase tracking-wider text-tostado" htmlFor="cat-padre">
            Dentro de
          </label>
          <select
            id="cat-padre"
            value={nuevoPadre}
            onChange={(e) => setNuevoPadre(e.target.value)}
            className={`mt-1.5 ${input}`}
          >
            <option value="">— Categoría principal —</option>
            {raices.map((c) => (
              <option key={c.id} value={c.slug}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={creando || !nuevoNombre.trim()}
          className="h-10 rounded-full bg-[#1e6b32] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_-12px_rgba(30,107,50,0.9)] transition-all duration-200 hover:bg-[#175427] active:scale-95 disabled:opacity-40 disabled:shadow-none"
        >
          {creando ? 'Creando…' : '+ Crear'}
        </button>
      </form>

      {sueltos.length > 0 && (
        <p className="mb-4 rounded-xl border border-[#b3261e]/20 bg-[#b3261e]/8 px-4 py-3 text-sm text-[#b3261e]">
          Hay productos apuntando a categorías que no existen en la tabla (
          {sueltos.map((s) => `${s.slug}: ${s.productos}`).join(' · ')}). Creá esas categorías o
          reasigná esos productos.
        </p>
      )}

      {/* ---------- Listado ---------- */}
      <div className="overflow-hidden rounded-2xl border border-carbon/10 bg-hueso shadow-[0_24px_50px_-35px_rgba(28,26,23,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#143620] to-[#0b1c0f] text-left text-xs uppercase tracking-wider text-[#f5ebd9]/75">
                <th className="px-4 py-3 font-semibold">Nombre visible</th>
                <th className="w-56 px-4 py-3 font-semibold">Slug (URL)</th>
                <th className="w-52 px-4 py-3 font-semibold">Dentro de</th>
                <th className="w-24 px-4 py-3 font-semibold">Productos</th>
                <th className="w-40 px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((c) => {
                const d = borradorDe(c);
                const trabajando = ocupado === c.id;
                const esHija = c.padre_slug !== null;
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-carbon/[0.07] transition-colors duration-200 last:border-0 ${
                      sucia(c) ? 'bg-tostado/8' : 'hover:bg-crema/70'
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <div className={`flex items-center gap-2 ${esHija ? 'pl-4' : ''}`}>
                        {esHija && <span className="text-humo/40" aria-hidden>└</span>}
                        <input
                          value={d.nombre}
                          onChange={(e) => editar(c, { nombre: e.target.value })}
                          aria-label={`Nombre de ${c.nombre}`}
                          className={input}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <input
                        value={d.slug}
                        onChange={(e) => editar(c, { slug: e.target.value })}
                        aria-label={`Slug de ${c.nombre}`}
                        className={`${input} font-mono text-xs`}
                      />
                      {slugCategoria(d.slug) !== d.slug && (
                        <p className="mt-0.5 text-[11px] text-tostado">
                          Se guardará como{' '}
                          <span className="font-mono">{slugCategoria(d.slug) || '—'}</span>
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      <select
                        value={d.padre_slug}
                        onChange={(e) => editar(c, { padre_slug: e.target.value })}
                        aria-label={`Categoría padre de ${c.nombre}`}
                        className={input}
                      >
                        <option value="">— Principal —</option>
                        {raices
                          // No puede ser hija de sí misma; y si ya tiene
                          // hijas, moverla adentro de otra dejaría un nivel 3.
                          .filter((r) => r.slug !== c.slug)
                          .map((r) => (
                            <option key={r.id} value={r.slug}>{r.nombre}</option>
                          ))}
                      </select>
                    </td>

                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${
                          c.productos > 0 ? 'bg-[#1e6b32]/10 text-[#175427]' : 'bg-crema text-humo/70'
                        }`}
                      >
                        {c.productos}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {sucia(c) ? (
                          <>
                            <button
                              onClick={() => void guardar(c)}
                              disabled={trabajando}
                              className="rounded-full bg-[#1e6b32] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#175427] disabled:opacity-40"
                            >
                              {trabajando ? 'Guardando…' : 'Guardar'}
                            </button>
                            <button
                              onClick={() => descartar(c.id)}
                              disabled={trabajando}
                              className="rounded-full px-2.5 py-1.5 text-xs text-humo transition-colors hover:text-carbon disabled:opacity-40"
                            >
                              Descartar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => void eliminar(c)}
                            disabled={trabajando}
                            aria-label={`Eliminar ${c.nombre}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-humo/60 transition-colors hover:bg-[#b3261e]/10 hover:text-[#b3261e] disabled:opacity-40"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {ordenadas.length === 0 && !cargando && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-humo/70">
                    No hay categorías todavía. Creá la primera arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-humo">
        El nombre visible es lo único que ve el cliente. Cambiar el slug reetiqueta los productos
        solo (la base lo arrastra por foreign key), pero invalida los links viejos con{' '}
        <span className="font-mono">?cat=</span>. Las subcategorías se muestran dentro de su
        principal en el menú, y filtrar por la principal trae también sus productos.
      </p>
    </>
  );
}
