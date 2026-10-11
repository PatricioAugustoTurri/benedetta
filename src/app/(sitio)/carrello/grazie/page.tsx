import type { Metadata } from "next";
import Link from "next/link";
import SvuotaCarrello from "@/components/carrello/SvuotaCarrello";
import { ArrowRight } from "@/components/Icon";
import Reveal from "@/components/Reveal";
import { site } from "@/data/site";
import { confermaPagamento, type Esito } from "@/lib/pagamento";
import { sumupConfigurato } from "@/lib/sumup";

export const metadata: Metadata = {
  title: "Grazie",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dove riporta SumUp dopo il pagamento.
 *
 * La pagina non si fida dell'indirizzo: chiunque può scrivere
 * /carrello/grazie a mano. Con il riferimento chiede a SumUp com'è andata e
 * solo se risulta pagato ringrazia e svuota il carrello.
 *
 * È anche uno dei due ingressi da cui nasce l'ordine: se l'avviso di SumUp
 * non è ancora arrivato —o non arriva, come in locale— l'ordine lo scrive
 * questa pagina. Lo stesso pagamento non ne fa mai due.
 */
export default async function GraziePage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const { r } = await searchParams;

  let esito: Esito = { stato: "sconosciuto" };
  if (r && sumupConfigurato()) {
    try {
      esito = await confermaPagamento(r);
    } catch (e) {
      console.error("Grazie: non ho potuto controllare il pagamento", r, e);
    }
  }

  return (
    <section className="shell flex min-h-[52vh] flex-col justify-center pt-12 pb-8 md:pt-20">
      {esito.stato === "pagato" ? (
        <>
          <SvuotaCarrello />
          <Reveal>
            <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
              Grazie, l&apos;ordine è arrivato.
            </h1>
          </Reveal>
          <Reveal delay={90}>
            <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
              Il pagamento è andato a buon fine. Ti arriva una conferma a{" "}
              <span className="break-all text-ink">{esito.email}</span>. Per qualsiasi domanda,
              scrivimi a{" "}
              <a href={`mailto:${site.email}`} className="link-underline text-ink">
                {site.email}
              </a>
              .
            </p>
          </Reveal>
        </>
      ) : esito.stato === "non_pagato" || esito.stato === "in_attesa" ? (
        <>
          <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
            Il pagamento non è stato completato.
          </h1>
          <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
            Non ti è stato addebitato niente. Il carrello e i tuoi dati sono rimasti com&apos;erano:
            puoi riprovare, anche con un&apos;altra carta.
          </p>
          <Link
            href="/carrello/cassa"
            className="group mt-8 inline-flex items-center gap-1.5 self-start text-sm text-ink transition-colors hover:text-accent"
          >
            <span className="link-underline" data-active="true">
              Torna alla cassa
            </span>
            <ArrowRight size={16} className="shrink-0" />
          </Link>
        </>
      ) : (
        <>
          <h1 className="display-h1 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1]">
            Non trovo questo pagamento.
          </h1>
          <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
            Se hai appena pagato e vedi questa pagina, scrivimi a{" "}
            <a href={`mailto:${site.email}`} className="link-underline text-ink">
              {site.email}
            </a>{" "}
            e controllo io. Il carrello è rimasto com&apos;era.
          </p>
        </>
      )}

      <Link
        href="/shop"
        className="group mt-10 inline-flex items-center gap-1.5 self-start text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <span className="link-underline">Torna allo Shop</span>
        <ArrowRight size={16} className="shrink-0" />
      </Link>
    </section>
  );
}
