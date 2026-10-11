import { PROVINCE } from "@/data/province";

/**
 * Dove si spedisce e quanto costa, e i dati che chi compra scrive nel
 * carrello per riceverlo.
 *
 * Vive in un modulo che non tocca il server perché lo usano due parti che
 * non si fidano l'una dell'altra: il carrello, per rispondere mentre si
 * scrive e per mostrare la spedizione giusta appena si sceglie il paese, e
 * il pagamento, che ricontrolla tutto perché una Server Action si può
 * chiamare senza passare dal modulo.
 */

/* ----------------------------------------------------------- spedizione */

export type Zona = "italia" | "ue";

/** I paesi dell'Unione Europea, Italia esclusa: l'Italia è una zona a sé. */
const PAESI_UE = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR",
  "HU", "IE", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
] as const;

export type TariffaSpedizione = {
  zona: Zona;
  etichetta: string;
  /** Centesimi. */
  prezzo: number;
  paesi: readonly string[];
};

/**
 * Le due zone di spedizione, Italia e resto dell'Unione Europea.
 *
 * **La zona la decide il paese dell'indirizzo**, non una scelta a parte:
 * chi scrive Francia paga la tariffa europea, e non c'è modo di indirizzare
 * un pacco a Lione con la tariffa italiana. Lo ricalcola il server al
 * pagamento.
 *
 * Quanto costa spedire l'ha deciso la cliente (2026-10-07, ritoccato il
 * 2026-10-09): 8 € in Italia, 15 € nel resto dell'Unione Europea, a ordine
 * e non a copia. Vive nel codice come il listino delle stampe (FORMATI_BASE).
 */
export function tariffeSpedizione(): TariffaSpedizione[] {
  return [
    {
      zona: "italia",
      etichetta: "Italia",
      prezzo: 800,
      paesi: ["IT"],
    },
    {
      zona: "ue",
      etichetta: "Unione Europea",
      prezzo: 1500,
      paesi: PAESI_UE,
    },
  ];
}

/** La tariffa che vale per un paese, o null se lì non si spedisce. */
export function tariffaPer(paese: string): TariffaSpedizione | null {
  return tariffeSpedizione().find((t) => t.paesi.includes(paese)) ?? null;
}

const nomiPaesi = new Intl.DisplayNames(["it"], { type: "region" });

/** «DE» → «Germania». */
export function nomePaese(codice: string): string {
  return nomiPaesi.of(codice) ?? codice;
}

/**
 * I paesi in cui si spedisce, per il menu del modulo: l'Italia in testa,
 * perché è da lì che arriva quasi chi compra, e gli altri in ordine
 * alfabetico come li legge un italiano («Germania», non «Deutschland»).
 */
export function paesiSpedizione(): { codice: string; nome: string }[] {
  const resto = PAESI_UE.map((codice) => ({ codice, nome: nomePaese(codice) })).sort((a, b) =>
    a.nome.localeCompare(b.nome, "it"),
  );
  return [{ codice: "IT", nome: nomePaese("IT") }, ...resto];
}

/** Le province in ordine di nome, come si cercano scorrendo. */
export const PROVINCE_ORDINATE = [...PROVINCE].sort((a, b) => a[1].localeCompare(b[1], "it"));

/* ----------------------------------------------------------------- dati */

export type CampoSpedizione =
  | "email"
  | "telefono"
  | "nome"
  | "paese"
  | "codiceFiscale"
  | "indirizzo"
  | "interno"
  | "cap"
  | "citta"
  | "provincia";

export type DatiSpedizione = Record<CampoSpedizione, string>;
export type ErroriSpedizione = Partial<Record<CampoSpedizione, string>>;

export const DATI_VUOTI: DatiSpedizione = {
  email: "",
  telefono: "",
  nome: "",
  paese: "IT",
  codiceFiscale: "",
  indirizzo: "",
  interno: "",
  cap: "",
  citta: "",
  provincia: "",
};

/**
 * Quanto può essere lungo ogni campo. Abbastanza per qualsiasi indirizzo
 * vero, e non abbastanza per usare il modulo come un sacco.
 */
export const MAX: Record<CampoSpedizione, number> = {
  email: 254,
  telefono: 24,
  nome: 100,
  paese: 2,
  // 16 con qualche spazio in mezzo, come lo si copia dalla tessera.
  codiceFiscale: 20,
  indirizzo: 120,
  interno: 100,
  cap: 10,
  citta: 80,
  provincia: 60,
};

/** L'ordine dei campi nel modulo: il fuoco va al primo che non va. */
export const ORDINE_CAMPI: CampoSpedizione[] = [
  "email",
  "telefono",
  "nome",
  "paese",
  "codiceFiscale",
  "indirizzo",
  "interno",
  "cap",
  "citta",
  "provincia",
];

/** Toglie gli spazi in testa e in coda, e taglia al tetto: quello che si scrive nell'ordine. */
export function pulisci(dati: Partial<Record<string, unknown>>): DatiSpedizione {
  const d = { ...DATI_VUOTI };
  for (const c of ORDINE_CAMPI) {
    const v = dati[c];
    d[c] = typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, MAX[c]) : "";
  }
  d.paese = d.paese.toUpperCase();
  if (d.paese === "IT") {
    d.provincia = d.provincia.toUpperCase();
    d.cap = d.cap.replace(/\s/g, "");
    d.codiceFiscale = d.codiceFiscale.replace(/\s/g, "").toUpperCase();
  } else {
    // Fuori dall'Italia non si chiede: non resta scritto uno vecchio.
    d.codiceFiscale = "";
  }
  return d;
}

/**
 * Le regole, dette come le direbbe lei. Controlli minimi di proposito: la
 * forma di un CAP italiano sì, perché un CAP sbagliato è un pacco che torna
 * indietro; quella dei CAP degli altri paesi no, perché ognuno ha la sua
 * —«1012 AB», «00-950», «D02 X285»— e una regola severa respinge indirizzi
 * veri.
 */
export function validaSpedizione(grezzi: DatiSpedizione): ErroriSpedizione {
  const d = pulisci(grezzi);
  const errori: ErroriSpedizione = {};
  const italia = d.paese === "IT";

  if (!d.email) errori.email = "Manca la tua email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errori.email = "Questa email non sembra completa.";

  const cifre = d.telefono.replace(/\D/g, "").length;
  if (!d.telefono) errori.telefono = "Manca il telefono: serve al corriere.";
  else if (!/^\+?[\d\s().\/-]+$/.test(d.telefono) || cifre < 6 || cifre > 15)
    errori.telefono = "Questo numero non sembra completo.";

  if (!d.nome) errori.nome = "Manca il nome di chi riceve il pacco.";
  else if (d.nome.length < 2) errori.nome = "Scrivi nome e cognome.";

  if (!tariffaPer(d.paese)) errori.paese = "Spedisco solo in Italia e nell'Unione Europea.";

  if (italia) {
    if (!d.codiceFiscale) errori.codiceFiscale = "Manca il codice fiscale.";
    else if (!codiceFiscaleValido(d.codiceFiscale))
      errori.codiceFiscale =
        d.codiceFiscale.length !== 16 && d.codiceFiscale.length !== 11
          ? "Il codice fiscale ha 16 caratteri (11 cifre per un'azienda)."
          : "Questo codice fiscale non torna: controlla lettere e numeri.";
  }

  if (!d.indirizzo) errori.indirizzo = "Manca l'indirizzo.";
  else if (d.indirizzo.length < 3) errori.indirizzo = "Scrivi via e numero civico.";

  if (!d.cap) errori.cap = "Manca il CAP.";
  else if (italia ? !/^\d{5}$/.test(d.cap) : !/^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/.test(d.cap))
    errori.cap = italia ? "Il CAP ha cinque cifre." : "Questo codice postale non sembra giusto.";

  if (!d.citta) errori.citta = "Manca la città.";

  if (italia && !PROVINCE.some(([sigla]) => sigla === d.provincia))
    errori.provincia = "Scegli la provincia.";

  return errori;
}

/* ------------------------------------------------------- codice fiscale */

/*
  I valori del carattere di controllo: l'ultimo dei 16 si calcola dagli altri
  quindici, con un valore per i caratteri in posizione dispari e uno per
  quelli in posizione pari. Così una lettera sbagliata copiando dalla tessera
  si vede qui, e non quando lei prepara la ricevuta.
*/
const DISPARI: Record<string, number> = Object.fromEntries(
  [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23].flatMap((v, i) => [
    [String.fromCharCode(65 + i), v],
    ...(i < 10 ? [[String(i), v]] : []),
  ]),
);

/**
 * Un codice fiscale italiano: 16 caratteri per una persona —con il controllo
 * dell'ultimo, e le lettere che sostituiscono le cifre nei casi di omocodia—
 * o 11 cifre per un'azienda, che ha come codice fiscale la sua partita IVA.
 */
export function codiceFiscaleValido(cf: string): boolean {
  if (/^\d{11}$/.test(cf)) {
    // La partita IVA: l'undicesima cifra controlla le altre dieci.
    let somma = 0;
    for (let i = 0; i < 10; i++) {
      let n = Number(cf[i]);
      if (i % 2 === 1) n = n * 2 > 9 ? n * 2 - 9 : n * 2;
      somma += n;
    }
    return (10 - (somma % 10)) % 10 === Number(cf[10]);
  }
  if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(cf)) {
    return false;
  }
  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const c = cf[i];
    // Posizione 1, 3, 5… (dispari contando da 1) è l'indice pari.
    somma += i % 2 === 0 ? DISPARI[c] : /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 65;
  }
  return String.fromCharCode(65 + (somma % 26)) === cf[15];
}
