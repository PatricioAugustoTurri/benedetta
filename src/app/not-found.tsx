import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft } from "@/components/Icon";

/**
 * El 404 de todo el sitio.
 *
 * Vive en la raíz de `app/` y no dentro de `(sitio)`, porque una dirección
 * que no coincide con ninguna ruta no cae en ningún grupo. Por eso se trae
 * la cabecera y el pie a mano: el layout raíz sólo pone el documento, y sin
 * esto un link viejo dejaría al visitante en una página sin salida.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="shell flex min-h-[60vh] flex-col justify-center py-24">
          <h1 className="display-h1 max-w-2xl text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
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
      </main>
      <Footer />
    </>
  );
}
