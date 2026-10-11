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
