import Link from "next/link";
import { Pencil, Plus } from "@/components/Icon";
import { richiediAccesso } from "@/lib/auth";
import { cloudinaryConfigurado } from "@/lib/cloudinary";
import { contaBiglietti, listCodici, type Codice } from "@/lib/codici";
import { giornoLungo, oggiInItalia } from "@/lib/oggi";
import { listPorte, type Porta } from "@/lib/copertine";
import { listSconti, statoSconto, type Sconto } from "@/lib/sconti";
import { listProdotti } from "@/lib/prodotti";
import { listServizi, type Servizio } from "@/lib/servizi";
import { contarPezzi, immagineFerma } from "@/lib/video";
import { pingDb } from "@/lib/works";
import RigaProdotto from "../components/RigaProdotto";

export const metadata = { title: "Shop" };

/**
 * Lo Shop, con le mani dentro. Tre parti che si comportano in modo diverso, e
 * la pagina lo dice con la forma:
 *
 * - **Copertine**: le porte della pagina /shop, viste come escono, una
 *   accanto all'altra. Si cambiano tutte insieme in /admin/shop/copertine.
 * - **Su commissione**: i due servizi. Sono sempre due, quindi non c'è
 *   «nuovo», né cestino, né frecce: solo una riga ciascuno che porta a
 *   modificarli.
 * - **Stampe**: la lista che cresce. Si aggiungono, si ordinano con le frecce
 *   e si cancellano.
 */
export default async function AdminShopPage() {
  await richiediAccesso("/admin/shop");
  if (!(await pingDb())) {
    return (
      <section className="shell py-24">
        <h1 className="display-lead font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15]">
          Il database non risponde.
        </h1>
      </section>
    );
  }

  const [porte, servizi, stampe] = await Promise.all([
    listPorte(),
    listServizi(),
    listProdotti(),
  ]);
  const [sconti, codici, biglietti] = await Promise.all([listSconti(), listCodici(), contaBiglietti()]);
  const oggi = oggiInItalia();
  const conCloudinary = cloudinaryConfigurado();

  return (
    <section className="shell pt-8 pb-16 md:pt-12">
      {/* La griglia e le sezioni parlano da sole; il titolo serve a chi
          naviga con un lettore di schermo, per sapere in che pagina è. */}
      <h1 className="sr-only">Shop</h1>
      {!conCloudinary && (
        <p className="mb-8 nota">
          Mancano le chiavi di Cloudinary: senza, non si possono caricare immagini.
        </p>
      )}

      <div className="grid gap-16 md:grid-cols-12">
        <div className="space-y-16 md:col-span-8">
          <section aria-labelledby="adm-copertine">
            <div className="flex items-baseline justify-between gap-6">
              <h2 id="adm-copertine" className="display-section font-display text-xl leading-tight">
                Copertine
              </h2>
              <Link
                href="/admin/shop/copertine"
                className="area-tocco group inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
              >
                <Pencil size={14} />
                <span className="link-underline">Cambia</span>
              </Link>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-faint">
              Le porte della pagina Shop, come escono. Ognuna porta alla sua categoria.
            </p>
            <ul className="mt-5 grid grid-cols-3 gap-3 md:gap-4">
              {porte.map((p) => (
                <AnteprimaPorta key={p.categoria.slug} porta={p} />
              ))}
            </ul>
          </section>

          <section aria-labelledby="adm-sconti">
            <div className="flex items-baseline justify-between gap-6">
              <h2 id="adm-sconti" className="display-section font-display text-xl leading-tight">
                Sconti
              </h2>
              <span className="text-xs text-ink-faint">Si accendono e si spengono da soli</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-faint">
              Una sezione sotto le categorie dello Shop, con le stampe che scegli e il prezzo
              scontato. Si prepara prima e vale solo fra le sue date.
            </p>
            {sconti.length > 0 && (
              <ul className="mt-4 border-t border-line">
                {sconti.map((sc) => (
                  <RigaSconto key={sc.id} sconto={sc} />
                ))}
              </ul>
            )}
            <Link
              href="/admin/shop/sconti/nuovo"
              className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-line bg-paper-deep/40 py-4 text-ink-faint transition-colors hover:border-accent/50 hover:bg-paper-deep/70 hover:text-ink-soft"
            >
              <Plus size={16} />
              <span className="label">Nuovo sconto</span>
            </Link>
          </section>

          <section aria-labelledby="adm-codici">
            <div className="flex items-baseline justify-between gap-6">
              <h2 id="adm-codici" className="display-section font-display text-xl leading-tight">
                Codici sconto
              </h2>
              <span className="text-xs text-ink-faint">Si scrivono nel carrello</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-faint">
              Valgono sulle stampe che non sono già in sconto, non sulla spedizione.
            </p>
            {codici.length > 0 && (
              <ul className="mt-4 border-t border-line">
                {codici.map((c) => (
                  <RigaCodice key={c.id} codice={c} oggi={oggi} />
                ))}
              </ul>
            )}
            {/*
              I biglietti degli ordini si contano soltanto: sono uno per
              pacco, e una lista che cresce a ogni ordine seppellirebbe i pochi
              codici fatti a mano. Si cambiano dall'ordine, dove lei è
              quando scrive il biglietto.
            */}
            <p className="figures mt-4 flex flex-wrap items-baseline gap-x-2 border-b border-line pb-4 text-xs text-ink-faint">
              <span className="text-ink-soft">Biglietti nei pacchi:</span>
              {biglietti.dati === 0
                ? "ancora nessuno"
                : `${biglietti.dati} ${biglietti.dati === 1 ? "dato" : "dati"} · ${biglietti.usati} ${
                    biglietti.usati === 1 ? "tornato" : "tornati"
                  } come ordine`}
              <span aria-hidden="true">·</span>
              <Link href="/admin/ordini" className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink">
                Si cambiano negli ordini
              </Link>
            </p>
            <Link
              href="/admin/shop/codici/nuovo"
              className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-line bg-paper-deep/40 py-4 text-ink-faint transition-colors hover:border-accent/50 hover:bg-paper-deep/70 hover:text-ink-soft"
            >
              <Plus size={16} />
              <span className="label">Nuovo codice</span>
            </Link>
          </section>

          <section aria-labelledby="adm-servizi">
            <div className="flex items-baseline justify-between gap-6">
              <h2 id="adm-servizi" className="display-section font-display text-xl leading-tight">
                Su commissione
              </h2>
              <span className="text-xs text-ink-faint">Due servizi, sempre quelli</span>
            </div>
            <ul className="mt-4 border-t border-line">
              {servizi.map((s) => (
                <RigaServizio key={s.slug} servizio={s} />
              ))}
            </ul>
          </section>

          <section aria-labelledby="adm-stampe">
            <div className="flex items-baseline justify-between gap-6">
              <h2 id="adm-stampe" className="display-section font-display text-xl leading-tight">
                Stampe
              </h2>
              <span className="figures text-xs text-ink-faint">
                {stampe.length} {stampe.length === 1 ? "stampa" : "stampe"}
              </span>
            </div>

            <ul className="mt-4 border-t border-line">
              {stampe.map((p, i) => (
                <RigaProdotto key={p.id} prodotto={p} primo={i === 0} ultimo={i === stampe.length - 1} />
              ))}
            </ul>

            {/*
              L'aggiunta è la casella tratteggiata dell'archivio, distesa in
              una riga: lo stesso segno per «qui ne entra un'altra». Solo qui:
              i servizi non si aggiungono.
            */}
            <Link
              href="/admin/shop/nuovo"
              className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-line bg-paper-deep/40 py-4 text-ink-faint transition-colors hover:border-accent/50 hover:bg-paper-deep/70 hover:text-ink-soft"
            >
              <Plus size={16} />
              <span className="label">Nuova stampa</span>
            </Link>
          </section>
        </div>

        <div className="md:col-span-3 md:col-start-10">
          <h2 className="label">Come funziona</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
            <li>
              Le copertine sono le immagini della pagina Shop, una per categoria. Senza, esce la
              prima immagine del servizio o della prima stampa.
            </li>
            <li>
              Illustrazioni e ritratti sono due servizi: non hanno prezzo e portano al modulo di
              contatto. Ne cambi il testo e le immagini quando vuoi rinnovarli.
            </li>
            <li>Le stampe hanno formati e prezzi e vanno nel carrello.</li>
            <li>Una stampa nuova nasce come bozza: nel sito non esce finché non la pubblichi.</li>
            <li>Le frecce cambiano l&apos;ordine in cui escono le stampe.</li>
            <li>
              I codici sconto li scrive chi compra, nel carrello. Non si sommano agli sconti di
              stagione.
            </li>
            <li>
              Gli sconti si preparano quando vuoi: escono nello Shop, con il prezzo scontato, solo
              fra il primo e l&apos;ultimo giorno.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

const giorno = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

/**
 * Uno sconto nella lista: nome, percentuale e date, quante stampe, e lo stato
 * con il punto della barra. Terracotta solo per quello in corso, che è
 * quello che il sito sta mostrando adesso.
 */
function RigaSconto({ sconto: sc }: { sconto: Sconto }) {
  const stato = statoSconto(sc);
  const etichetta =
    stato === "in corso"
      ? "In corso"
      : stato === "programmato"
        ? `Programmato · parte il ${giorno(sc.dal)}`
        : stato === "finito"
          ? "Finito"
          : "Spento";

  return (
    <li className="border-b border-line">
      <Link href={`/admin/shop/sconti/${sc.id}`} className="group flex items-center gap-4 py-4">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="link-underline text-[0.9375rem] text-ink transition-colors group-hover:text-accent">
              {sc.titolo}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-ink-faint">
              <span
                aria-hidden="true"
                className={`block h-1 w-1 rounded-full ${stato === "in corso" ? "bg-accent" : "bg-ink-faint"}`}
              />
              {etichetta}
            </span>
          </span>
          <span className="figures mt-1 block text-xs text-ink-faint">
            −{sc.percentuale}% · dal {giorno(sc.dal)} al {giorno(sc.al)} ·{" "}
            {sc.stampe.length === 1 ? "1 stampa" : `${sc.stampe.length} stampe`}
          </span>
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft transition-colors group-hover:text-ink">
          <Pencil size={16} />
        </span>
      </Link>
    </li>
  );
}

/**
 * Un codice nella lista: la parola in tabulari, lo sconto e quante volte è
 * servito. Il punto è terracotta quando è acceso: vuol dire che adesso, nel
 * carrello, qualcuno lo può usare.
 */
function RigaCodice({ codice: c, oggi }: { codice: Codice; oggi: string }) {
  const usato = c.usatoOrdineId !== null;
  const scaduto = !usato && c.scade !== null && c.scade < oggi;
  const vale = c.attivo && !usato && !scaduto;
  const stato = usato
    ? `Usato nell’ordine #${c.usatoOrdineId}`
    : scaduto
      ? "Scaduto"
      : c.attivo
        ? "Acceso"
        : "Spento";
  return (
    <li className="border-b border-line">
      <Link href={`/admin/shop/codici/${c.id}`} className="group flex items-center gap-4 py-4">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="link-underline figures text-[0.9375rem] tracking-[0.06em] text-ink transition-colors group-hover:text-accent">
              {c.codice}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-ink-faint">
              <span
                aria-hidden="true"
                className={`block h-1 w-1 rounded-full ${vale ? "bg-accent" : "bg-ink-faint"}`}
              />
              {stato}
            </span>
          </span>
          <span className="figures mt-1 block text-xs text-ink-faint">
            −{c.percentuale}%
            {c.monouso ? " · una volta sola" : ""}
            {c.scade ? ` · ${scaduto ? "scaduto il" : "fino al"} ${giornoLungo(c.scade)}` : ""}
            {!c.monouso &&
              ` · ${c.usi === 0 ? "ancora nessun ordine" : c.usi === 1 ? "usato in 1 ordine" : `usato in ${c.usi} ordini`}`}
          </span>
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft transition-colors group-hover:text-ink">
          <Pencil size={16} />
        </span>
      </Link>
    </li>
  );
}

/**
 * Una porta della pagina /shop in piccolo: la stessa lamina 4:5 e il nome
 * sotto. Quando l'immagine non è scelta da lei ma è quella di riserva lo dice,
 * in pallido: non è un errore, è una scelta ancora da fare.
 */
function AnteprimaPorta({ porta: { categoria: c, immagine, scelta } }: { porta: Porta }) {
  return (
    <li>
      <Link href="/admin/shop/copertine" className="group block">
        <span className="block overflow-hidden bg-paper-deep">
          {immagine ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={immagineFerma(immagine)}
              alt=""
              className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            />
          ) : (
            <span className="block aspect-[4/5] w-full" />
          )}
        </span>
        <span className="mt-2 block text-[0.8125rem] leading-snug text-ink transition-colors group-hover:text-accent">
          {c.label}
        </span>
        <span className="mt-0.5 block text-xs text-ink-faint">
          {scelta ? "Scelta da te" : immagine ? "Di riserva" : "Nessuna immagine"}
        </span>
      </Link>
    </li>
  );
}

/**
 * Un servizio nella lista: copertina, nome, cosa ha dentro. Tutta la riga
 * porta a modificarlo, perché è l'unica cosa che si può fare. Quando manca il
 * testo o le immagini lo dice in terracotta: è la pagina pubblica che resta
 * vuota, ed è quello che chiede attenzione.
 */
function RigaServizio({ servizio: s }: { servizio: Servizio }) {
  const portada = s.image[0];
  const manca = [s.image.length === 0 && "immagini", !s.description && "testo"].filter(Boolean);

  return (
    <li className="border-b border-line">
      <Link href={`/admin/shop/servizi/${s.slug}`} className="group flex items-center gap-4 py-4">
        <span className="block w-14 shrink-0 bg-paper-deep">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={immagineFerma(portada)} alt="" className="aspect-[4/5] w-full object-cover" />
          ) : (
            <span className="block aspect-[4/5] w-full" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="link-underline text-[0.9375rem] text-ink transition-colors group-hover:text-accent">
            {s.title}
          </span>
          <span className="mt-1 block text-xs text-ink-faint">
            {s.image.length > 0 ? contarPezzi(s.image) : "Nessuna immagine"}
            {manca.length > 0 && (
              <span className="text-accent"> · manca {manca.join(" e ")}</span>
            )}
          </span>
        </span>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft transition-colors group-hover:text-ink">
          <Pencil size={16} />
        </span>
      </Link>
    </li>
  );
}
