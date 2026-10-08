import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/Icon";
import { AZIONE } from "@/components/azione";
import { getIscrittoPerToken } from "@/lib/newsletter";
import { confermaAzione } from "../../actions";

export const metadata: Metadata = {
  title: "Newsletter",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

/**
 * Dove porta il link della mail di conferma.
 *
 * La pagina non conferma da sola: chiede un clic. Molti programmi di posta e
 * antivirus aprono i link di una mail per controllarli, e se bastasse aprire
 * la pagina, l'iscrizione la confermerebbe un robot.
 */
export default async function ConfermaPage({ params }: Params) {
  const { token } = await params;
  const iscritto = await getIscrittoPerToken(token);

  return (
    <section className="shell flex min-h-[52vh] flex-col justify-center pt-12 pb-8 md:pt-20">
      {!iscritto ? (
        <>
          <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
            Questo link non vale più.
          </h1>
          <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
            Forse è passato troppo tempo. Iscriviti di nuovo dal fondo di qualsiasi pagina del
            sito: ti arriva un link nuovo.
          </p>
        </>
      ) : iscritto.stato === "iscritto" ? (
        <>
          <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
            Iscrizione confermata.
          </h1>
          <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
            Grazie! Ti scrivo a <span className="break-all text-ink">{iscritto.email}</span>{" "}
            quando ci sono lavori nuovi o stampe disponibili. In fondo a ogni mail c&apos;è il link
            per smettere di riceverle.
          </p>
        </>
      ) : (
        <>
          <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
            Conferma l&apos;iscrizione.
          </h1>
          <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
            Riceverai la newsletter a <span className="break-all text-ink">{iscritto.email}</span>:
            una mail quando ci sono lavori nuovi o stampe disponibili.
          </p>
          <form action={confermaAzione} className="mt-8">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className={AZIONE}>
              Conferma l&apos;iscrizione
            </button>
          </form>
        </>
      )}

      <Link
        href="/"
        className="group mt-10 inline-flex items-center gap-1.5 self-start text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <span className="link-underline">Vai al sito</span>
        <ArrowRight size={16} className="shrink-0" />
      </Link>
    </section>
  );
}
