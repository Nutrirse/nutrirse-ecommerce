import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-5 text-center">
      <p className="font-[family-name:var(--font-display)] text-6xl font-semibold text-nuez">404</p>
      <p className="mt-3 text-humo">No encontramos esta página.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-carbon px-6 text-sm font-medium text-hueso"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
