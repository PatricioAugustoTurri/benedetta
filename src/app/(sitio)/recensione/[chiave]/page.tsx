import type { Metadata } from "next";
import Link from "next/link";
import Stelle from "@/components/Stelle";
import { prodottoHref } from "@/data/shop";
import { MAX_RECENSIONE, nomeProprio, ordinePerChiave } from "@/lib/recensioni";
import { immagineFerma } from "@/lib/video";
import ModuloRecensioni from "../components/ModuloRecensioni";

export const metadata: Metadata = {
  title: "La tua recensione",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ chiave: string }> };

/**
 * Dove porta il link della recensione: quello della mail di spedizione, o
 * quello che lei manda dall'ordine. Senza account: la chiave del link è
 * l'ordine. O un invito, il QR che lei dà a chi ha comprato fuori dal sito:
 * allora c'è un prodotto solo, e niente numero d'ordine né nome. Si vedono solo i prodotti di quell'ordine, e il link vale per
 * un invio solo: dopo, resta il grazie con quello che ha scritto.
 */
export default async function RecensionePage({ params }: Params) {
  const { chiave } = await params;
  const ordine = await ordinePerChiave(chiave).catch((e) => {
    console.error("Recensioni: ordine non letto.", e);
    return null;
  });

  if (!ordine) {
    return (
      <Messaggio titolo="Adesso non riesco ad aprirla.">
        Riprova fra poco. Se continua a non andare, rispondi alla mail dell’ordine.
      </Messaggio>
    );
  }
  if (ordine.stato === "nessuno") {
    return (
      <Messaggio titolo="Questo link non è valido.">
        Controlla che sia arrivato intero dalla mail: è lungo, e a volte si spezza.
      </Messaggio>
    );
  }
  if (ordine.stato === "rimborsato") {
    return <Messaggio titolo="Quest’ordine è stato rimborsato.">Non ci sono prodotti da recensire.</Messaggio>;
  }
  if (ordine.stato === "presto") {
    return (
      <Messaggio titolo={`${saluto(ordine.nome)} è ancora presto.`}>
        Il tuo ordine #{ordine.id} non è ancora partito. Quando arriva, torna su questo link: sarà qui ad
        aspettarti.
      </Messaggio>
    );
  }

  /*
    Il link vale per un invio solo. Una volta usato resta il grazie, con
    quello che ha scritto: chi riapre il QR settimane dopo trova le sue
    parole, non un modulo che non accetterebbe niente. È anche quello che si
    vede subito dopo aver inviato: l'azione rifà questa pagina.
  */
  if (ordine.usata) {
    const fatte = ordine.prodotti.filter((p) => p.recensione);
    const nome = nomeProprio(ordine.nome);
    return (
      <section className="shell pt-12 pb-8 md:pt-20">
        {!ordine.dalVivo && <p className="label mb-5">Ordine #{ordine.id}</p>}
        <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
          {nome ? `Grazie, ${nome}!` : "Grazie!"}
        </h1>
        <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
          {fatte.length > 0
            ? "Le tue parole sono già nello Shop. Mi aiuta tantissimo sapere com’è arrivato e dove l’hai messo."
            : ordine.dalVivo
              ? "Questo QR è già stato usato: vale per una recensione sola."
              : "La recensione di quest’ordine è già stata lasciata."}
        </p>

        {fatte.length > 0 && (
          <div className="mt-14 max-w-3xl border-t border-line pt-10">
            <h2 className="label">{fatte.length > 1 ? "Le tue recensioni" : "La tua recensione"}</h2>
            <ul className="mt-6 space-y-8">
              {fatte.map(({ prodotto: p, recensione: r }) => (
                <li key={p.id}>
                  <Link href={prodottoHref(p)} className="display-title link-underline font-display">
                    {p.title}
                  </Link>
                  <div className="mt-2 text-sm">
                    <Stelle voto={r!.voto} />
                  </div>
                  <p className="prose-measure mt-2 text-ink-soft">{r!.testo}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  if (ordine.prodotti.length === 0) {
    return (
      <Messaggio titolo="Non c’è niente da recensire.">
        {ordine.dalVivo ? "Questo prodotto non è più nello Shop." : "I prodotti di quest’ordine non sono più nello Shop."}
      </Messaggio>
    );
  }

  const piu = ordine.prodotti.length > 1;

  return (
    <section className="shell pt-12 pb-8 md:pt-20">
      {!ordine.dalVivo && <p className="label mb-5">Ordine #{ordine.id}</p>}
      <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
        {`${saluto(ordine.nome)} com’è andata?`}
      </h1>
      <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
 {ordine.dalVivo
          ? "Lascia le stelle e due righe su quello che hai preso: escono nella pagina dello Shop, con il tuo nome. Non serve nessun account, e il QR vale per un invio solo."
          : piu
          ? "Lascia le stelle e due righe ai prodotti del tuo ordine: escono nella pagina dello Shop, con il tuo nome. Non serve nessun account. Puoi saltare quello che non vuoi recensire, ma il link vale per un invio solo: quello che lasci vuoto non si potrà aggiungere dopo."
          : "Lascia le stelle e due righe su quello che hai comprato: escono nella pagina dello Shop, con il tuo nome. Non serve nessun account, e il link vale per un invio solo."}
      </p>

      <div className="mt-14 max-w-3xl">
        <ModuloRecensioni
          chiave={chiave}
          nome={nomeProprio(ordine.nome)}
          max={MAX_RECENSIONE}
          prodotti={ordine.prodotti.map(({ prodotto: p }) => {
            const img = p.image[0];
            return {
              id: p.id,
              title: p.title,
              href: prodottoHref(p),
              immagine: img ? { url: immagineFerma(img), width: img.width, height: img.height, alt: img.alt } : null,
            };
          })}
        />
      </div>
    </section>
  );
}

const saluto = (nome: string | null) => {
  const n = nomeProprio(nome);
  return n ? `Ciao ${n},` : "Ciao,";
};

function Messaggio({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <section className="shell flex min-h-[52vh] flex-col justify-center pt-12 pb-8 md:pt-20">
      <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
        {titolo}
      </h1>
      <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">{children}</p>
      <Link href="/shop" className="link-underline mt-10 self-start text-sm text-ink-soft hover:text-ink">
        Vai allo Shop
      </Link>
    </section>
  );
}
