import type { ReactNode } from 'react';

export type SeccionLegal = { titulo: string; cuerpo: ReactNode };

/**
 * Layout comun de los textos legales: header, indice con anclas y
 * secciones. Mismo look que /politica-de-devolucion.
 */
export default function LegalPage({
  titulo,
  intro,
  secciones,
  actualizado,
}: {
  titulo: string;
  intro: ReactNode;
  secciones: SeccionLegal[];
  /** ISO (YYYY-MM-DD). Fecha fija: `new Date()` cambiaria en cada build. */
  actualizado: string;
}) {
  const fecha = new Date(`${actualizado}T12:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-dvh bg-crema pb-24 pt-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <header className="border-b border-black/10 pb-10">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-tostado">Legales</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.1rem,5.5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight text-carbon">
            {titulo}
          </h1>
          <div className="mt-4 leading-relaxed text-humo">{intro}</div>
        </header>

        <nav aria-label="Contenido" className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-humo">Contenido</p>
          <ol className="mt-3 space-y-1.5">
            {secciones.map((s, i) => (
              <li key={s.titulo}>
                <a href={`#seccion-${i + 1}`} className="text-sm text-nuez underline-offset-4 hover:underline">
                  {i + 1}. {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-14 space-y-14">
          {secciones.map((s, i) => (
            <section key={s.titulo} id={`seccion-${i + 1}`} className="scroll-mt-28">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-carbon sm:text-3xl">
                {i + 1}. {s.titulo}
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed text-humo [&_a]:text-nuez [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_li]:list-disc [&_li]:marker:text-tostado [&_strong]:text-carbon [&_ul]:space-y-2">
                {s.cuerpo}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 text-xs leading-relaxed text-humo/70">Última actualización: {fecha}.</p>
      </div>
    </div>
  );
}
