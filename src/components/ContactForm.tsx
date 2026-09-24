"use client";

import { useId, useRef, useState } from "react";
import { AZIONE } from "@/components/azione";
import { Copy, Mail } from "@/components/Icon";
import { site } from "@/data/site";

/**
 * Il modulo di contatto.
 *
 * **Dove va quello che si scrive.** Non c'è un server, né un dominio, né un
 * servizio di moduli attivo: la richiesta si risolve via mail e fuori dal
 * sito. Quindi questo non "invia" niente — prepara il messaggio e lo passa al
 * programma di posta del visitatore, con oggetto e corpo già scritti. È
 * esattamente quello che fa già il pulsante "Chiedi info" di ogni opera, con
 * la differenza che qui il messaggio arriva pronto invece che vuoto.
 *
 * Questo ha un difetto noto ed è per quello che esiste la schermata di
 * conferma: se il visitatore non ha un programma di posta configurato,
 * `mailto:` non fa niente e non avvisa. Per questo, dopo l'invio, restano in
 * vista l'indirizzo e un pulsante per copiarsi il messaggio intero: qualunque
 * cosa succeda al mailto, c'è una via d'uscita.
 *
 * Il giorno in cui ci sarà un backend, l'unica cosa che cambia è `onSubmit`.
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

type Field = "nome" | "email" | "oggetto" | "messaggio";
type Errors = Partial<Record<Field, string>>;

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

export default function ContactForm({ asuntoInicial }: { asuntoInicial?: string }) {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const validate = (data: Record<Field, string>): Errors => {
    const next: Errors = {};
    if (!data.nome.trim()) next.nome = "Manca il tuo nome.";
    // Controllo minimo di proposito: quello vero lo fa la mail arrivando o non
    // arrivando. Un'espressione severa rifiuta indirizzi validi ma insoliti.
    if (!data.email.trim()) next.email = "Manca la tua email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      next.email = "Questa email non sembra completa.";
    if (!data.messaggio.trim()) next.messaggio = "Raccontami qualcosa, anche in breve.";
    return next;
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

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = read(form);
    const found = validate(data);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      // Il fuoco va al primo campo con un problema: chi non vede la pagina ha
      // bisogno che l'errore abbia un posto, non solo un testo.
      const first = Object.keys(found)[0] as Field;
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const cuerpo = `${data.messaggio.trim()}\n\n—\n${data.nome.trim()}\n${data.email.trim()}`;
    setSent(cuerpo);
    setCopied(false);

    /*
      L'oggetto lo scrive chi chiede, e quando si arriva da un'opera è già
      compilato. Se l'ha lasciato vuoto torna quello di prima, con il suo
      nome: una mail senza oggetto si perde in qualsiasi casella, e lasciarlo
      in bianco perché il campo è facoltativo sarebbe scaricare su di lei quel
      costo.
    */
    const asunto = data.oggetto.trim() || `Contatto — ${data.nome.trim()}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      asunto,
    )}&body=${encodeURIComponent(cuerpo)}`;
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
          Si è aperto il tuo programma di posta con il messaggio già scritto. Controllalo e
          invialo.
        </p>
        <p className="prose-measure mt-4 text-sm text-ink-soft">
          Non si è aperto niente? Copia il messaggio e mandamelo a{" "}
          <a
            href={`mailto:${site.email}`}
            className="link-underline break-all text-ink"
          >
            {site.email}
          </a>
          .
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(sent);
                setCopied(true);
              } catch {
                // Senza il permesso per gli appunti non c'è niente da fare da
                // qui, e il messaggio resta in vista per poterlo selezionare.
                setCopied(false);
              }
            }}
            className="group flex items-center gap-2 text-sm text-ink"
          >
            <Copy className="shrink-0 text-ink-faint transition-colors group-hover:text-accent" />
            <span className="link-underline" data-active="true">
              {copied ? "Copiato" : "Copia il messaggio"}
            </span>
          </button>

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

        {/*
          Il messaggio resta in vista, non nascosto dietro il pulsante di
          copia: se gli appunti non funzionano, si può ancora selezionare con
          il dito.
        */}
        <pre className="mt-8 whitespace-pre-wrap border-t border-line pt-6 font-sans text-sm leading-relaxed text-ink-soft">
          {sent}
        </pre>
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
        e «Invia» apre la mail—, quindi il visitatore ritrova in fondo al
        modulo il controllo che ha toccato sull'opera.
      */}
      <div className="mt-10">
        <button type="submit" className={AZIONE}>
          <Mail size={18} className="shrink-0" />
          Invia
        </button>
        <p className="mt-3 text-xs text-ink-faint">
          Si apre il tuo programma di posta con il messaggio già scritto. Non parte da solo.
        </p>
      </div>
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
