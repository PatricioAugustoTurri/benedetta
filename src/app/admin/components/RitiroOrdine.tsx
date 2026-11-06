"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { prontoAzione, ritiratoAzione, type EsitoSpedizione } from "../ordini/actions";

type Passo = "pronto" | "ritirato";

/**
 * I due gesti di un ordine da ritirare in negozio, al posto del corriere.
 *
 * **Pronto**: l'ha stampato e lo tiene lì. Se la spunta resta accesa, a chi
 * ha comprato arriva la mail con l'indirizzo del negozio. Prima di partire
 * chiede un secondo sì, come la spedizione: una mail non si richiama.
 *
 * **Ritirato**: è passato a prenderlo. Non scrive a nessuno. Si può segnare
 * anche senza averlo detto pronto —chi entra in negozio il giorno dopo e se
 * lo porta via—, e chiede anche lui un secondo sì, perché un ordine
 * ritirato esce dalla lista di quelli da fare.
 */
export default function RitiroOrdine({
  id,
  nome,
  email,
  pronto,
}: {
  id: number;
  nome: string;
  email: string;
  pronto: boolean;
}) {
  const [esitoPronto, azionePronto, inCorsoPronto] = useActionState<EsitoSpedizione, FormData>(prontoAzione, {});
  const [esitoRitirato, azioneRitirato, inCorsoRitirato] = useActionState<EsitoSpedizione, FormData>(
    ritiratoAzione,
    {},
  );
  const [avvisa, setAvvisa] = useState(true);
  const [confermando, setConfermando] = useState<Passo | null>(null);
  const conferma = useRef<HTMLButtonElement>(null);
  const inCorso = inCorsoPronto || inCorsoRitirato;

  // Una risposta del server, anche un errore, riporta ai pulsanti.
  const [visti, setVisti] = useState([esitoPronto, esitoRitirato]);
  if (visti[0] !== esitoPronto || visti[1] !== esitoRitirato) {
    setVisti([esitoPronto, esitoRitirato]);
    setConfermando(null);
  }

  useEffect(() => {
    if (confermando) conferma.current?.focus();
  }, [confermando]);

  const chiedi = (passo: Passo) => (e: FormEvent<HTMLFormElement>) => {
    if (confermando === passo) return;
    e.preventDefault();
    setConfermando(passo);
  };

  const pulsante =
    "border border-ink bg-ink px-4 py-2 text-xs text-paper transition-opacity hover:opacity-85 disabled:opacity-50";
  const link = "link-underline text-xs text-ink-soft transition-colors hover:text-ink disabled:opacity-50";

  return (
    <div className="mt-5 border-t border-line pt-4">
      {confermando === "pronto" ? (
        <form action={azionePronto} aria-live="polite">
          <input type="hidden" name="id" value={id} />
          {avvisa && <input type="hidden" name="avvisa" value="on" />}
          <p className="text-sm text-ink">
            L&rsquo;ordine <span className="figures">#{id}</span> è pronto da ritirare in negozio.
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {avvisa ? (
              <>
                Arriva una mail a <span className="break-all text-ink">{email}</span> con l&rsquo;indirizzo del
                negozio, e non si può richiamare.
              </>
            ) : (
              "Il cliente non riceve nessuna mail."
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button ref={conferma} type="submit" disabled={inCorso} className={pulsante}>
              {inCorso ? "Un momento…" : avvisa ? "Conferma e avvisa" : "Conferma"}
            </button>
            <button type="button" onClick={() => setConfermando(null)} disabled={inCorso} className={link}>
              Correggi
            </button>
          </div>
        </form>
      ) : confermando === "ritirato" ? (
        <form action={azioneRitirato} aria-live="polite">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm text-ink">
            {nome} ha ritirato l&rsquo;ordine <span className="figures">#{id}</span>.
          </p>
          <p className="mt-1 text-xs text-ink-soft">Non parte nessuna mail. Il biglietto comincia a contare da oggi.</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button ref={conferma} type="submit" disabled={inCorso} className={pulsante}>
              {inCorso ? "Un momento…" : "Conferma il ritiro"}
            </button>
            <button type="button" onClick={() => setConfermando(null)} disabled={inCorso} className={link}>
              Correggi
            </button>
          </div>
        </form>
      ) : pronto ? (
        <form action={azioneRitirato} onSubmit={chiedi("ritirato")}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" className={pulsante}>
            Segna come ritirato
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <form action={azionePronto} onSubmit={chiedi("pronto")} className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <input type="hidden" name="id" value={id} />
            <button type="submit" className={pulsante}>
              Segna come pronto
            </button>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={avvisa}
                onChange={(e) => setAvvisa(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer accent-[var(--color-accent)]"
              />
              Avvisa il cliente per mail
            </label>
          </form>
          <form action={azioneRitirato} onSubmit={chiedi("ritirato")}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className={link}>
              È già passato a prenderlo
            </button>
          </form>
        </div>
      )}

      {[esitoPronto, esitoRitirato].map((esito, i) =>
        esito.error ? (
          <p key={i} role="alert" className="mt-3 text-xs text-accent">
            {esito.error}
          </p>
        ) : esito.fatto ? (
          <p key={i} role="status" className="mt-3 text-xs text-ink-soft">
            {esito.fatto}
          </p>
        ) : null,
      )}
    </div>
  );
}
