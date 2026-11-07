import type { Metadata } from "next";
import Link from "next/link";
import ApriDomanda from "@/components/legale/ApriDomanda";
import PaginaLegale, { type SezioneLegale } from "@/components/legale/PaginaLegale";
import { domandeFrequenti } from "@/data/domande";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Domande frequenti",
  description:
    "Le stampe, il pagamento, la spedizione, i resi e i lavori su commissione: le risposte alle domande che arrivano più spesso.",
  alternates: { canonical: "/domande-frequenti" },
};

/**
 * Le domande di chi sta per comprare —o ha appena comprato— con risposte
 * corte, e un link alla pagina che dice il resto. Il testo vive in
 * `src/data/domande.ts`.
 *
 * Usa la cornice delle pagine legali, perché si legge allo stesso modo: non
 * dall'inizio alla fine, ma cercando il punto che serve. I gruppi sono le
 * sezioni, con l'indice accanto; dentro, ogni domanda è un `<details>`:
 * chiusa, la pagina si scorre come un elenco di domande; si apre con un
 * tocco, con la tastiera e senza JavaScript, e la ricerca del browser trova
 * anche il testo delle risposte chiuse.
 */
export default function DomandeFrequentiPage() {
  const gruppi = domandeFrequenti();

  const sezioni: SezioneLegale[] = gruppi.map((g) => ({
    id: g.id,
    titolo: g.titolo,
    corpo: (
      <div className="domande -mt-1">
        {g.domande.map((q) => (
          <details key={q.id} id={q.id} className="group scroll-mt-28 border-b md:scroll-mt-44 border-line last:border-b-0">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 text-base leading-snug font-medium tracking-[-0.01em] text-ink [&::-webkit-details-marker]:hidden">
              <span>{q.domanda}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="mt-1 size-3.5 shrink-0 text-ink-faint transition-[transform,color] duration-500 ease-[var(--ease-out-soft)] group-open:rotate-45 group-hover:text-ink"
              >
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.25" fill="none" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="space-y-3 pb-6 pr-10">
              {q.risposta.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {q.link && (
                <p>
                  <Link href={q.link.href}>{q.link.testo}</Link>
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    ),
  }));

  // Gli stessi testi, per i motori di ricerca: parole, senza componenti.
  const dati = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${site.url}/domande-frequenti#faq`,
    inLanguage: "it",
    mainEntity: gruppi.flatMap((g) =>
      g.domande.map((q) => ({
        "@type": "Question",
        name: q.domanda,
        acceptedAnswer: { "@type": "Answer", text: q.risposta.join(" ") },
      })),
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // `<` scappato: un testo con «</script>» non chiude il tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dati).replace(/</g, "\\u003c") }}
      />
      <ApriDomanda />
      <PaginaLegale
        titolo="Domande frequenti"
        intro={
          <p>
            Le risposte corte alle domande che mi arrivano più spesso. Le regole precise sono nelle{" "}
            <Link href="/condizioni-di-vendita">condizioni di vendita</Link> e in{" "}
            <Link href="/spedizioni-e-resi">spedizioni e resi</Link>.
          </p>
        }
        sezioni={sezioni}
        chiusura={
          <section aria-labelledby="altro-t" className="border-t border-ink pt-6 pb-10">
            <h2 id="altro-t" className="display-section font-display text-[clamp(1.25rem,2vw,1.5rem)] leading-tight">
              Non hai trovato la risposta?
            </h2>
            <p className="prose-measure mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">
              Chiedimelo direttamente: ti rispondo per mail.
            </p>
            <Link
              href="/contatti"
              className="area-tocco link-underline mt-5 text-sm text-ink"
            >
              Scrivimi
            </Link>
          </section>
        }
      />
    </>
  );
}
