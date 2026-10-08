"use client";

import Link from "next/link";
import { useId, useRef, useState, useTransition } from "react";
import { inviaContatto } from "@/app/(sitio)/contatti/actions";
import { AZIONE } from "@/components/azione";
import { Copy, Mail } from "@/components/Icon";
import { legaliPronte } from "@/data/legale";
import { site } from "@/data/site";
import { MAX, validaContatto, type Campo as Field, type ErroriContatto as Errors } from "@/lib/contacto";

/**
 * Il modulo di contatto.
 *
 * **Dove va quello che si scrive.** Il messaggio parte dal server, via Resend
 * (vedi `src/lib/correo.ts`): a lei arriva una mail con tutti i dettagli, e al
 * visitatore una conferma che il messaggio è arrivato. Nessun programma di
 * posta si apre.
 *
 * Se l'invio fallisce, il modulo lo dice e non perde niente: i campi restano
 * scritti, e sotto compaiono l'indirizzo e un pulsante per copiarsi il
 * messaggio intero. Il modulo non finge mai di aver inviato.
 *
 * **Come si disegna un campo in questo sistema**, che non ne aveva nessuno:
 * un'etichetta in maiuscoletto —che è quello che DESIGN.md riserva al nome di
 * un campo— e sotto il testo su un solo filetto. Senza riquadro, senza
 * riempimento, senza raggio: una riga su cui si scrive, come il resto del
 * sito separa con filetti e aria invece che con riquadri.
 *
 * Gli stati usano quello che il sistema ha già:
 * - **Riposo:** filetto `line`, etichetta in inchiostro pallido.
 * - **Fuoco:** il filetto passa a inchiostro pieno e l'etichetta pure.
 *   L'anello di fuoco è lo stesso di tutto il sito, intatto: è l'indicatore
 *   che conosce già chi naviga con il tab, e cambiarlo qui sarebbe inventare
 *   una seconda lingua.
 * - **Errore:** il filetto passa a terracotta e sotto compare il motivo,
 *   anche lui in terracotta. È colore come segnale di stato, che è l'unica
 *   cosa per cui questo sistema usa la terracotta.
 */

const LABEL = "label block text-ink-faint transition-colors";

/*
  Il campo intero, senza riquadro. `peer` permette all'etichetta di reagire al
  fuoco del controllo senza JavaScript. Il filetto è il `border-b` del
  controllo stesso, quindi misura esattamente quanto misura il campo.
*/
const CONTROL =
  "peer block w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink transition-colors placeholder:text-ink-faint focus:border-ink aria-[invalid=true]:border-accent aria-[invalid=true]:focus:border-accent";

/*
  `text-base` non è una scelta tipografica: sotto i 16px, Safari su iPhone fa
  zoom quando si mette a fuoco un campo e lascia la pagina spostata. Il corpo
  del testo del sito misura 16px, quindi coincide senza sforzo, ma se qualcuno
  lo abbassa, è questo che si rompe.

  Lo stato di errore e quello di fuoco possono darsi insieme, e
  `aria-[invalid=true]:focus` pesa più di `focus` per specificità, non per
  ordine: un campo con errore e con il cursore dentro resta un campo con
  errore.
*/

export default function ContactForm({
  asuntoInicial,
  opera,
}: {
  asuntoInicial?: string;
  /** Lo slug dell'opera da cui arriva il visitatore, se è entrato da «Chiedi info». */
  opera?: string;
}) {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  /** L'indirizzo a cui è partita la conferma, quando il messaggio è arrivato. */
  const [sent, setSent] = useState<string | null>(null);
  /** Il messaggio intero, pronto da copiare, quando l'invio è fallito. */
  const [failed, setFailed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const validate = validaContatto;

  const focusFirst = (form: HTMLFormElement, found: Errors) => {
    // Il fuoco va al primo campo con un problema: chi non vede la pagina ha
    // bisogno che l'errore abbia un posto, non solo un testo.
    const first = Object.keys(found)[0] as Field | undefined;
    if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const read = (form: HTMLFormElement): Record<Field, string> => {
    const fd = new FormData(form);
    return {
      nome: String(fd.get("nome") ?? ""),
      email: String(fd.get("email") ?? ""),
      oggetto: String(fd.get("oggetto") ?? ""),
      messaggio: String(fd.get("messaggio") ?? ""),
    };
  };

  /*
    Si chiama l'azione a mano invece di passarla ad `action={…}` del modulo:
    con `action`, React svuota i campi quando l'azione finisce, anche quando
    fallisce, e chi ha appena scritto un messaggio lungo lo perderebbe proprio
    nel momento in cui deve riprovare.
  */
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const form = e.currentTarget;
    const data = read(form);
    const found = validate(data);
    setErrors(found);
    setFailed(null);

    if (Object.keys(found).length > 0) {
      focusFirst(form, found);
      return;
    }

    const fd = new FormData(form);
    startTransition(async () => {
      let esito: Awaited<ReturnType<typeof inviaContatto>>;
      try {
        esito = await inviaContatto(fd);
      } catch {
        // Senza rete, o con il server giù, l'azione non risponde nemmeno.
        esito = { ok: false, error: "invio" };
      }

      if (esito.ok) {
        setSent(data.email.trim());
        return;
      }
      if (esito.errori && Object.keys(esito.errori).length > 0) {
        setErrors(esito.errori);
        focusFirst(form, esito.errori);
        return;
      }

      const asunto = data.oggetto.trim() ? `${data.oggetto.trim()}\n\n` : "";
      setFailed(
        `${asunto}${data.messaggio.trim()}\n\n—\n${data.nome.trim()}\n${data.email.trim()}`,
      );
      setCopied(false);
    });
  };

  /*
    Rivalidare mentre si scrive, ma solo il campo che è già fallito. Prima del
    primo invio nessuno ha ancora sbagliato; segnalarlo mentre scrive è metterlo
    fretta.
  */
  const revalidate = (field: Field) => {
    if (!errors[field] || !formRef.current) return;
    const found = validate(read(formRef.current));
    setErrors((prev) => ({ ...prev, [field]: found[field] }));
  };

  if (sent) {
    return (
      <div className="mt-10 border-t border-line pt-8">
        <p role="status" className="text-lg leading-relaxed text-ink">
          Grazie, il tuo messaggio è arrivato. Ti rispondo appena posso.
        </p>
        <p className="prose-measure mt-4 text-sm text-ink-soft">
          Ti ho mandato una conferma a <span className="break-all text-ink">{sent}</span>. Se non
          la vedi, dai un&apos;occhiata anche nella posta indesiderata.
        </p>

        <div className="mt-7">
          <button
            type="button"
            onClick={() => {
              setSent(null);
              setErrors({});
            }}
            className="text-sm text-ink-faint transition-colors hover:text-ink"
          >
            <span className="link-underline">Scrivine un altro</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      /*
        `noValidate` perché i fumetti del browser non parlino al posto del
        sito: escono senza stile, nella lingua del browser e non in quella
        della pagina. La validazione è quella qui sopra, con gli stessi
        messaggi e la stessa voce.
      */
      noValidate
      className="mt-10 border-t border-line pt-8"
    >
      {opera && <input type="hidden" name="opera" value={opera} />}

      {/*
        Il vasetto di miele contro i robot: fuori dallo schermo, fuori dal
        tab e nascosto ai lettori di schermo. Una persona non lo vede né lo
        compila; un robot che riempie tutti i campi sì, e il server scarta il
        messaggio in silenzio. `sito` e non `website` perché i gestori di
        password non lo riconoscano e lo compilino da soli.
      */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-sito`}>Non compilare questo campo</label>
        <input id={`${id}-sito`} name="sito" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-8">
        <Campo
          id={`${id}-nome`}
          name="nome"
          label="Nome"
          error={errors.nome}
          onInput={() => revalidate("nome")}
        />
        <Campo
          id={`${id}-email`}
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          error={errors.email}
          onInput={() => revalidate("email")}
        />
        {/*
          L'oggetto va fra la mail e il messaggio, e non è un campo come gli
          altri: è quello che arriva già scritto quando qualcuno tocca «Chiedi
          info» su un'opera. Lì il visitatore vede, prima di scrivere una
          parola, che il modulo sa da quale opera arriva — che è quello che
          prima provava a fare l'oggetto di un `mailto:` che molte volte non
          arrivava neanche ad aprirsi.

          Facoltativo di proposito: chi entra dal menu, senza venire da
          un'opera, non deve compilare un campo in più per scrivere.
        */}
        <Campo
          id={`${id}-oggetto`}
          name="oggetto"
          label="Oggetto"
          hint="Il titolo dell'opera, o di cosa vuoi parlare."
          defaultValue={asuntoInicial}
          error={errors.oggetto}
          onInput={() => revalidate("oggetto")}
        />
        <Campo
          id={`${id}-messaggio`}
          name="messaggio"
          label="Messaggio"
          hint="Di cosa si tratta il progetto, per quando ti serve e in che formato."
          multiline
          error={errors.messaggio}
          onInput={() => revalidate("messaggio")}
        />
      </div>

      {/*
        L'invio ha la stessa forma di «Chiedi info»: filetto terracotta,
        busta, pieno sotto il puntatore. Non è una seconda azione forte ma la
        fine della stessa —«Chiedi info» porta qui con l'oggetto già scritto,
        e «Invia» manda il messaggio—, quindi il visitatore ritrova in fondo al
        modulo il controllo che ha toccato sull'opera.
      */}
      <div className="mt-10">
        <button
          type="submit"
          aria-disabled={pending || undefined}
          className={`${AZIONE} aria-disabled:cursor-wait aria-disabled:opacity-60`}
        >
          <Mail size={18} className="shrink-0" />
          {pending ? "Invio in corso…" : "Invia"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          Ti arriverà una mail di conferma all&apos;indirizzo che hai scritto. Uso i tuoi dati
          solo per risponderti
          {legaliPronte() ? (
            <>
              :{" "}
              <Link href="/privacy" className="link-underline text-ink-soft transition-colors hover:text-ink">
                privacy
              </Link>
              .
            </>
          ) : (
            "."
          )}
        </p>
      </div>

      {/*
        Il fallimento non svuota niente: i campi restano scritti per
        riprovare, e qui sotto c'è la strada che non dipende dal server.
      */}
      {failed && (
        <div role="alert" className="mt-8 border-t border-line pt-6">
          <p className="text-sm leading-relaxed text-accent">
            Non sono riuscita a inviare il messaggio.
          </p>
          <p className="prose-measure mt-2 text-sm leading-relaxed text-ink-soft">
            Riprova tra un momento, oppure copialo e mandamelo a{" "}
            <a href={`mailto:${site.email}`} className="link-underline break-all text-ink">
              {site.email}
            </a>
            .
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(failed);
                setCopied(true);
              } catch {
                // Senza il permesso per gli appunti non c'è niente da fare da
                // qui, e il messaggio resta scritto nei campi per selezionarlo.
                setCopied(false);
              }
            }}
            className="group mt-5 flex items-center gap-2 text-sm text-ink"
          >
            <Copy className="shrink-0 text-ink-faint transition-colors group-hover:text-accent" />
            <span className="link-underline" data-active="true">
              {copied ? "Copiato" : "Copia il messaggio"}
            </span>
          </button>
        </div>
      )}
    </form>
  );
}

function Campo({
  id,
  name,
  label,
  hint,
  error,
  type = "text",
  multiline = false,
  autoComplete,
  defaultValue,
  onInput,
}: {
  id: string;
  name: Field;
  label: string;
  hint?: string;
  error?: string;
  type?: string;
  multiline?: boolean;
  autoComplete?: string;
  /*
    Valore iniziale e non valore: il campo resta non controllato di proposito,
    perché quello che arriva precompilato si possa correggere, ampliare o
    cancellare come qualsiasi altra cosa che si scriva qui. Un oggetto che il
    visitatore non può toccare sarebbe dirgli di cosa gli è permesso parlare.
  */
  defaultValue?: string;
  onInput: () => void;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const shared = {
    id,
    name,
    autoComplete,
    defaultValue,
    // Lo stesso tetto che controlla il server: così il browser non lascia
    // scrivere quello che poi verrebbe rifiutato.
    maxLength: MAX[name],
    onInput,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
    className: CONTROL,
  };

  return (
    <div>
      {/*
        L'etichetta va sopra ed è un'etichetta vera, non un testo segnaposto
        dentro il campo: un placeholder sparisce proprio quando serve, cioè
        mentre si scrive.

        `peer-focus:` lo porta a inchiostro pieno quando il campo è a fuoco
        —l'ordine nel DOM è etichetta, poi controllo, quindi va con `peer/…`
        sul contenitore invece di `peer-focus` all'indietro. Si risolve con
        `has-[:focus]` sul div, che invece guarda in avanti.
      */}
      <div className="group/campo" data-error={Boolean(error)}>
        <label
          htmlFor={id}
          className={`${LABEL} group-has-[:focus]/campo:text-ink group-data-[error=true]/campo:text-accent`}
        >
          {label}
        </label>

        {hint && (
          <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-ink-faint">
            {hint}
          </p>
        )}

        {multiline ? (
          /*
            `field-sizing-content` fa sì che cresca con quello che si scrive
            invece di aprire una barra di scorrimento dentro un riquadro di
            cinque righe. Dove non è ancora supportato restano le cinque righe
            e la maniglia manuale, che per questo resta attiva.
          */
          <textarea
            {...shared}
            rows={5}
            className={`${CONTROL} mt-2 field-sizing-content resize-y`}
          />
        ) : (
          <input {...shared} type={type} className={`${CONTROL} mt-2`} />
        )}

        {error && (
          <p id={errorId} className="mt-2 text-xs text-accent">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
