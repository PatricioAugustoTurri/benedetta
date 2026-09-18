import Link from "next/link";
import { ArrowLeft } from "@/components/Icon";

export default function NotFound() {
  return (
    <section className="shell flex min-h-[60vh] flex-col justify-center py-24">
      <h1 className="display-lead max-w-2xl font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] tracking-[-0.02em] text-balance">
        Esta página no existe.
      </h1>
      <p className="prose-measure mt-6 text-ink-soft">
        Puede que el link esté viejo o mal escrito. El archivo completo sigue en su lugar.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 self-start text-sm"
      >
        <ArrowLeft size={16} className="shrink-0" />
        <span className="link-underline" data-active="true">
          Ir al archivo
        </span>
      </Link>
    </section>
  );
}
