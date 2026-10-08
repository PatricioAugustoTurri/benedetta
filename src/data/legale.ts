import { site } from "@/data/site";

/**
 * I dati legali e di vendita del sito, in un posto solo.
 *
 * Li leggono la privacy, le condizioni di vendita, la pagina delle
 * spedizioni, il footer e le schede delle stampe. **Quello che è `null` non lo
 * sappiamo ancora e non si inventa**: le pagine lo mostrano come «da
 * completare», in terracotta, e in cima dicono che sono una bozza finché ne
 * manca anche uno solo. Così nessuno può pubblicare per sbaglio una pagina
 * legale a metà senza vederlo.
 *
 * I testi legali sono una base scritta sulle regole italiane ed europee per
 * chi vende online a privati (Codice del Consumo, GDPR): vanno fatti
 * verificare da chi segue la parte fiscale e legale di lei prima di
 * pubblicarli.
 */
export const legale = {
  /** Chi vende e chi tratta i dati. */
  titolare: site.name,
  /** Obbligatoria nel sito se vende con partita IVA (DPR 633/72, art. 35). */
  partitaIva: null as string | null,
  codiceFiscale: null as string | null,
  /** L'indirizzo dove riceve posta: serve nelle condizioni e per il recesso. */
  indirizzo: null as string | null,
  email: site.email,
  pec: null as string | null,
  /**
   * Come si presentano i prezzi rispetto all'IVA: «IVA inclusa» o, nel
   * regime forfettario, «operazione senza applicazione dell'IVA ai sensi
   * dell'art. 1, commi 54–89, L. 190/2014». Lo decide chi tiene la sua
   * contabilità.
   */
  regimeIva: null as string | null,

  /** Quanto ci mette a stampare un ordine prima di spedirlo: «3–5 giorni lavorativi». */
  tempiProduzione: "uno o due giorni" as string | null,
  /**
   * Quanto richiede un lavoro su commissione —ritratto o illustrazione
   * personalizzata— prima di partire. Si dice nelle pagine perché chi lo
   * regala deve sapere quando ordinarlo.
   */
  tempiSuMisura: "da una a due settimane",
  /**
   * I corrieri con cui spedisce: sceglie quello più adatto a ogni pacco.
   * Li nominano la privacy, le condizioni e la pagina delle spedizioni.
   */
  corrieri: [
    "Poste Italiane",
    "BRT (Bartolini)",
    "GLS",
    "SDA",
    "InPost",
    "DHL",
  ],
  /** Quanto ci mette il pacco ad arrivare, una volta partito. */
  tempiConsegna: {
    italia: "5–7 giorni" as string | null,
    ue: "10–15 giorni" as string | null,
  },
  /** Come viaggia la stampa. */
  imballaggio:
    "in una scatola di cartone, imballata con cura e protetta perché non si pieghi né si rovini" as
      string | null,

  /** La carta delle stampe (cliente, 2026-10-08). */
  carta: "carta Modigliani Neve" as string | null,
  /**
   * Come nascono le illustrazioni da cui escono le stampe. È la tecnica del
   * disegno, non della stampa: lei disegna in digitale.
   */
  tecnica: "in digitale, con Procreate" as string | null,
  /**
   * La cornice. Le foto dei mockup la mostrano, quindi va detto chiaro che
   * non è compresa: si concorda con chi compra (cliente, 2026-10-08).
   */
  cornice: "si concorda insieme: scrivimi se la vuoi" as string | null,

  /** Quando sono stati scritti o cambiati questi testi. */
  aggiornato: "8 ottobre 2026",
};

/**
 * Le misure reali dei formati, in centimetri. Il listino li chiama con il
 * nome della carta («A4»); chi compra vuole sapere quanto è grande sul muro.
 * Un formato che non è qui esce senza misura, invece di una misura inventata.
 */
const MISURE: Record<string, string> = {
  a6: "10,5 × 14,8 cm",
  a5: "14,8 × 21 cm",
  a4: "21 × 29,7 cm",
  a3: "29,7 × 42 cm",
  a2: "42 × 59,4 cm",
};

export function misuraFormato(formato: string): string | null {
  // «20×20 cm», «30 x 40 cm»: la misura è già nel nome, e non si ripete.
  return MISURE[formato.trim().toLowerCase()] ?? null;
}

/** «Poste Italiane, BRT (Bartolini), GLS, SDA, InPost o DHL». */
export function elencoCorrieri(): string {
  const c = legale.corrieri;
  return c.length > 1
    ? `${c.slice(0, -1).join(", ")} o ${c[c.length - 1]}`
    : (c[0] ?? "");
}

/**
 * Se le pagine legali si possono mostrare: solo quando non manca più niente.
 * Fino ad allora in produzione rispondono 404 e nessun link porta lì; in
 * sviluppo si vedono, con la bozza segnata, per poterle rileggere. Il giorno
 * in cui si completano i dati qui sopra si accendono da sole, link compresi.
 */
export function legaliPronte(): boolean {
  return datiMancanti().length === 0;
}

/** Quello che manca ancora per pubblicare le pagine legali. */
export function datiMancanti(): string[] {
  const nomi: [unknown, string][] = [
    [legale.partitaIva, "partita IVA"],
    [legale.indirizzo, "indirizzo"],
    [legale.regimeIva, "regime IVA"],
    [legale.tempiProduzione, "tempi di produzione"],
    [legale.tempiConsegna.italia, "tempi di consegna in Italia"],
    [legale.tempiConsegna.ue, "tempi di consegna in UE"],
    [legale.imballaggio, "imballaggio"],
    [legale.carta, "carta"],
    [legale.tecnica, "tecnica"],
    [legale.cornice, "cornice"],
  ];
  return nomi.filter(([v]) => v === null).map(([, n]) => n);
}
