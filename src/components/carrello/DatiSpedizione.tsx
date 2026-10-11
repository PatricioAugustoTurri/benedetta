"use client";

import type { ReactNode } from "react";
import { CONTROL, LABEL } from "@/components/campo";
import { ChevronDown } from "@/components/Icon";
import {
  MAX,
  PROVINCE_ORDINATE,
  paesiSpedizione,
  type CampoSpedizione,
  type DatiSpedizione as Dati,
  type ErroriSpedizione,
} from "@/lib/spedizione";

const PAESI = paesiSpedizione();

/**
 * I dati per spedire: quello che prima si scriveva sulla pagina di Stripe e
 * che SumUp non chiede, perché SumUp riceve solo un importo.
 *
 * Due gruppi, come li legge chi compra: **a chi scrivere** (email e
 * telefono) e **dove spedire** (nome, paese, indirizzo, CAP, città,
 * provincia). Ogni gruppo si apre su un filetto con il nome nel ruolo di
 * sezione, come le sezioni dello Shop; i campi sono quelli di Contatti, lo
 * stesso disegno lettera per lettera (campo.ts).
 *
 * **Il paese decide il resto.** Sceglie la tariffa di spedizione —i conti a
 * destra cambiano appena lo si sceglie— e il modulo: in Italia il CAP sono
 * cinque cifre, la provincia è una sigla da una lista e il codice fiscale è
 * obbligatorio; altrove provincia e codice fiscale non si chiedono, perché il
 * codice postale basta al corriere, e il CAP prende lettere e spazi.
 *
 * Ogni campo porta il suo `autocomplete` con il prefisso `shipping`: il
 * browser e il gestore di password riempiono l'indirizzo in un tocco, come
 * su qualsiasi pagina di pagamento.
 */
export default function DatiSpedizione({
  id,
  dati,
  errori,
  onCambia,
}: {
  id: string;
  dati: Dati;
  errori: ErroriSpedizione;
  onCambia: (campo: CampoSpedizione, valore: string) => void;
}) {
  const italia = dati.paese === "IT";

  // Le proprietà che ogni controllo ha uguali: id, nome, valore, errore.
  const comune = (campo: CampoSpedizione) => ({
    id: `${id}-${campo}`,
    name: campo,
    value: dati[campo],
    maxLength: MAX[campo],
    "aria-invalid": errori[campo] ? (true as const) : undefined,
    "aria-describedby":
      [suggerimenti[campo] && `${id}-${campo}-hint`, errori[campo] && `${id}-${campo}-errore`]
        .filter(Boolean)
        .join(" ") || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onCambia(campo, e.target.value),
  });

  const campo = (c: CampoSpedizione, etichetta: string, controllo: ReactNode, opzioni?: { facoltativo?: boolean; classe?: string }) => (
    <Campo
      key={c}
      id={`${id}-${c}`}
      etichetta={etichetta}
      suggerimento={suggerimenti[c]}
      errore={errori[c]}
      facoltativo={opzioni?.facoltativo}
      className={opzioni?.classe}
    >
      {controllo}
    </Campo>
  );

  return (
    <div className="space-y-12">
      <Gruppo id={`${id}-contatti`} titolo="Contatti">
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
          {campo(
            "email",
            "Email",
            <input
              {...comune("email")}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              className={`${CONTROL} mt-2`}
            />,
          )}
          {campo(
            "telefono",
            "Telefono",
            <input {...comune("telefono")} type="tel" autoComplete="tel" className={`${CONTROL} figures mt-2`} />,
          )}
        </div>
      </Gruppo>

      <Gruppo id={`${id}-indirizzo`} titolo="Indirizzo di spedizione">
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-12">
          {campo(
            "nome",
            "Nome e cognome",
            <input {...comune("nome")} type="text" autoComplete="shipping name" className={`${CONTROL} mt-2`} />,
            { classe: "sm:col-span-12" },
          )}
          {campo(
            "paese",
            "Paese",
            <Menu>
              <select {...comune("paese")} autoComplete="shipping country" className={`${CONTROL} ${MENU}`}>
                {PAESI.map((p) => (
                  <option key={p.codice} value={p.codice}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </Menu>,
            { classe: "sm:col-span-12" },
          )}
          {/*
            Subito sotto il paese, perché è il paese a chiederlo: scegliendo
            Italia compare, scegliendone un altro se ne va. Chi lo vede nascere
            sotto la sua scelta capisce perché è lì.
          */}
          {italia &&
            campo(
              "codiceFiscale",
              "Codice fiscale",
              <input
                {...comune("codiceFiscale")}
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className={`${CONTROL} figures mt-2 tracking-[0.06em] uppercase`}
              />,
              { classe: "sm:col-span-12" },
            )}
          {campo(
            "indirizzo",
            "Indirizzo",
            <input
              {...comune("indirizzo")}
              type="text"
              autoComplete="shipping address-line1"
              className={`${CONTROL} mt-2`}
            />,
            { classe: "sm:col-span-12" },
          )}
          {campo(
            "interno",
            "Scala, interno, presso",
            <input
              {...comune("interno")}
              type="text"
              autoComplete="shipping address-line2"
              className={`${CONTROL} mt-2`}
            />,
            { facoltativo: true, classe: "sm:col-span-12" },
          )}
          {campo(
            "cap",
            "CAP",
            <input
              {...comune("cap")}
              type="text"
              autoComplete="shipping postal-code"
              inputMode={italia ? "numeric" : "text"}
              autoCapitalize="characters"
              className={`${CONTROL} figures mt-2`}
            />,
            { classe: italia ? "sm:col-span-3" : "sm:col-span-4" },
          )}
          {campo(
            "citta",
            "Città",
            <input
              {...comune("citta")}
              type="text"
              autoComplete="shipping address-level2"
              className={`${CONTROL} mt-2`}
            />,
            { classe: italia ? "sm:col-span-5" : "sm:col-span-8" },
          )}
          {italia &&
            campo(
              "provincia",
              "Provincia",
              <Menu>
                <select
                  {...comune("provincia")}
                  autoComplete="shipping address-level1"
                  data-vuoto={dati.provincia === ""}
                  className={`${CONTROL} ${MENU} data-[vuoto=true]:text-ink-faint`}
                >
                  <option value="" disabled>
                    Scegli
                  </option>
                  {PROVINCE_ORDINATE.map(([sigla, nome]) => (
                    <option key={sigla} value={sigla} className="text-ink">
                      {nome}
                    </option>
                  ))}
                </select>
              </Menu>,
              { classe: "sm:col-span-4" },
            )}
        </div>
      </Gruppo>
    </div>
  );
}

/**
 * Le due righe di aiuto, sopra il campo e mai dentro: un segnaposto sparisce
 * proprio quando serve. Email e telefono ne hanno una tutti e due, così i
 * due controlli affiancati partono alla stessa altezza.
 */
const suggerimenti: Partial<Record<CampoSpedizione, string>> = {
  email: "Qui ti arriva la conferma dell'ordine.",
  telefono: "Per il corriere, se deve chiamarti.",
  codiceFiscale: "Obbligatorio per gli ordini in Italia: lo trovi sulla tessera sanitaria.",
};

/*
  Un menu a tendina con il disegno del campo: lo stesso filetto, nessun
  riquadro, e al posto della freccia del sistema —diversa su ogni browser— il
  segno dei menu dello Shop. `pr-7` lascia il posto alla freccia, che non
  intercetta il clic.
*/
const MENU = "mt-2 cursor-pointer appearance-none pr-7";

function Menu({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-0 bottom-3.5 text-ink-faint transition-colors group-has-[:focus]/campo:text-ink"
      />
    </div>
  );
}

function Gruppo({ id, titolo, children }: { id: string; titolo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h2 id={id} className="display-section">
        {titolo}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/**
 * Un campo: l'etichetta sopra, l'eventuale riga di aiuto, il controllo sul
 * suo filetto, e l'errore sotto, in terracotta, che vince sul fuoco. Uguale
 * al campo di Contatti; in più sa dire «facoltativo», in fondo alla riga
 * dell'etichetta e in minuscolo, perché si legga come una nota e non come
 * parte del nome.
 */
function Campo({
  id,
  etichetta,
  suggerimento,
  errore,
  facoltativo,
  className,
  children,
}: {
  id: string;
  etichetta: string;
  suggerimento?: string;
  errore?: string;
  facoltativo?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`group/campo min-w-0 ${className ?? ""}`} data-error={Boolean(errore)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className={`${LABEL} group-has-[:focus]/campo:text-ink group-data-[error=true]/campo:text-accent`}
        >
          {etichetta}
        </label>
        {facoltativo && <span className="text-xs text-ink-faint">facoltativo</span>}
      </div>

      {suggerimento && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-ink-faint">
          {suggerimento}
        </p>
      )}

      {children}

      {errore && (
        <p id={`${id}-errore`} className="mt-2 text-xs leading-relaxed text-accent">
          {errore}
        </p>
      )}
    </div>
  );
}
