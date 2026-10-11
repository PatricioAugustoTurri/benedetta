"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { vaiAlPagamento, verificaCodice } from "@/app/(sitio)/carrello/actions";
import { AZIONE } from "@/components/azione";
import { ArrowLeft, ArrowRight, ChevronDown } from "@/components/Icon";
import { legaliPronte } from "@/data/legale";
import { prezzo, scontoCodice } from "@/data/shop";
import { site } from "@/data/site";
import {
  DATI_VUOTI,
  ORDINE_CAMPI,
  nomePaese,
  tariffaPer,
  validaSpedizione,
  type CampoSpedizione,
  type DatiSpedizione as Dati,
  type ErroriSpedizione,
} from "@/lib/spedizione";
import CodiceSconto from "./CodiceSconto";
import { Conto, RigaCodice } from "./Conti";
import DatiSpedizione from "./DatiSpedizione";
import {
  codiceRicordato,
  datiRicordati,
  ricordaCodice,
  ricordaDati,
  totaleCarrello,
  type CodiceApplicato,
  type VoceCarrello,
} from "./store";
import { useCarrelloVerificato } from "./useCarrelloVerificato";

/*
  Da 768px l'ordine è sempre aperto, accanto al modulo; sotto si piega in una
  riga con il totale. Lo si chiede al browser invece che al CSS perché un
  pannello piegato dev'essere anche `inert` —fuori dal tab e dai lettori di
  schermo—, e `inert` non ha una variante responsive.
*/
const DESKTOP = "(min-width: 768px)";
const ascoltaDesktop = (fatto: () => void) => {
  const m = window.matchMedia(DESKTOP);
  m.addEventListener("change", fatto);
  return () => m.removeEventListener("change", fatto);
};

/**
 * La cassa: la pagina in cui si scrive a chi e dove spedire, prima di pagare
 * su SumUp. Ha la forma di una pagina di pagamento, quella che chi compra
 * online conosce già: l'ordine da una parte, il modulo dall'altra.
 *
 * **A sinistra l'ordine**, su carta più scura —l'unico campo di colore della
 * cassa, e l'unico posto del sito in cui la carta profonda fa da fondo a
 * qualcosa che non è un'immagine—: a chi si paga, il totale grande, le
 * stampe con la loro miniatura, e i conti con il codice sconto. Si allinea
 * verso il centro, come il modulo dall'altra parte, così i due si guardano
 * attraverso la cucitura invece di scappare ai bordi di uno schermo largo.
 *
 * **A destra il modulo**: contatti e indirizzo (DatiSpedizione), e alla fine
 * «Paga» con l'importo scritto, perché chi preme sa quanto sta pagando.
 *
 * Sul telefono l'ordine diventa una striscia in cima con il totale e
 * «Dettagli», che lo srotola: il modulo arriva subito, e chi vuole
 * ricontrollare le stampe le ha a un tocco.
 *
 * L'azione si chiama a mano e non con `action={…}`, perché React svuota i
 * campi quando un'azione del modulo finisce, anche quando fallisce, e chi ha
 * appena scritto l'indirizzo lo perderebbe proprio quando deve correggere
 * una cifra.
 */
export default function CassaVista({ inProva }: { inProva: boolean }) {
  const { voci, montato, avviso, setAvviso } = useCarrelloVerificato();
  const desktop = useSyncExternalStore(ascoltaDesktop, () => window.matchMedia(DESKTOP).matches, () => false);
  const [dettagli, setDettagli] = useState(false);
  /*
    I dati scritti in questa scheda tornano al loro posto: chi è andato su
    SumUp ed è tornato indietro non riscrive l'indirizzo. Sul server non c'è
    niente da leggere (`datiRicordati` risponde null), e il modulo non si
    disegna finché la pagina non è montata, quindi i due primi disegni
    coincidono lo stesso.
  */
  const [dati, setDati] = useState<Dati>(() => ({ ...DATI_VUOTI, ...datiRicordati() }));
  const [errori, setErrori] = useState<ErroriSpedizione>({});
  const [codice, setCodice] = useState<CodiceApplicato | null>(null);
  // Quello che un lettore di schermo sente quando il codice entra o esce:
  // la riga compare nei conti, ma comparire non si annuncia da solo.
  const [annuncio, setAnnuncio] = useState("");
  // Dopo «Togli» il fuoco torna alla riga «Hai un codice sconto?»; dopo
  // «Applica» va sulla riga del codice nei conti, che è dove è andato quello
  // che si è appena scritto.
  const [rifuoca, setRifuoca] = useState(false);
  const rigaCodice = useRef<HTMLDivElement>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, avvia] = useTransition();
  // Dal momento in cui SumUp ha risposto a quando il browser lascia la
  // pagina: il pulsante resta «Un momento…» invece di tornare cliccabile.
  const [uscendo, setUscendo] = useState(false);
  const pagando = inCorso || uscendo;
  const id = useId();

  /*
    Il codice ricordato —scritto qui in una visita precedente— si ricontrolla
    prima di mostrarlo: lei può averlo spento nel frattempo, e uno sconto che
    si vede e sparisce al pagamento è peggio di uno che si dice subito che non
    c'è.
  */
  useEffect(() => {
    if (!montato) return;
    const ricordato = codiceRicordato();
    if (!ricordato) return;
    verificaCodice(ricordato.codice)
      .then((e) => {
        if (e.ok) {
          setCodice({ codice: e.codice, percentuale: e.percentuale });
          ricordaCodice({ codice: e.codice, percentuale: e.percentuale });
        } else {
          ricordaCodice(null);
          setAvviso(`Il codice ${ricordato.codice} non vale più ed è stato tolto.`);
        }
      })
      // Senza rete si mostra com'era: il pagamento lo ricontrolla comunque.
      .catch(() => setCodice(ricordato));
  }, [montato, setAvviso]);

  /*
    Tornando indietro da SumUp, il browser può restituire la pagina com'era
    lasciata —con il pulsante a «Un momento…»—. La si rimette in condizione
    di pagare.
  */
  useEffect(() => {
    const ritorno = (e: PageTransitionEvent) => {
      if (e.persisted) setUscendo(false);
    };
    window.addEventListener("pageshow", ritorno);
    return () => window.removeEventListener("pageshow", ritorno);
  }, []);

  // Prima di leggere il carrello si disegna solo la cornice, perché la
  // pagina non salti quando arriva il contenuto.
  if (!montato) {
    return (
      <div className="flex flex-1 flex-col md:grid md:grid-cols-2" aria-hidden="true">
        <div className="h-36 bg-paper-deep md:h-auto" />
        <div />
      </div>
    );
  }

  if (voci.length === 0) return <Vuota avviso={avviso} />;

  const subtotale = totaleCarrello(voci);
  const tariffa = tariffaPer(dati.paese);
  const spedizione = tariffa?.prezzo ?? null;
  const sconto = codice ? scontoCodice(voci, codice.percentuale) : 0;
  const totale = subtotale - sconto + (spedizione ?? 0);
  // Quante righe restano fuori dal codice perché già in sconto di stagione.
  const fuori = voci.filter((v) => v.scontata).length;

  const applica = (c: CodiceApplicato) => {
    setCodice(c);
    ricordaCodice(c);
    setRifuoca(false);
    requestAnimationFrame(() => rigaCodice.current?.focus());
    const toglie = scontoCodice(voci, c.percentuale);
    setAnnuncio(
      toglie > 0
        ? `Codice ${c.codice} applicato: meno ${prezzo(toglie)}.`
        : `Codice ${c.codice} applicato, ma le stampe nel carrello sono già in sconto.`,
    );
  };
  const toglilo = () => {
    setCodice(null);
    ricordaCodice(null);
    setRifuoca(true);
    setAnnuncio("Codice tolto.");
  };

  /*
    Si ricontrolla mentre si scrive solo il campo che è già fallito: prima
    del primo tentativo nessuno ha ancora sbagliato, e segnalarlo mentre
    scrive è mettergli fretta.
  */
  const cambia = (campo: CampoSpedizione, valore: string) => {
    const nuovi = { ...dati, [campo]: valore };
    // Fuori dall'Italia la provincia non si chiede: quella scelta prima non vale più.
    if (campo === "paese" && valore !== "IT") nuovi.provincia = "";
    setDati(nuovi);
    ricordaDati(nuovi);
    // Cambiare paese cambia le regole del codice fiscale, del CAP e della provincia: se erano
    // segnati, si ricontrollano anche loro.
    const dipendenti: CampoSpedizione[] = campo === "paese" ? ["paese", "codiceFiscale", "cap", "provincia"] : [campo];
    if (dipendenti.some((c) => errori[c])) {
      const trovati = validaSpedizione(nuovi);
      const dopo = { ...errori };
      for (const c of dipendenti) if (errori[c]) dopo[c] = trovati[c];
      setErrori(dopo);
      // Corretto l'ultimo campo segnato, l'avviso sopra «Paga» non ha più
      // niente da dire.
      if (!Object.values(dopo).some(Boolean)) setErrore(null);
    }
  };

  // Il fuoco va al primo campo che non va: chi non vede la pagina ha bisogno
  // che l'errore abbia un posto, non solo un testo.
  const fuocoSulPrimo = (trovati: ErroriSpedizione) => {
    const primo = ORDINE_CAMPI.find((c) => trovati[c]);
    if (primo) document.getElementById(`${id}-${primo}`)?.focus();
  };

  const paga = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pagando) return;
    const trovati = validaSpedizione(dati);
    setErrori(trovati);
    setErrore(null);
    if (Object.keys(trovati).length > 0) {
      setErrore("Controlla i dati segnati in rosso.");
      fuocoSulPrimo(trovati);
      return;
    }

    avvia(async () => {
      let esito: Awaited<ReturnType<typeof vaiAlPagamento>>;
      try {
        esito = await vaiAlPagamento({
          voci: voci.map(({ slug, formato, quantita }) => ({ slug, formato, quantita })),
          codice: codice?.codice ?? "",
          dati,
        });
      } catch {
        // Senza rete, o con il server giù, l'azione non risponde nemmeno.
        esito = { error: "Non riesco a raggiungere il sito. Controlla la connessione e riprova." };
      }
      if ("url" in esito) {
        setUscendo(true);
        window.location.assign(esito.url);
        return;
      }
      setErrore(esito.error);
      if (esito.errori) {
        setErrori(esito.errori);
        fuocoSulPrimo(esito.errori);
      }
    });
  };

  const aperto = desktop || dettagli;

  return (
    <div className="flex flex-1 flex-col md:grid md:grid-cols-2">
      <h1 className="sr-only">Cassa</h1>

      {/* ------------------------------------------------------ l'ordine */}
      <section aria-label="Il tuo ordine" className="bg-paper-deep md:flex md:justify-end">
        <div className="flex w-full flex-col px-6 pt-5 pb-6 sm:px-10 md:sticky md:top-0 md:max-h-dvh md:max-w-[34rem] md:overflow-y-auto md:px-12 md:pt-10 md:pb-8 lg:px-16">
          <Ritorno />

          <div className="mt-6 flex items-end justify-between gap-6 md:mt-14 md:block">
            <div>
              <p className="text-sm text-ink-soft">Paghi a {site.name}</p>
              <p className="figures mt-1.5 text-[clamp(2rem,4vw,2.75rem)] leading-none font-medium tracking-[-0.025em] text-ink">
                {prezzo(totale)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDettagli((d) => !d)}
              aria-expanded={dettagli}
              aria-controls={`${id}-ordine`}
              data-open={dettagli}
              className="group area-tocco flex shrink-0 items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink md:hidden"
            >
              <span className="link-underline">{dettagli ? "Nascondi" : "Dettagli"}</span>
              <ChevronDown
                size={14}
                className="shrink-0 transition-transform duration-[420ms] ease-[var(--ease-out-soft)] group-data-[open=true]:rotate-180"
              />
            </button>
          </div>

          {/*
            Lo stesso srotolarsi delle categorie dello Shop e del codice
            sconto (0fr → 1fr): il contenuto decide quanto è alto. Da 768px è
            sempre aperto e la freccia non c'è.
          */}
          <div
            id={`${id}-ordine`}
            data-open={aperto}
            inert={!aperto}
            className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[420ms] ease-[var(--ease-out-soft)] data-[open=true]:grid-rows-[1fr]"
          >
            <div className="min-h-0 overflow-hidden">
              {avviso && (
                <p role="status" className="mt-6 border-l border-accent py-1 pl-3 text-sm text-accent">
                  {avviso}
                </p>
              )}

              <ul className="mt-8 md:mt-10">
                {voci.map((v) => (
                  <Stampa key={`${v.slug}|${v.formato}`} voce={v} />
                ))}
              </ul>

              <dl className="mt-4 border-t border-line">
                <Conto etichetta="Subtotale" valore={prezzo(subtotale)} />
                {codice && (
                  <RigaCodice
                    ref={rigaCodice}
                    codice={codice}
                    sconto={sconto}
                    fuori={fuori}
                    righe={voci.length}
                    onTogli={toglilo}
                  />
                )}
              </dl>
              {!codice && <CodiceSconto onApplica={applica} focusAllInizio={rifuoca} />}
              <p role="status" className="sr-only">
                {annuncio}
              </p>
              <dl className={`${codice ? "" : "mt-4 border-t border-line"}`}>
                <div className="flex items-start justify-between gap-6 border-b border-line py-3">
                  <dt className="min-w-0">
                    <span className="label">Spedizione</span>
                    {/* Dove va, perché è il paese a decidere quanto costa. */}
                    <span className="mt-1.5 block text-xs leading-relaxed text-ink-faint">
                      {tariffa ? nomePaese(dati.paese) : "Scegli il paese"}
                    </span>
                  </dt>
                  <dd className="figures shrink-0 text-sm">{spedizione === null ? "—" : prezzo(spedizione)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-6 py-3.5">
                  <dt className="label text-ink">Totale</dt>
                  <dd className="figures text-lg font-medium">{prezzo(totale)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <Piede className="mt-auto hidden pt-16 md:block" />
        </div>
      </section>

      {/* ------------------------------------------------------ il modulo */}
      <div className="md:flex md:justify-start">
        <form
          onSubmit={paga}
          noValidate
          aria-label="I tuoi dati"
          className="w-full px-6 pt-10 pb-12 sm:px-10 md:max-w-[36rem] md:px-12 md:pt-10 md:pb-16 lg:px-16"
        >
          <DatiSpedizione id={id} dati={dati} errori={errori} onCambia={cambia} />

          {errore && (
            <p role="alert" className="mt-10 text-sm leading-relaxed text-accent">
              {errore}
            </p>
          )}

          <button
            type="submit"
            aria-disabled={pagando || undefined}
            className={`${errore ? "mt-5" : "mt-12"} w-full justify-center py-3 ${AZIONE} aria-disabled:cursor-wait aria-disabled:opacity-60`}
          >
            {pagando ? (
              "Un momento…"
            ) : (
              <>
                Paga <span className="figures">{prezzo(totale)}</span>
                <ArrowRight size={16} className="shrink-0" />
              </>
            )}
          </button>

          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            Paghi sulla pagina di SumUp, con carta o con i metodi che propone: qui non si scrive la
            carta. Il pacco parte con i dati che hai scritto sopra.
            {legaliPronte() && (
              <>
                {" "}Pagando accetti le{" "}
                <Link href="/condizioni-di-vendita" className="link-underline text-ink-soft transition-colors hover:text-ink">
                  condizioni di vendita
                </Link>
                ; hai 14 giorni per{" "}
                <Link href="/spedizioni-e-resi#resi" className="link-underline text-ink-soft transition-colors hover:text-ink">
                  cambiare idea
                </Link>
                .
              </>
            )}
          </p>

          {/*
            Solo con il conto di prova: chi sta provando il negozio deve sapere
            che non si addebita niente e con quale carta finta si paga.
          */}
          {inProva && (
            <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-ink-faint">
              Modalità di prova: non si addebita niente. Usa la carta{" "}
              <span className="figures text-ink-soft">4200 0000 0000 0091</span>, una data futura e un
              CVV qualsiasi.
            </p>
          )}

          <Piede className="mt-12 md:hidden" />
        </form>
      </div>
    </div>
  );
}

/**
 * La freccia per tornare e la firma di lei: dice dove si è senza essere un
 * menu. Tutto il blocco è un link solo, al carrello, come il «←» accanto al
 * nome del negozio su una pagina di pagamento.
 */
function Ritorno() {
  return (
    <Link
      href="/carrello"
      className="group flex items-center gap-2.5 self-start text-ink-soft transition-colors hover:text-ink"
    >
      <ArrowLeft size={18} className="shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
      <Image
        src="/benedetta-zibetti-wordmark.png"
        alt=""
        width={602}
        height={375}
        priority
        sizes="88px"
        className="h-auto w-[76px] md:w-[88px]"
      />
      <span className="sr-only">Torna al carrello</span>
    </Link>
  );
}

/**
 * Una stampa nell'ordine: la copertina in 4:5 come nella griglia, piccola,
 * nome, formato e copie, e l'importo della riga. Le copie stanno nel testo e
 * non in un selettore: si cambiano nel carrello, la cassa le mostra.
 */
function Stampa({ voce: v }: { voce: VoceCarrello }) {
  return (
    <li className="flex items-center gap-4 py-2.5">
      <div className="w-11 shrink-0 overflow-hidden bg-paper">
        {v.immagine && (
          <Image
            src={v.immagine.url}
            alt=""
            width={v.immagine.width}
            height={v.immagine.height}
            sizes="44px"
            className="aspect-[4/5] w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{v.title}</p>
        <p className="mt-0.5 text-xs text-ink-faint">
          {v.formato}
          <span aria-hidden="true"> · </span>
          {v.quantita === 1 ? "1 copia" : `${v.quantita} copie da ${prezzo(v.prezzo)}`}
        </p>
      </div>
      <p className="figures shrink-0 text-sm text-ink">{prezzo(v.prezzo * v.quantita)}</p>
    </li>
  );
}

/** In fondo all'ordine: dove si paga e, quando ci sono, le condizioni. */
function Piede({ className }: { className: string }) {
  return (
    <p className={`text-xs leading-relaxed text-ink-faint ${className}`}>
      Pagamento con SumUp
      {legaliPronte() && (
        <>
          <span aria-hidden="true"> · </span>
          <Link href="/condizioni-di-vendita" className="link-underline transition-colors hover:text-ink">
            Condizioni
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/privacy" className="link-underline transition-colors hover:text-ink">
            Privacy
          </Link>
        </>
      )}
    </p>
  );
}

/** La cassa senza niente da pagare: lo si dice, e si torna alle stampe. */
function Vuota({ avviso }: { avviso: string | null }) {
  return (
    <div className="flex flex-1 flex-col px-6 pt-5 pb-12 sm:px-10 md:px-12 md:pt-10 lg:px-16">
      <Ritorno />
      <div className="flex flex-1 flex-col justify-center py-16">
        {avviso && <p className="mb-6 text-sm text-accent">{avviso}</p>}
        <h1 className="display-h1 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1]">Non c&apos;è niente da pagare.</h1>
        <p className="prose-measure mt-4 text-lg leading-relaxed text-ink-soft">Il carrello è vuoto.</p>
        <Link
          href="/shop/stampe"
          className="group mt-6 inline-flex items-center gap-1.5 self-start text-sm text-ink transition-colors hover:text-accent"
        >
          <span className="link-underline" data-active="true">
            Guarda le stampe
          </span>
          <ArrowRight size={16} className="shrink-0" />
        </Link>
      </div>
    </div>
  );
}
