import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell flex min-h-[60vh] flex-col justify-center py-24">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-5 max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] tracking-[-0.02em]">
        Esta página no existe.
      </h1>
      <p className="mt-6 max-w-md text-ink-soft">
        Puede que el link esté viejo o mal escrito.
      </p>
      <Link href="/" className="link-underline mt-8 self-start text-sm" data-active="true">
        Volver al inicio
      </Link>
    </section>
  );
}
