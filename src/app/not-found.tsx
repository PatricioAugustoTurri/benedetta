import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft } from "@/components/Icon";

/**
 * Il 404 di tutto il sito.
 *
 * Vive nella radice di `app/` e non dentro `(sitio)`, perché un indirizzo che
 * non corrisponde a nessun percorso non cade in nessun gruppo. Per questo
 * porta con sé header e footer a mano: il layout radice mette solo il
 * documento, e senza questo un link vecchio lascerebbe il visitatore in una
 * pagina senza uscita.
 */
// Senza, la scheda diceva il titolo della home: chi ha tre schede aperte non
// capiva quale fosse quella sbagliata.
export const metadata: Metadata = { title: "Pagina non trovata" };

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="shell flex min-h-[60vh] flex-col justify-center py-24">
          <h1 className="display-h1 max-w-2xl text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
            Questa pagina non esiste.
          </h1>
          <p className="prose-measure mt-6 text-ink-soft">
            Forse il link è vecchio o scritto male. L&apos;archivio completo è sempre al suo posto.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 self-start text-sm"
          >
            <ArrowLeft size={16} className="shrink-0" />
            <span className="link-underline" data-active="true">
              Vai all&apos;archivio
            </span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
