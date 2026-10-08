import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/Icon";
import { AZIONE } from "@/components/azione";
import { getIscrittoPerToken } from "@/lib/newsletter";
import { disiscriviAzione } from "../../actions";

export const metadata: Metadata = {
  title: "Newsletter",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

/**
 * Dove porta «Non voglio più riceverla» in fondo a ogni newsletter. Un clic,
 * senza domande né motivi da scegliere. Il pulsante c'è per la stessa ragione
 * della conferma: un antivirus che apre il link non deve disiscrivere
 * nessuno.
 */
export default async function DisiscrivitiPage({ params }: Params) {
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
            Il tuo indirizzo non è nella lista: non riceverai mail.
          </p>
        </>
      ) : iscritto.stato !== "iscritto" ? (
        <>
          <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
            Fatto.
          </h1>
          <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
            Non riceverai più la newsletter a{" "}
            <span className="break-all text-ink">{iscritto.email}</span>. Se hai cambiato idea,
            puoi iscriverti di nuovo dal fondo di qualsiasi pagina del sito.
          </p>
        </>
      ) : (
        <>
          <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
            Non vuoi più ricevere la newsletter?
          </h1>
          <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
            Tolgo <span className="break-all text-ink">{iscritto.email}</span> dalla lista. Non
            riceverai altre mail.
          </p>
          <form action={disiscriviAzione} className="mt-8">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className={AZIONE}>
              Disiscrivimi
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
