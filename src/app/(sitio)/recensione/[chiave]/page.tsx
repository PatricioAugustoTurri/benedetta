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
 * l'ordine. Si vedono solo i prodotti di quell'ordine, e quelli già
 * recensiti restano lì, con le stelle date, invece di sparire.
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

  const daFare = ordine.prodotti.filter((p) => !p.recensione);
  const fatte = ordine.prodotti.filter((p) => p.recensione);

  if (ordine.prodotti.length === 0) {
    return (
      <Messaggio titolo="Non c’è niente da recensire.">
        I prodotti di quest’ordine non sono più nello Shop.
      </Messaggio>
    );
  }

  return (
    <section className="shell pt-12 pb-8 md:pt-20">
      <p className="label">Ordine #{ordine.id}</p>
      <h1 className="display-h1 mt-5 max-w-[20ch] text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1] text-balance">
        {daFare.length === 0 ? "Hai già detto tutto. Grazie!" : `${saluto(ordine.nome)} com’è andata?`}
      </h1>
      {daFare.length > 0 && (
        <p className="prose-measure mt-6 text-lg leading-relaxed text-ink-soft">
          Lascia le stelle e due righe {daFare.length > 1 ? "ai prodotti del tuo ordine" : "su quello che hai comprato"}:
          escono nella pagina dello Shop, con il tuo nome. Non serve nessun account, e puoi
          saltare quello che non vuoi recensire.
        </p>
      )}

      {daFare.length > 0 && (
        <div className="mt-14 max-w-3xl">
          <ModuloRecensioni
            chiave={chiave}
            nome={nomeProprio(ordine.nome)}
            max={MAX_RECENSIONE}
            prodotti={daFare.map(({ prodotto: p }) => {
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
      )}

      {fatte.length > 0 && (
        <div className={`max-w-3xl ${daFare.length > 0 ? "mt-20 border-t border-line pt-10" : "mt-14"}`}>
          <h2 className="label">Già recensiti</h2>
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
