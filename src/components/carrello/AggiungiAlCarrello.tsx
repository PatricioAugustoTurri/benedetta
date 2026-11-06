"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AZIONE } from "@/components/azione";
import { ArrowRight, Borsa } from "@/components/Icon";
import { misuraFormato } from "@/data/legale";
import { prezzo, prezzoScontato, variante, type Colore, type Formato } from "@/data/shop";
import { aggiungi, MAX_QUANTITA, type VoceCarrello } from "./store";

/**
 * Il formato e l'aggiunta al carrello, sulla scheda di una stampa.
 *
 * **I formati sono una lista con filetti, non un menu a tendina.** Sono tre,
 * hanno un prezzo ciascuno, e il prezzo è proprio quello che si confronta: in
 * una tendina si vedrebbe un formato alla volta. È la stessa lista di filetti
 * della scheda di un'opera (Anno, Tecnica), con il nome a sinistra e la cifra
 * a destra, e ogni riga si sceglie.
 *
 * Sotto c'è un `radio` vero, non un div che fa finta: le frecce lo
 * percorrono, il lettore di schermo dice «A4, 20 €, 3 di 4, selezionato», e
 * si manda con il modulo se un giorno servisse. Il segno di scelta è un
 * cerchio a filo con il centro in terracotta: terracotta come segno, mai come
 * campo.
 *
 * Dopo l'aggiunta il pulsante resta lì —si può aggiungerne un'altra, o un
 * altro formato— e sotto compare la conferma con la strada per il carrello.
 * La conferma si annuncia da sola (`role="status"`), perché chi usa un
 * lettore di schermo non vede la borsa cambiare. Se quel formato è già al
 * tetto di copie, la riga lo dice invece di confermare un'aggiunta che non
 * c'è stata.
 *
 * **Il colore, quando c'è, viene prima del formato** —la copertina del
 * calendario—. Non ha prezzo, quindi non è una riga di listino: è una fila di
 * campioni, come si sceglie un colore in un negozio, con il nome di quello
 * scelto accanto all'etichetta. Il campione è la tinta stessa, piena: è
 * l'unico punto in cui il sito si concede un colore che non è dentro
 * un'illustrazione, perché qui il colore è proprio la cosa che si compra.
 */
export default function AggiungiAlCarrello({
  slug,
  categoria,
  title,
  formati,
  colori = [],
  immagine,
  sconto,
}: {
  slug: string;
  categoria: string;
  title: string;
  formati: Formato[];
  /** I colori fra cui si sceglie, se il prodotto ne ha. */
  colori?: Colore[];
  immagine?: VoceCarrello["immagine"];
  /** La percentuale dello sconto in corso, se la stampa è in uno. */
  sconto?: number | null;
}) {
  const id = useId();
  const [scelto, setScelto] = useState(formati[0]?.formato ?? "");
  const [tinta, setTinta] = useState(colori[0]?.nome ?? "");
  const [aggiunto, setAggiunto] = useState<{ variante: string; pieno: boolean } | null>(null);
  const formato = formati.find((f) => f.formato === scelto);
  const colore = colori.find((c) => c.nome === tinta);
  const pronto = Boolean(formato) && (colori.length === 0 || Boolean(colore));

  return (
    <div>
      {colori.length > 0 && (
        <fieldset className="mb-8">
          <legend className="label">
            Copertina
            {/*
              Il nome di quello scelto, accanto all'etichetta: il campione da
              solo non dice «celeste» a chi i colori non li distingue bene.
              Per il lettore di schermo lo dice già il radio.
            */}
            <span aria-hidden="true" className="ml-2.5 text-sm normal-case tracking-normal text-ink">
              {colore?.nome}
            </span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-1">
            {colori.map((c) => (
              <label
                key={c.nome}
                htmlFor={`${id}-colore-${c.nome}`}
                data-scelto={c.nome === tinta}
                title={c.nome}
                className="group relative cursor-pointer p-1"
              >
                <input
                  id={`${id}-colore-${c.nome}`}
                  type="radio"
                  name={`${id}-colore`}
                  value={c.nome}
                  checked={c.nome === tinta}
                  onChange={() => {
                    setTinta(c.nome);
                    setAggiunto(null);
                  }}
                  className="peer sr-only"
                />
                <span className="sr-only">{c.nome}</span>
                {/*
                  L'anello è a filo e staccato dal campione da una striscia di
                  carta: segna la scelta senza toccare la tinta. Il filetto
                  dentro il campione serve ai colori chiari —giallo,
                  celeste— che sulla carta altrimenti sfumano.
                */}
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent transition-colors group-hover:border-line group-data-[scelto=true]:border-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-accent"
                >
                  <span
                    className="block h-7 w-7 rounded-full shadow-[inset_0_0_0_1px_rgb(28_26_22/0.14)]"
                    style={{ backgroundColor: c.tinta }}
                  />
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="label">Formato</legend>
        <div className="mt-3 border-t border-line">
          {formati.map((f) => (
            <label
              key={f.formato}
              htmlFor={`${id}-${f.formato}`}
              data-scelto={f.formato === scelto}
              className="group flex cursor-pointer items-center justify-between gap-6 border-b border-line py-3 text-ink-soft transition-colors hover:text-ink data-[scelto=true]:text-ink"
            >
              <span className="flex items-center gap-3">
                <input
                  id={`${id}-${f.formato}`}
                  type="radio"
                  name={`${id}-formato`}
                  value={f.formato}
                  checked={f.formato === scelto}
                  onChange={() => {
                    setScelto(f.formato);
                    setAggiunto(null);
                  }}
                  className="peer sr-only"
                />
                {/*
                  Il segno di scelta, disegnato. L'anello di fuoco va su di
                  lui —`peer-focus-visible`— perché il radio vero è
                  invisibile e senza questo chi usa la tastiera non vedrebbe
                  dove si trova.
                */}
                <span
                  aria-hidden="true"
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-ink-faint transition-colors group-data-[scelto=true]:border-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                >
                  <span className="block h-1.5 w-1.5 rounded-full bg-accent opacity-0 transition-opacity group-data-[scelto=true]:opacity-100" />
                </span>
                <span className="text-sm">{f.formato}</span>
                {/* Quanto è grande davvero: il nome della carta non lo dice a tutti. */}
                {misuraFormato(f.formato) && (
                  <span className="figures text-xs text-ink-faint">{misuraFormato(f.formato)}</span>
                )}
              </span>
              {/*
                Con lo sconto, il prezzo pieno barrato e accanto quello che si
                paga. Il barrato resta leggibile in pallido: chi compra deve
                poter confrontare i due numeri, non indovinare il primo.
              */}
              {sconto ? (
                <span className="figures flex items-baseline gap-2 text-sm">
                  <s className="text-xs text-ink-faint">
                    <span className="sr-only">Prezzo pieno </span>
                    {prezzo(f.prezzo)}
                  </s>
                  <span>
                    <span className="sr-only">Prezzo scontato </span>
                    {prezzo(prezzoScontato(f.prezzo, sconto))}
                  </span>
                </span>
              ) : (
                <span className="figures text-sm">{prezzo(f.prezzo)}</span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!pronto}
        onClick={() => {
          if (!formato || !pronto) return;
          const entrata = aggiungi({
            slug,
            categoria,
            title,
            formato: formato.formato,
            ...(colore ? { colore: colore.nome } : {}),
            // Nel carrello va il prezzo scontato; il server lo ricalcola
            // comunque prima di pagare, quindi questo è solo per mostrarlo.
            prezzo: prezzoScontato(formato.prezzo, sconto),
            scontata: Boolean(sconto),
            ...(sconto ? { pieno: formato.prezzo } : {}),
            immagine,
          });
          setAggiunto({
            // Senza colore resta la frase di sempre, «formato A4».
            variante: colore
              ? variante({ formato: formato.formato, colore: colore.nome })
              : `formato ${formato.formato}`,
            pieno: !entrata,
          });
        }}
        className={`mt-8 ${AZIONE} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Borsa size={18} className="shrink-0" />
        Aggiungi al carrello
      </button>

      <p role="status" className="mt-3 min-h-[1.25rem] text-xs text-ink-faint">
        {aggiunto ? (
          <>
            {aggiunto.pieno
              ? `Nel carrello ci sono già ${MAX_QUANTITA} copie, ${aggiunto.variante}: è il massimo.`
              : `Aggiunta al carrello, ${aggiunto.variante}.`}{" "}
            <Link
              href="/carrello"
              className="group inline-flex items-center gap-1 text-ink-soft transition-colors hover:text-ink"
            >
              <span className="link-underline">Vai al carrello</span>
              <ArrowRight size={14} className="shrink-0" />
            </Link>
          </>
        ) : (
          "Spedizione in Italia e nell’Unione Europea. Paghi con SumUp."
        )}
      </p>
    </div>
  );
}
