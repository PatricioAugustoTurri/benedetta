"use client";

import { useActionState, useId, useState } from "react";
import { annuncioNovita } from "@/data/newsletter";
import { newsletterAzione, type EsitoNewsletter } from "../newsletter/actions";
import { CONTROL, LABEL } from "./campo";

/** Una novità nella lista: quello che serve per riconoscerla a colpo d'occhio. */
export type VoceDaAnnunciare = {
  tipo: "opera" | "stampa";
  id: number;
  title: string;
  riga: string;
  immagine: string | null;
};

/**
 * Le novità da annunciare e l'invio.
 *
 * Tutte spuntate in partenza: di solito si annuncia tutto quello che è
 * arrivato. Quelle tolte dalla spunta restano in lista per la prossima volta,
 * a meno di toglierle apposta.
 *
 * Tre pulsanti sulla stessa scelta, in ordine di peso: inviare a tutti,
 * mandarsi una prova, togliere dalla lista senza inviare. Inviare a tutti non
 * si può disfare, e chiede conferma sulla riga stessa, come la cancellazione
 * di un'opera: si vede a quante persone parte mentre si decide.
 */
export default function NewsletterInvio({
  voci,
  iscritti,
  oggettoProposto,
}: {
  voci: VoceDaAnnunciare[];
  iscritti: number;
  oggettoProposto: string;
}) {
  const [esito, azione, inCorso] = useActionState<EsitoNewsletter, FormData>(newsletterAzione, {});
  const idBase = useId();
  const [scelte, setScelte] = useState(() => new Set(voci.map((v) => `${v.tipo}-${v.id}`)));
  // La conferma vale per l'esito che c'era quando si è aperta: appena
  // l'azione risponde, l'esito è un altro e la conferma si chiude da sola.
  const [confermaPer, setConfermaPer] = useState<EsitoNewsletter | null>(null);
  const confermando = confermaPer === esito;
  const nScelte = voci.filter((v) => scelte.has(`${v.tipo}-${v.id}`)).length;

  const cambia = (chiave: string, si: boolean) =>
    setScelte((s) => {
      const n = new Set(s);
      if (si) n.add(chiave);
      else n.delete(chiave);
      return n;
    });

  return (
    <form action={azione}>
      {esito.error && (
        <p role="alert" className="mt-5 nota">
          {esito.error}
        </p>
      )}
      {esito.fatto && (
        <p role="status" className="mt-5 nota nota--neutra">
          {esito.fatto}
        </p>
      )}

      <ul className="mt-5 border-t border-line">
        {voci.map((v) => {
          const chiave = `${v.tipo}-${v.id}`;
          return (
            <li key={chiave} className="border-b border-line">
              <label className="flex cursor-pointer items-center gap-4 py-3">
                <input
                  type="checkbox"
                  name={v.tipo}
                  value={v.id}
                  checked={scelte.has(chiave)}
                  onChange={(e) => cambia(chiave, e.target.checked)}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-accent)]"
                />
                <span className="block w-12 shrink-0 bg-paper-deep">
                  {v.immagine && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.immagine} alt="" className="aspect-[4/5] w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] text-ink">{v.title}</span>
                  <span className="figures mt-0.5 block truncate text-xs text-ink-faint">{v.riga}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 space-y-7">
        <div className="group/campo">
          <label htmlFor={`${idBase}-oggetto`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Oggetto
          </label>
          <input
            id={`${idBase}-oggetto`}
            name="oggetto"
            defaultValue={oggettoProposto}
            required
            maxLength={150}
            autoComplete="off"
            className={`${CONTROL} mt-2`}
          />
        </div>

        <div className="group/campo">
          <label htmlFor={`${idBase}-testo`} className={`${LABEL} group-has-[:focus]/campo:text-ink`}>
            Messaggio
          </label>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
            Viene dopo «Ciao Giulia,», con il nome di ognuno.
            {nScelte > 0 && (
              <>
                {" "}
                Se lo lasci vuoto, la mail dice: «
                {annuncioNovita(voci.filter((v) => scelte.has(`${v.tipo}-${v.id}`)))}»
              </>
            )}
          </p>
          <textarea
            id={`${idBase}-testo`}
            name="testo"
            rows={3}
            maxLength={3000}
            className={`${CONTROL} mt-2 field-sizing-content resize-y leading-relaxed`}
          />
        </div>
      </div>

      <div className="mt-10 border-t border-line pt-6">
        {confermando ? (
          <div>
            <p className="text-sm text-ink">
              Parte adesso a {iscritti === 1 ? "1 persona" : `${iscritti} persone`}, con{" "}
              {nScelte === 1 ? "1 novità" : `${nScelte} novità`}. Non si può disfare.
            </p>
            <div className="mt-4 flex items-center gap-6">
              <button
                type="submit"
                name="modo"
                value="invia"
                disabled={inCorso}
                className="bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {inCorso ? "Invio in corso…" : "Invia adesso"}
              </button>
              <button
                type="button"
                onClick={() => setConfermaPer(null)}
                className="link-underline text-sm text-ink-soft transition-colors hover:text-ink"
              >
                Non ancora
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <button
              type="button"
              onClick={() => setConfermaPer(esito)}
              disabled={inCorso || nScelte === 0 || iscritti === 0}
              className="bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {iscritti === 0
                ? "Nessun iscritto ancora"
                : `Invia a ${iscritti === 1 ? "1 iscritto" : `${iscritti} iscritti`}`}
            </button>
            <button
              type="submit"
              formAction="/admin/newsletter/anteprima"
              formMethod="get"
              formTarget="_blank"
              formNoValidate
              disabled={nScelte === 0}
              className="link-underline text-sm text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
            >
              Anteprima
            </button>
            <button
              type="submit"
              name="modo"
              value="prova"
              disabled={inCorso || nScelte === 0}
              className="link-underline text-sm text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
            >
              {inCorso ? "Un momento…" : "Mandami una prova"}
            </button>
            <button
              type="submit"
              name="modo"
              value="togli"
              formNoValidate
              disabled={inCorso || nScelte === 0}
              className="link-underline ml-auto text-xs text-ink-faint transition-colors hover:text-accent disabled:opacity-50"
            >
              Togli dalla lista senza inviare
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
