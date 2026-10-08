"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { iscriviti } from "@/app/(sitio)/newsletter/actions";
import { ArrowRight } from "@/components/Icon";
import { legaliPronte } from "@/data/legale";
import { pitch } from "@/data/newsletter";

/**
 * L'iscrizione alla newsletter, su una sola riga.
 *
 * Dove va a finire: vedi `src/lib/newsletter.ts`. L'indirizzo entra in
 * attesa e parte una mail con il link per confermare; la risposta qui dice di
 * andarla a cercare, perché finché non si conferma non arriva niente.
 *
 * **Perché il campo non ha un'etichetta in vista**, che è il contrario di
 * quello che fa il modulo di contatto: là ci sono tre campi e l'etichetta è
 * l'unica cosa che li distingue. Qui ce n'è uno solo, e la colonna è già
 * aperta dal suo maiuscoletto —"Newsletter"— con la frase che dice cosa si
 * riceve proprio sopra la riga. Una seconda etichetta in maiuscoletto sotto la
 * prima sarebbero due intestazioni per una cosa sola. Il `<label>` esiste
 * comunque, in `sr-only`: l'eccezione è visiva, non di accessibilità.
 */
export default function NewsletterForm() {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();

    // Lo stesso controllo minimo del modulo di contatto, e per la stessa
    // ragione: la validazione vera la fa la mail arrivando o non arrivando.
    if (!email) {
      setError("Manca la tua email.");
      form.querySelector<HTMLElement>('[name="email"]')?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Questa email non sembra completa.");
      form.querySelector<HTMLElement>('[name="email"]')?.focus();
      return;
    }

    setError(null);
    const dati = new FormData(form);
    startTransition(async () => {
      const esito = await iscriviti(dati).catch(() => null);
      if (esito?.ok) setSent(true);
      else setError(esito?.error ?? "Non riesco a iscriverti in questo momento. Riprova più tardi.");
    });
  };

  if (sent) {
    return (
      <p role="status" className="mt-4 text-sm leading-relaxed text-ink-soft">
        Quasi fatto: ti ho mandato una mail con un link per confermare l&apos;iscrizione. Se non
        la trovi, guarda anche nella posta indesiderata.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4">
      <p className="text-sm leading-relaxed text-ink-soft">{pitch}</p>

      {/*
        Il nome, facoltativo: la newsletter è una lettera e comincia con «Ciao
        Giulia,». Stessa riga su filetto del campo email, senza il pulsante.
      */}
      <label htmlFor={`${id}-nome`} className="sr-only">
        Il tuo nome (facoltativo)
      </label>
      <input
        id={`${id}-nome`}
        name="nome"
        type="text"
        autoComplete="given-name"
        maxLength={80}
        placeholder="il tuo nome"
        // `text-base` per la stessa ragione del campo email: niente zoom su iPhone.
        className="mt-4 block w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink"
      />

      {/*
        La riga: un solo filetto in basso, come qualsiasi campo del sito, e il
        pulsante dentro lo stesso filetto invece che sotto. `has-[:focus]`
        porta il filetto a inchiostro pieno —qui non c'è `:focus-within`
        perché anche il pulsante vive dentro e il suo fuoco non deve accendere
        il campo.
      */}
      {/*
        La riga con errore e con il cursore dentro resta una riga con errore:
        per questo l'ultima classe ripete lo stato di errore sotto quello di
        fuoco. `:has(input:focus)` pesa più di `[data-error]` per specificità,
        non per ordine, quindi senza quella terza classe il filetto tornava a
        inchiostro pieno appena il campo riprendeva il fuoco —che è proprio
        quello che fa un invio fallito— e l'errore restava senza colore.
        Stessa regola e stesso motivo del modulo di contatto.
      */}
      <div
        data-error={Boolean(error)}
        className="mt-1 flex items-center gap-2 border-b border-line transition-colors has-[input:focus]:border-ink data-[error=true]:border-accent data-[error=true]:has-[input:focus]:border-accent"
      >
        {/* Il vasetto di miele, uguale a quello del modulo di contatto. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={`${id}-sito`}>Non compilare questo campo</label>
          <input id={`${id}-sito`} name="sito" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <label htmlFor={`${id}-email`} className="sr-only">
          La tua email
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="la tua email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onInput={() => error && setError(null)}
          /*
            `text-base` non è tipografia: sotto i 16px Safari su iPhone fa zoom
            quando si mette a fuoco e lascia la pagina spostata. Stessa
            ragione, stessa misura e stesso commento del modulo di contatto.
          */
          className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-ink-faint"
        />
        <button
          type="submit"
          aria-disabled={pending || undefined}
          /*
            L'area di tocco misura 40px di altezza anche se la freccia ne
            misura 16: la riga è stretta e il bianco non può esserlo. L'anello
            di fuoco è quello del sito, intatto.
          */
          className="group -mr-1 flex h-10 w-10 shrink-0 items-center justify-center text-ink-faint transition-colors hover:text-accent aria-disabled:cursor-wait aria-disabled:opacity-50"
        >
          <span className="sr-only">{pending ? "Iscrizione in corso" : "Iscriviti"}</span>
          <ArrowRight size={16} className="shrink-0" />
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-2 text-xs text-accent">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        Ti disiscrivi quando vuoi, con un clic.
        {legaliPronte() && (
          <>
            {" "}
            <Link href="/privacy" className="link-underline text-ink-soft transition-colors hover:text-ink">
              Privacy
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
