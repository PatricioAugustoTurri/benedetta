import { prezzo } from "@/data/shop";
import { listOrdini, type Ordine } from "@/lib/prodotti";
import { stripeConfigurato, stripeInProva } from "@/lib/stripe";
import { pingDb } from "@/lib/works";
import { segnaOrdineAzione } from "../shop/actions";

export const metadata = { title: "Ordini" };

const data = (d: Date) =>
  new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(d);

/**
 * Gli ordini pagati, dal più recente. Ognuno porta tutto quello che serve
 * per spedirlo —cosa, quante copie, a chi, dove— senza aprire Stripe, e un
 * solo controllo: segnarlo come spedito.
 *
 * Quelli da spedire vanno sopra e con il punto terracotta, perché sono
 * quelli che chiedono qualcosa; gli spediti scendono e si spengono.
 */
export default async function OrdiniPage() {
  if (!(await pingDb())) {
    return (
      <section className="shell py-24">
        <h1 className="display-lead font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15]">
          Il database non risponde.
        </h1>
      </section>
    );
  }

  const ordini = await listOrdini();
  const daSpedire = ordini.filter((o) => o.stato === "pagato");
  const spediti = ordini.filter((o) => o.stato === "spedito");

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      <div className="grid gap-16 md:grid-cols-12">
        <div className="md:col-span-8">
          <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
            Ordini
          </h1>

          {ordini.length === 0 ? (
            <p className="prose-measure mt-6 text-ink-soft">
              Non è ancora arrivato nessun ordine. Quando qualcuno paga una stampa, compare qui
              e ti arriva una mail.
            </p>
          ) : (
            <>
              <Gruppo titolo="Da spedire" ordini={daSpedire} vuoto="Niente da spedire." />
              {spediti.length > 0 && <Gruppo titolo="Spediti" ordini={spediti} />}
            </>
          )}
        </div>

        <aside className="md:col-span-3 md:col-start-10">
          <h2 className="label">Pagamenti</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            {!stripeConfigurato()
              ? "Stripe non è ancora collegato: il carrello funziona, ma il pagamento non parte."
              : stripeInProva()
                ? "Stripe è in modalità di prova: gli ordini sono finti e non si muove denaro."
                : "Stripe è attivo. I pagamenti e i rimborsi si gestiscono dal pannello di Stripe."}
          </p>
        </aside>
      </div>
    </section>
  );
}

function Gruppo({ titolo, ordini, vuoto }: { titolo: string; ordini: Ordine[]; vuoto?: string }) {
  return (
    <section className="mt-12">
      <h2 className="label">
        {titolo} <span className="figures">· {ordini.length}</span>
      </h2>
      {ordini.length === 0 ? (
        <p className="mt-4 text-sm text-ink-faint">{vuoto}</p>
      ) : (
        <ul className="mt-4 border-t border-line">
          {ordini.map((o) => (
            <Voce key={o.id} ordine={o} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Voce({ ordine: o }: { ordine: Ordine }) {
  const a = o.indirizzo;
  const spedito = o.stato === "spedito";

  return (
    <li className={`border-b border-line py-6 ${spedito ? "text-ink-soft" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="flex items-center gap-2 text-[0.9375rem]">
          <span
            aria-hidden="true"
            className={`block h-1 w-1 rounded-full ${spedito ? "bg-ink-faint" : "bg-accent"}`}
          />
          <span className="figures">#{o.id}</span>
          <span className="text-ink-faint">·</span>
          {o.nome ?? o.email}
        </p>
        <p className="figures text-sm">
          {prezzo(o.totale)}
          <span className="ml-3 text-xs text-ink-faint">{data(o.creato)}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <ul className="space-y-1 text-sm">
          {o.righe.map((r, i) => (
            <li key={i} className="flex items-baseline justify-between gap-4">
              <span>
                <span className="figures text-ink-faint">{r.quantita} ×</span> {r.title}{" "}
                <span className="text-ink-faint">— {r.formato}</span>
              </span>
              <span className="figures shrink-0 text-ink-soft">{prezzo(r.prezzo * r.quantita)}</span>
            </li>
          ))}
          <li className="figures flex justify-between gap-4 pt-1 text-xs text-ink-faint">
            <span>Spedizione</span>
            <span>{prezzo(o.spedizione)}</span>
          </li>
        </ul>

        <address className="text-sm not-italic leading-relaxed">
          {[o.nome, a.line1, a.line2, [a.postal_code, a.city, a.state].filter(Boolean).join(" "), a.country]
            .filter((r) => r && r.trim().length > 0)
            .map((r, i) => (
              <span key={i} className="block">
                {r}
              </span>
            ))}
          <a href={`mailto:${o.email}`} className="link-underline mt-1 block break-all text-xs text-ink-soft">
            {o.email}
          </a>
        </address>
      </div>

      <form action={segnaOrdineAzione} className="mt-4">
        <input type="hidden" name="id" value={o.id} />
        <input type="hidden" name="stato" value={spedito ? "pagato" : "spedito"} />
        <button
          type="submit"
          className={
            spedito
              ? "link-underline text-xs text-ink-faint transition-colors hover:text-ink"
              : "border border-line px-3 py-1.5 text-xs text-ink transition-colors hover:border-ink"
          }
        >
          {spedito ? "Rimetti fra quelli da spedire" : "Segna come spedito"}
        </button>
      </form>
    </li>
  );
}
