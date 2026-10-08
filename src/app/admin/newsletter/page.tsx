import { redirect } from "next/navigation";
import { Trash } from "@/components/Icon";
import { prezzo, prezzoMinimo } from "@/data/shop";
import { site } from "@/data/site";
import { isAuthenticated } from "@/lib/auth";
import { correoConfigurado } from "@/lib/correo";
import { listInvii, listIscritti, listNovita, type Invio, type Iscritto } from "@/lib/newsletter";
import { immagineFerma } from "@/lib/video";
import { pingDb } from "@/lib/works";
import NewsletterInvio, { type VoceDaAnnunciare } from "../components/NewsletterInvio";
import { cancellaIscrittoAzione } from "./actions";

export const metadata = { title: "Newsletter" };

const data = (d: Date) =>
  new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(d);

/**
 * La newsletter, dal lato di chi la scrive. Tre cose, in ordine di quanto
 * chiedono di fare:
 *
 * - **Da annunciare**: le opere nuove e le stampe pubblicate che gli iscritti
 *   non conoscono ancora. Si mettono in fila da sole; da qui si mandano tutte
 *   in una mail sola, quando lei vuole.
 * - **Iscritti**: chi la riceve. Si può togliere qualcuno a mano, per esempio
 *   se lo chiede per mail.
 * - **Inviate**: le ultime mail partite, a quanti e con cosa.
 *
 * Qui ci sono indirizzi di persone, quindi la pagina controlla la sessione da
 * sé e non si fida solo della porta del proxy.
 */
export default async function NewsletterPage() {
  if (!(await isAuthenticated())) redirect("/admin/login?desde=/admin/newsletter");

  if (!(await pingDb())) {
    return (
      <section className="shell py-24">
        <h1 className="display-lead font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15]">
          Il database non risponde.
        </h1>
      </section>
    );
  }

  let dati: [Awaited<ReturnType<typeof listNovita>>, Iscritto[], Invio[]];
  try {
    dati = await Promise.all([listNovita(), listIscritti(), listInvii()]);
  } catch {
    return (
      <section className="shell py-24">
        <h1 className="display-lead font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15]">
          Manca la tabella della newsletter.
        </h1>
        <p className="prose-measure mt-4 text-ink-soft">
          Va eseguita la migrazione <code>db/migrations/006-newsletter.sql</code>.
        </p>
      </section>
    );
  }
  const [novita, iscritti, invii] = dati;

  const confermati = iscritti.filter((i) => i.stato === "iscritto");
  const inAttesa = iscritti.filter((i) => i.stato === "in attesa").length;

  const voci: VoceDaAnnunciare[] = [
    ...novita.opere.map((w) => ({
      tipo: "opera" as const,
      id: w.id,
      title: w.title,
      riga: `Opera · ${w.year}`,
      immagine: w.image[0] ? immagineFerma(w.image[0]) : null,
    })),
    ...novita.stampe.map((p) => {
      const minimo = prezzoMinimo(p.formati);
      return {
        tipo: "stampa" as const,
        id: p.id,
        title: p.title,
        riga: minimo !== null ? `Stampa · da ${prezzo(minimo)}` : "Stampa",
        immagine: p.image[0] ? immagineFerma(p.image[0]) : null,
      };
    }),
  ];

  // L'oggetto proposto dice cosa c'è dentro; lei lo cambia se vuole.
  const oggettoProposto =
    voci.length === 1
      ? `${voci[0].tipo === "opera" ? "Nuova opera" : "Nuova stampa"}: ${voci[0].title}`
      : novita.opere.length === 0
        ? `Nuove stampe — ${site.name}`
        : novita.stampe.length === 0
          ? `Nuove opere — ${site.name}`
          : `Nuove opere e stampe — ${site.name}`;

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      {!correoConfigurado() && (
        <p className="mb-8 border-l border-accent bg-paper-deep/60 py-2 pl-3 text-sm text-accent">
          Manca la chiave di Resend: senza, la newsletter non può partire.
        </p>
      )}

      <div className="grid gap-16 md:grid-cols-12">
        <div className="space-y-16 md:col-span-8">
          <div>
            <h1 className="display-lead font-display text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15]">
              Newsletter
            </h1>
          </div>

          <section aria-labelledby="nl-novita">
            <div className="flex items-baseline justify-between gap-6">
              <h2 id="nl-novita" className="display-section font-display text-xl leading-tight">
                Da annunciare
              </h2>
              {voci.length > 0 && (
                <span className="figures text-xs text-accent">
                  {voci.length === 1 ? "1 novità" : `${voci.length} novità`}
                </span>
              )}
            </div>
            {voci.length === 0 ? (
              <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-ink-faint">
                Niente di nuovo da annunciare. Quando carichi un&apos;opera o pubblichi una stampa,
                compare qui.
              </p>
            ) : (
              <NewsletterInvio
                // Si rifà da capo quando cambia la lista, così le spunte seguono le voci nuove.
                key={voci.map((v) => `${v.tipo}-${v.id}`).join(",")}
                voci={voci}
                iscritti={confermati.length}
                oggettoProposto={oggettoProposto}
              />
            )}
          </section>

          <section aria-labelledby="nl-iscritti">
            <div className="flex items-baseline justify-between gap-6">
              <h2 id="nl-iscritti" className="display-section font-display text-xl leading-tight">
                Iscritti
              </h2>
              <span className="figures text-xs text-ink-faint">
                {confermati.length}
                {inAttesa > 0 && ` · ${inAttesa} in attesa di conferma`}
              </span>
            </div>
            {confermati.length === 0 ? (
              <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-ink-faint">
                Ancora nessuno. Chi si iscrive dal fondo del sito compare qui dopo aver confermato
                dalla mail.
              </p>
            ) : (
              <ul className="mt-4 border-t border-line">
                {confermati.map((i) => (
                  <li key={i.id} className="flex items-center gap-4 border-b border-line py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {i.nome && <span className="mr-2">{i.nome}</span>}
                      <span className={i.nome ? "text-ink-faint" : undefined}>{i.email}</span>
                    </span>
                    <span className="figures shrink-0 text-xs text-ink-faint">
                      dal {data(i.confermato ?? i.creato)}
                    </span>
                    <form action={cancellaIscrittoAzione}>
                      <input type="hidden" name="id" value={i.id} />
                      <button
                        type="submit"
                        title="Togli dalla lista"
                        className="flex h-8 w-8 items-center justify-center text-ink-faint transition-colors hover:text-accent"
                      >
                        <span className="sr-only">Togli {i.email} dalla lista</span>
                        <Trash size={15} />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {invii.length > 0 && (
            <section aria-labelledby="nl-invii">
              <h2 id="nl-invii" className="display-section font-display text-xl leading-tight">
                Inviate
              </h2>
              <ul className="mt-4 border-t border-line">
                {invii.map((v) => (
                  <li key={v.id} className="border-b border-line py-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="min-w-0 truncate text-sm text-ink">{v.oggetto}</span>
                      <span className="figures shrink-0 text-xs text-ink-faint">{data(v.creato)}</span>
                    </div>
                    <p className="figures mt-1 text-xs text-ink-faint">
                      {v.stato === "errore" ? (
                        <span className="text-accent">Non partita</span>
                      ) : v.stato === "in corso" ? (
                        "In corso"
                      ) : (
                        `A ${v.consegnati}${v.consegnati < v.destinatari ? ` su ${v.destinatari}` : ""}`
                      )}
                      {" · "}
                      {v.contenuto.map((c) => c.title).join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="md:col-span-3 md:col-start-10">
          <h2 className="label">Come funziona</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
            <li>
              Chi si iscrive dal fondo del sito riceve una mail e conferma con un clic. Solo dopo
              entra nella lista.
            </li>
            <li>
              Ogni opera nuova e ogni stampa che pubblichi compare in «Da annunciare». Non parte
              niente da solo.
            </li>
            <li>
              Quando vuoi, scegli cosa annunciare e la mandi: una mail sola con tutto dentro.
              Prima puoi mandarti una prova.
            </li>
            <li>In fondo a ogni mail c&apos;è il link per disiscriversi.</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
