export default function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-crema pb-24 pt-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-tostado">{eyebrow}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-tight tracking-tight text-carbon">
          {title}
        </h1>
        {intro && <p className="mt-4 text-lg leading-relaxed text-humo">{intro}</p>}
        <div className="mt-10 space-y-5 leading-relaxed text-humo [&_h2]:mt-10 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-carbon [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-carbon">
          {children}
        </div>
      </div>
    </div>
  );
}
