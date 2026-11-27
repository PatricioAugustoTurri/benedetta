"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Close, Qr } from "@/components/Icon";
import { site } from "@/data/site";
import { scaricaCartoline } from "@/lib/cartolinaRecensione";
import type { ContoInviti } from "@/lib/recensioni";
import { creaInvitiAzione, invitoUsatoAzione } from "../shop/actions";

const SITO = new URL(site.url).host;
const INSTAGRAM = (() => {
  const nome = site.socials.find((s) => s.label === "Instagram")?.href.match(/instagram\.com\/([^/?#]+)/)?.[1];
  return nome ? `@${nome}` : undefined;
})();
const FIRMA = "/benedetta-zibetti-wordmark.png";
const LAMINA = "/biglietto-ragazza.png";

/** Ogni quanto la finestra chiede se il QR è tornato come recensione. */
const OGNI = 4000;

type Codice =
  | { fase: "vuoto" }
  | { fase: "lavora" }
  | { fase: "pronto"; link: string; usato: boolean }
  | { fase: "errore"; messaggio: string };

type Prodotto = { id: number; title: string; slug: string };

/**
 * Il QR per chi ha comprato fuori dal sito —al mercato, in negozio— e vuole
 * lasciare una recensione (cliente, 2026-11-27). Ogni QR è un invito che vale
 * una volta sola: un codice rimasto sul banco non apre la porta a chiunque.
 *
 * Il momento vero è il banco: lei gira il telefono verso chi ha appena
 * comprato. Per questo il QR si apre a tutto schermo, sulla carta del
 * visore delle opere, con la domanda di sempre —«Com’è andata?»— sopra e due
 * righe per chi inquadra sotto. In fondo, piccole, le cose sue: un altro QR,
 * la cartolina da stampare, il link da mandare su WhatsApp.
 *
 * Mentre è aperta la finestra chiede ogni tanto se il codice è stato usato:
 * quando la recensione arriva lo dice, e il prossimo cliente ha il suo QR a
 * un tocco. Riaprendola, il QR non ancora usato è lo stesso di prima:
 * aprire e chiudere non consuma inviti.
 *
 * Due aspetti: l'icona nella griglia dello Shop, accanto alla matita, e il
 * riquadro nella scheda del prodotto, con il conto dei QR dati e il foglio
 * da quattro cartoline per chi li stampa a casa.
 */
export default function QrRecensione({
  prodotto: p,
  aspetto,
  conto: contoIniziale = null,
}: {
  prodotto: Prodotto;
  aspetto: "icona" | "scheda";
  conto?: ContoInviti | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const tasto = useRef<HTMLButtonElement>(null);
  const [aperto, setAperto] = useState(false);
  const [codice, setCodice] = useState<Codice>({ fase: "vuoto" });
  const [conto, setConto] = useState(contoIniziale);
  const [foglio, setFoglio] = useState<"fermo" | "lavora" | { errore: string }>("fermo");
  const [cartolina, setCartolina] = useState<"fermo" | "lavora" | "errore">("fermo");
  const [copiato, setCopiato] = useState(false);

  const nuovo = useCallback(async () => {
    setCodice({ fase: "lavora" });
    const esito = await creaInvitiAzione(p.id, 1).catch(() => ({ error: "Il QR non è venuto. Riprova." }));
    if ("error" in esito) {
      setCodice({ fase: "errore", messaggio: esito.error });
      return;
    }
    setCodice({ fase: "pronto", link: esito.links[0], usato: false });
    setConto(esito.conto);
  }, [p.id]);

  function apri() {
    dialog.current?.showModal();
    document.documentElement.style.overflow = "hidden";
    setAperto(true);
    if (codice.fase !== "pronto" || codice.usato) void nuovo();
  }

  const chiudi = () => dialog.current?.close();

  // `close` arriva dalla crocetta e da Esc: un solo punto che rimette la pagina com'era.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const alChiudere = () => {
      setAperto(false);
      setCopiato(false);
      document.documentElement.style.overflow = "";
      tasto.current?.focus({ preventScroll: true });
    };
    el.addEventListener("close", alChiudere);
    return () => el.removeEventListener("close", alChiudere);
  }, []);

  // Se il QR sullo schermo è tornato come recensione. Solo a finestra aperta
  // e con la scheda davanti: un telefono in tasca non chiede niente.
  const inAttesa = aperto && codice.fase === "pronto" && !codice.usato ? codice.link : null;
  useEffect(() => {
    if (!inAttesa) return;
    const t = window.setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const usato = await invitoUsatoAzione(inAttesa).catch(() => null);
      if (!usato) return;
      setCodice((c) => (c.fase === "pronto" && c.link === inAttesa ? { ...c, usato: true } : c));
      setConto((c) => (c ? { ...c, usati: c.usati + 1 } : c));
    }, OGNI);
    return () => window.clearInterval(t);
  }, [inAttesa]);

  async function scaricaQuesta() {
    if (codice.fase !== "pronto") return;
    setCartolina("lavora");
    try {
      await scaricaCartoline(
        [{ link: codice.link, prodotto: p.title, per: null, sito: SITO, instagram: INSTAGRAM }],
        `recensione-${p.slug}.pdf`,
        FIRMA,
        LAMINA,
      );
      setCartolina("fermo");
    } catch (e) {
      console.error(e);
      setCartolina("errore");
    }
  }

  async function scaricaFoglio() {
    setFoglio("lavora");
    const esito = await creaInvitiAzione(p.id, 4).catch(() => ({ error: "Le cartoline non sono venute. Riprova." }));
    if ("error" in esito) {
      setFoglio({ errore: esito.error });
      return;
    }
    setConto(esito.conto);
    try {
      await scaricaCartoline(
        esito.links.map((link) => ({ link, prodotto: p.title, per: null, sito: SITO, instagram: INSTAGRAM })),
        `recensioni-${p.slug}.pdf`,
        FIRMA,
        LAMINA,
      );
      setFoglio("fermo");
    } catch (e) {
      console.error(e);
      setFoglio({ errore: "Il PDF non è venuto. Riprova." });
    }
  }

  async function copia() {
    if (codice.fase !== "pronto") return;
    try {
      await navigator.clipboard.writeText(codice.link);
      setCopiato(true);
      window.setTimeout(() => setCopiato(false), 1800);
    } catch {
      window.prompt("Copia il link della recensione:", codice.link);
    }
  }

  const pronto = codice.fase === "pronto" && !codice.usato;
  const arrivata = codice.fase === "pronto" && codice.usato;

  const finestra = (
    <dialog ref={dialog} className="visore" aria-label={`QR per una recensione di ${p.title}`}>
      {aperto && (
        <div className="visore__telaio">
          <header className="visore__testa">
            <p className="min-w-0 truncate text-sm text-ink-soft">{p.title}</p>
            <button type="button" onClick={chiudi} className="visore__tasto -mr-2.5" aria-label="Chiudi">
              <Close size={22} />
            </button>
          </header>

          {/* La parte che si gira verso chi ha comprato. */}
          <div className="flex min-h-0 flex-col items-center justify-center overflow-y-auto px-[var(--gutter)] py-4 text-center">
            <h2 className="display-h1 text-[clamp(1.875rem,6vw,2.75rem)] leading-[1.1] text-balance">
              {arrivata ? "Arrivata. Grazie!" : "Com’è andata?"}
            </h2>

            <div className="mt-6 aspect-square w-[min(76vw,44dvh,21rem)]" aria-live="polite">
              {pronto && <CodiceQr link={codice.link} />}
              {codice.fase === "lavora" && (
                <span className="flex h-full w-full items-center justify-center bg-paper-deep text-sm text-ink-faint">
                  Preparo il QR…
                </span>
              )}
              {codice.fase === "errore" && (
                <span className="flex h-full w-full flex-col items-center justify-center gap-4 bg-paper-deep px-6 text-sm text-ink">
                  <span role="alert">{codice.messaggio}</span>
                  <button type="button" onClick={nuovo} className="link-underline text-ink-soft transition-colors hover:text-ink">
                    Riprova
                  </button>
                </span>
              )}
              {arrivata && (
                <span className="flex h-full w-full flex-col items-center justify-center gap-6 bg-paper-deep px-6">
                  <span className="max-w-[24ch] text-sm leading-relaxed text-ink-soft">
                    La recensione è già nella pagina del prodotto. Questo QR ha fatto il suo lavoro.
                  </span>
                  <button
                    type="button"
                    onClick={nuovo}
                    className="bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85"
                  >
                    Il prossimo QR
                  </button>
                </span>
              )}
            </div>

            <p className="mt-6 max-w-[34ch] leading-relaxed text-ink-soft">
              {arrivata
                ? "Per un altro cliente serve un QR nuovo: ognuno vale una volta."
                : "Inquadra il codice con il telefono: qualche stella e due righe, senza bisogno di account."}
            </p>
          </div>

          {/* Le cose sue, piccole, sotto un filetto: chi inquadra non le deve leggere. */}
          <footer className="visore__piede flex-wrap gap-x-5 gap-y-2 border-t border-line py-3 text-xs text-ink-faint">
            <span>Vale per una recensione sola</span>
            <button
              type="button"
              onClick={nuovo}
              disabled={codice.fase === "lavora"}
              className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
            >
              Un altro QR
            </button>
            <button
              type="button"
              onClick={copia}
              disabled={!pronto}
              className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
            >
              {copiato ? "Link copiato" : "Copia il link"}
            </button>
            <button
              type="button"
              onClick={scaricaQuesta}
              disabled={!pronto || cartolina === "lavora"}
              className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
            >
              {cartolina === "lavora" ? "Preparo il PDF…" : "Stampa questo QR"}
            </button>
            {cartolina === "errore" && (
              <span role="alert" className="w-full text-accent">
                Il PDF non è venuto. Riprova.
              </span>
            )}
          </footer>
        </div>
      )}
    </dialog>
  );

  if (aspetto === "icona") {
    return (
      <>
        <button
          ref={tasto}
          type="button"
          onClick={apri}
          title="QR per una recensione"
          aria-haspopup="dialog"
          className="flex h-8 w-8 items-center justify-center bg-paper/95 text-ink-soft transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          <span className="sr-only">QR per una recensione di {p.title}</span>
          <Qr size={16} />
        </button>
        {finestra}
      </>
    );
  }

  return (
    <div>
      <h2 className="label">Recensione dal vivo</h2>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        Per chi l’ha comprato fuori dal sito, al mercato o in negozio: un QR da fargli inquadrare. Ognuno
        vale per una recensione.
      </p>
      <button
        ref={tasto}
        type="button"
        onClick={apri}
        aria-haspopup="dialog"
        className="group mt-5 inline-flex items-center gap-2 border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:border-ink"
      >
        <Qr size={18} className="text-ink-soft transition-colors group-hover:text-ink" />
        Mostra il QR
      </button>
      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        <button
          type="button"
          onClick={scaricaFoglio}
          disabled={foglio === "lavora"}
          className="area-tocco link-underline text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
        >
          {foglio === "lavora" ? "Preparo il PDF…" : "Scarica quattro cartoline"}
        </button>{" "}
        da stampare e tagliare, ognuna con il suo QR.
      </p>
      {typeof foglio === "object" && (
        <p role="alert" className="mt-2 text-xs text-accent">
          {foglio.errore}
        </p>
      )}
      {conto && conto.dati > 0 && (
        <p className="figures mt-4 text-xs text-ink-faint">
          {conto.dati === 1 ? "1 QR dato" : `${conto.dati} QR dati`} ·{" "}
          {conto.usati === 0
            ? "ancora nessuna recensione"
            : conto.usati === 1
              ? "1 tornato come recensione"
              : `${conto.usati} tornati come recensione`}
        </p>
      )}
      {finestra}
    </div>
  );
}

/**
 * Il codice in SVG, a quadretti pieni nell'inchiostro del sito, con i
 * quattro moduli di margine che chiede lo standard: si legge da qualunque
 * telefono anche a schermo poco luminoso. `crispEdges` perché fra due
 * quadretti vicini non resti un filo di carta.
 */
function CodiceQr({ link }: { link: string }) {
  const { lato, d } = useMemo(() => {
    const qr = QRCode.create(link, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    let d = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
    }
    return { lato: n + 8, d };
  }, [link]);

  return (
    <svg
      viewBox={`0 0 ${lato} ${lato}`}
      className="block h-full w-full"
      shapeRendering="crispEdges"
      role="img"
      aria-label="Codice QR per la recensione"
    >
      <path d={d} fill="var(--color-ink)" />
    </svg>
  );
}
