import type { Metadata } from "next";
import Link from "next/link";
import Image from "@/components/Immagine";
import Stelle from "@/components/Stelle";
import { prodottoHref, type ServizioSlug } from "@/data/shop";
import { MAX_RECENSIONE, nomeProprio, ordinePerChiave } from "@/lib/recensioni";
import { getServizio } from "@/lib/servizi";
import { invitoServizioPerChiave, MAX_TESTIMONIANZA } from "@/lib/testimonianze";
import { immagineFerma } from "@/lib/video";
import ModuloRecensioni from "../components/ModuloRecensioni";
import InCima from "../components/InCima";
import ModuloTestimonianza from "../components/ModuloTestimonianza";

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
 *
 * O, ancora, l'invito di un servizio: il QR che lei dà a chi ha ricevuto un
 * ritratto o un'illustrazione. Allora non è una recensione ma una
 * testimonianza, ed esce nella pagina del servizio (vedi `PaginaServizio`).
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
    const invito = await invitoServizioPerChiave(chiave);
    if (invito) return <PaginaServizio chiave={chiave} invito={invito} />;
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
        <InCima />
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

/** Come lo dice chi l'ha ricevuto: «il tuo ritratto», non «Ritratti Illustrati». */
const IL_TUO: Record<ServizioSlug, string> = {
  "ritratti-illustrati": "il tuo ritratto",
  "illustrazioni-personalizzate": "la tua illustrazione",
};

/**
 * La pagina di chi ha commissionato un lavoro e inquadra il QR.
 *
 * A destra, da tablet in su, una tavola del servizio: quello che si
 * racconta è un'immagine, e averla accanto aiuta a trovare le parole. Sul
 * telefono —dove si apre quasi sempre, appena inquadrato il codice— non
 * c'è: lì conta arrivare subito alle stelle.
 */
async function PaginaServizio({
  chiave,
  invito,
}: {
  chiave: string;
  invito: NonNullable<Awaited<ReturnType<typeof invitoServizioPerChiave>>>;
}) {
  const servizio = await getServizio(invito.servizio).catch(() => null);
  const titolo = servizio?.title ?? "il servizio";
  const pagina = `/shop/${invito.servizio}`;
  const tavola = servizio?.image[0];
  const t = invito.testimonianza;

  const colonna = (
    <div className="hidden md:col-span-4 md:col-start-9 md:block">
      {tavola && (
        <Image
          src={immagineFerma(tavola)}
          alt={tavola.alt}
          width={tavola.width}
          height={tavola.height}
          sizes="(min-width: 768px) 30vw, 0px"
          loading="eager"
          className="w-full bg-paper-deep"
        />
      )}
    </div>
  );

  if (invito.usato) {
    return (
      <section className="shell grid gap-12 pt-12 pb-8 md:grid-cols-12 md:pt-20">
        <InCima />
        <div className="md:col-span-7">
          <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
            {t ? `Grazie, ${nomeProprio(t.autore)}!` : "Grazie!"}
          </h1>
          <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
            {t
              ? `Le tue parole sono già nella pagina di ${titolo}. Per me valgono tantissimo: sono quelle che leggerà chi sta pensando di scrivermi.`
              : "Questo QR è già stato usato: vale per una volta sola."}
          </p>

          {t && (
            <figure className="mt-14 max-w-2xl border-t border-line pt-10">
              <div className="text-sm">
                <Stelle voto={t.voto ?? 0} />
              </div>
              <blockquote className="prose-measure mt-3 text-lg leading-relaxed text-pretty text-ink">
                {t.testo}
              </blockquote>
              <figcaption className="mt-3 text-sm text-ink-soft">
                {t.autore}
                {t.dettaglio && <span className="text-ink-faint"> · {t.dettaglio}</span>}
              </figcaption>
            </figure>
          )}

          <Link href={pagina} className="link-underline mt-10 inline-block text-sm text-ink-soft hover:text-ink">
            Vai a {titolo}
          </Link>
        </div>
        {colonna}
      </section>
    );
  }

  return (
    <section className="shell grid gap-12 pt-12 pb-8 md:grid-cols-12 md:pt-20">
      <div className="md:col-span-7">
        <h1 className="display-h1 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
          Ciao, com’è andata?
        </h1>
        <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
          Raccontami com’è andata con {IL_TUO[invito.servizio]}, dall’idea al risultato. Le tue parole escono
          nella pagina di {titolo}, con il tuo nome. Non serve nessun account, e il QR vale per una volta sola.
        </p>
        <div className="mt-14 max-w-2xl">
          <ModuloTestimonianza chiave={chiave} servizio={titolo} max={MAX_TESTIMONIANZA} />
        </div>
      </div>
      {colonna}
    </section>
  );
}
