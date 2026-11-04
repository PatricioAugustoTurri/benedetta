import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUp, Pencil, Plus } from "@/components/Icon";
import { richiediAccesso } from "@/lib/auth";
import { listCategorieAdmin, type CategoriaAdmin } from "@/lib/categorie";
import { cloudinaryConfigurado } from "@/lib/cloudinary";
import { contaBiglietti, listCodici, type Codice } from "@/lib/codici";
import { giornoLungo, oggiInItalia } from "@/lib/oggi";
import { listPorte, type Porta } from "@/lib/copertine";
import { miniatura } from "@/lib/miniatura";
import { listSconti, statoSconto, type Sconto } from "@/lib/sconti";
import { listProdotti } from "@/lib/prodotti";
import { listServizi, type Servizio } from "@/lib/servizi";
import { contarPezzi, immagineFerma } from "@/lib/video";
import { pingDb } from "@/lib/works";
import Sezione from "../components/Sezione";
import StampeOrdenabili from "../components/StampeOrdenabili";
import { spostaCategoriaAzione } from "./actions";

export const metadata = { title: "Shop" };

/**
 * Lo Shop, con le mani dentro. Cinque parti che si comportano in modo
 * diverso, e ognuna si apre con il filetto spesso di `Sezione`, come in tutte
 * le pagine dell'admin.
 *
 * Ogni sezione ha a sinistra il suo nome e come funziona —prima stava tutto in
 * una colonna a parte, lontano dalla cosa che spiegava— e a destra la cosa:
 *
 * - **Copertine**: le porte della pagina /shop, viste come escono.
 * - **Categorie**: le parti dello Shop, nell'ordine del menu. Qui nascono
 *   quelle nuove.
 * - **Stampe**, e una sezione uguale per ogni categoria che si compra: la
 *   griglia della sua pagina, che si ordina trascinando.
 * - **Su commissione**: i due servizi, sempre quelli. Niente «nuovo».
 * - **Sconti** e **Codici sconto**: righe che si aprono per modificarle.
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

  const [porte, servizi, prodotti, categorie] = await Promise.all([
    listPorte({ ancheNascoste: true }),
    listServizi(),
    listProdotti(),
    listCategorieAdmin(),
  ]);
  const inVendita = categorie.filter((c) => c.vendita);
  const [sconti, codici, biglietti] = await Promise.all([listSconti(), listCodici(), contaBiglietti()]);
  const oggi = oggiInItalia();
  const conCloudinary = cloudinaryConfigurado();

  return (
    <section className="shell pt-8 pb-24 md:pt-12">
      {/* La griglia e le sezioni parlano da sole; il titolo serve a chi
          naviga con un lettore di schermo, per sapere in che pagina è. */}
      <h1 className="sr-only">Shop</h1>
      {!conCloudinary && (
        <p className="mb-8 nota">
          Mancano le chiavi di Cloudinary: senza, non si possono caricare immagini.
        </p>
      )}

      <div className="space-y-20 md:space-y-28">
        <Sezione
          id="adm-copertine"
          titolo="Copertine"
          accanto="Una per categoria"
          azione={
            <Link
              href="/admin/shop/copertine"
              className="area-tocco group inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
            >
              <Pencil size={14} />
              <span className="link-underline">Cambia</span>
            </Link>
          }
          testo={
            <>
              <p>Le porte della pagina Shop, come escono. Ognuna porta alla sua categoria.</p>
              <p>Senza una scelta, esce la prima immagine del servizio o della prima stampa.</p>
            </>
          }
        >
          <ul className="grid grid-cols-3 gap-3 md:grid-cols-4 md:gap-4">
            {porte.map((p) => (
              <AnteprimaPorta key={p.categoria.slug} porta={p} />
            ))}
          </ul>
        </Sezione>

        <Sezione
          id="adm-categorie"
          titolo="Categorie"
          accanto={`${categorie.length} nello Shop`}
          testo={
            <>
              <p>L&apos;ordine è quello del menu, del footer e delle porte dello Shop.</p>
              <p>
                Una categoria nuova funziona come Stampe —formati, prezzi, carrello— e nasce
                nascosta: la accendi quando ha qualcosa dentro.
              </p>
            </>
          }
        >
          <ul className="border-t border-line lg:-mt-4 lg:border-t-0">
            {categorie.map((c, i) => (
              <RigaCategoria key={c.slug} categoria={c} primo={i === 0} ultimo={i === categorie.length - 1} />
            ))}
          </ul>
          <Aggiungi href="/admin/shop/categorie/nuova">Nuova categoria</Aggiungi>
        </Sezione>

        {inVendita.map((c) => {
          const dentro = prodotti.filter((p) => p.categoria === c.slug);
          const bozze = dentro.filter((p) => !p.pubblicato).length;
          const stampe = c.slug === "stampe";
          return (
            <Sezione
              key={c.slug}
              id={stampe ? "adm-stampe" : `adm-cat-${c.slug}`}
              titolo={c.label}
              accanto={
                <>
                  {stampe
                    ? `${dentro.length} ${dentro.length === 1 ? "stampa" : "stampe"}`
                    : `${dentro.length} ${dentro.length === 1 ? "prodotto" : "prodotti"}`}
                  {bozze > 0 && ` · ${bozze} ${bozze === 1 ? "bozza" : "bozze"}`}
                </>
              }
              testo={
                <>
                  <p>
                    {stampe
                      ? "Hanno formati e prezzi e vanno nel carrello."
                      : "Come le stampe: formati e prezzi, e vanno nel carrello."}
                  </p>
                  <p>
                    {stampe
                      ? "Una stampa nuova entra in cima e nasce come bozza: sbiadita qui, assente nel sito finché non la pubblichi."
                      : "Un prodotto nuovo entra in cima e nasce come bozza: sbiadito qui, assente nel sito finché non lo pubblichi."}
                  </p>
                  {!c.visibile && (
                    <p className="text-accent">
                      La categoria è nascosta: niente di qui esce nel sito.{" "}
                      <Link
                        href={`/admin/shop/categorie/${c.slug}`}
                        className="link-underline transition-colors hover:text-ink"
                      >
                        Accendila
                      </Link>{" "}
                      quando è pronta.
                    </p>
                  )}
                </>
              }
            >
              <StampeOrdenabili stampe={dentro} categoria={c.slug} />
            </Sezione>
          );
        })}

        <Sezione
          id="adm-servizi"
          titolo="Su commissione"
          accanto="Due servizi, sempre quelli"
          testo={
            <p>
              Illustrazioni e ritratti non hanno prezzo e portano al modulo di contatto. Ne cambi
              il testo e le immagini quando vuoi rinnovarli.
            </p>
          }
        >
          <ul className="border-t border-line lg:-mt-4 lg:border-t-0">
            {servizi.map((s) => (
              <RigaServizio key={s.slug} servizio={s} />
            ))}
          </ul>
        </Sezione>

        <Sezione
          id="adm-sconti"
          titolo="Sconti"
          accanto="Si accendono e si spengono da soli"
          testo={
            <p>
              Una sezione sotto le categorie dello Shop, con le stampe che scegli e il prezzo
              scontato. Si prepara quando vuoi e vale solo fra il primo e l&apos;ultimo giorno.
            </p>
          }
        >
          {sconti.length > 0 && (
            <ul className="border-t border-line lg:-mt-4 lg:border-t-0">
              {sconti.map((sc) => (
                <RigaSconto key={sc.id} sconto={sc} />
              ))}
            </ul>
          )}
          <Aggiungi href="/admin/shop/sconti/nuovo" primo={sconti.length === 0}>
            Nuovo sconto
          </Aggiungi>
        </Sezione>

        <Sezione
          id="adm-codici"
          titolo="Codici sconto"
          accanto="Si scrivono nel carrello"
          testo={
            <p>
              Valgono sulle stampe che non sono già in sconto, non sulla spedizione, e non si
              sommano agli sconti di stagione.
            </p>
          }
        >
          {codici.length > 0 && (
            <ul className="border-t border-line lg:-mt-4 lg:border-t-0">
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
          <p
            className={`figures flex flex-wrap items-baseline gap-x-2 border-b border-line pb-4 text-xs text-ink-faint ${
              codici.length > 0 ? "mt-4" : ""
            }`}
          >
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
          <Aggiungi href="/admin/shop/codici/nuovo">Nuovo codice</Aggiungi>
        </Sezione>
      </div>
    </section>
  );
}

/**
 * La casella tratteggiata dell'archivio, distesa in una riga: lo stesso segno
 * per «qui ne entra un'altra». Quando la lista è vuota è la prima cosa della
 * sezione e non ha niente da cui staccarsi.
 */
function Aggiungi({ href, primo = false, children }: { href: string; primo?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center justify-center gap-2 border border-dashed border-line bg-paper-deep/40 py-4 text-ink-faint transition-colors hover:border-accent/50 hover:bg-paper-deep/70 hover:text-ink-soft ${
        primo ? "" : "mt-4"
      }`}
    >
      <Plus size={16} />
      <span className="label">{children}</span>
    </Link>
  );
}

/**
 * Una categoria nella lista: il nome, se si vede nel sito, cosa ha dentro, e
 * le due frecce per spostarla nel menu. Il punto è terracotta quando è nel
 * menu, come quello degli sconti in corso: è quello che il sito mostra adesso.
 *
 * Le frecce sono due moduli e non un trascinamento: le categorie sono poche,
 * si leggono in colonna, e un posto su o giù è tutto quello che serve.
 */
function RigaCategoria({
  categoria: c,
  primo,
  ultimo,
}: {
  categoria: CategoriaAdmin;
  primo: boolean;
  ultimo: boolean;
}) {
  const contenuto = !c.vendita
    ? "Su commissione · una pagina sola"
    : c.prodotti === 0
      ? "Ancora vuota"
      : `${c.prodotti} ${c.slug === "stampe" ? (c.prodotti === 1 ? "stampa" : "stampe") : c.prodotti === 1 ? "prodotto" : "prodotti"}${
          c.bozze > 0 ? ` · ${c.bozze} ${c.bozze === 1 ? "bozza" : "bozze"}` : ""
        }`;

  return (
    <li className="flex items-center gap-2 border-b border-line">
      <Link href={`/admin/shop/categorie/${c.slug}`} className="group flex min-w-0 flex-1 items-center gap-4 py-4">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="link-underline text-[0.9375rem] text-ink transition-colors group-hover:text-accent">
              {c.label}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-ink-faint">
              <span
                aria-hidden="true"
                className={`block h-1 w-1 rounded-full ${c.visibile ? "bg-accent" : "bg-ink-faint"}`}
              />
              {c.visibile ? "Nel menu" : "Nascosta"}
            </span>
          </span>
          <span className="figures mt-1 block text-xs text-ink-faint">
            /shop/{c.slug} · {contenuto}
          </span>
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft transition-colors group-hover:text-ink">
          <Pencil size={16} />
        </span>
      </Link>

      <span className="flex shrink-0 items-center">
        <Sposta slug={c.slug} verso="su" label={c.label} disabilitato={primo} />
        <Sposta slug={c.slug} verso="giu" label={c.label} disabilitato={ultimo} />
      </span>
    </li>
  );
}

function Sposta({
  slug,
  verso,
  label,
  disabilitato,
}: {
  slug: string;
  verso: "su" | "giu";
  label: string;
  disabilitato: boolean;
}) {
  return (
    <form action={spostaCategoriaAzione}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="verso" value={verso} />
      <button
        type="submit"
        disabled={disabilitato}
        title={verso === "su" ? "Più su nel menu" : "Più giù nel menu"}
        className="flex h-8 w-8 items-center justify-center text-ink-soft transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-25"
      >
        <span className="sr-only">
          Sposta {label} {verso === "su" ? "più su" : "più giù"}
        </span>
        <ArrowUp size={15} className={verso === "giu" ? "rotate-180" : undefined} />
      </button>
    </form>
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
              src={miniatura(immagineFerma(immagine), 320, 400)}
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
          {!c.visibile && " · nascosta"}
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
            <img src={miniatura(immagineFerma(portada), 112, 140)} alt="" className="aspect-[4/5] w-full object-cover" />
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
