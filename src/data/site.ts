/**
 * Configurazione del sito.
 * Modifica questo file per cambiare nome, testi e social in tutto il sito.
 */
export const site = {
  name: "Illustrando",
  author: "Benedetta",
  role: "Illustratrice",
  // Si usa nel <title> e nelle anteprime quando si condivide il link.
  tagline: "Illustrazione editoriale, per l'infanzia e botanica",
  description:
    "Portfolio di illustrazione di Benedetta. Lavoro editoriale, libro illustrato per l'infanzia e serie botaniche ad acquerello e matita.",
  // PLACEHOLDER: non c'è ancora un dominio acquistato. Cambiare prima di
  // pubblicare: si usa per la SEO e per le anteprime quando si condivide il link.
  url: "https://illustrando.it",
  email: "bzibetti98@gmail.com",
  location: "Foligno, Italia",
  /**
   * La riga di mestiere del footer. È la posizione di PRODUCT.md detta in una
   * frase —l'analogico come origine, il digitale come consegna— ed è l'unica
   * cosa che il footer afferma sul lavoro. Non promette servizi né nomina
   * clienti: quello vive in Studio e oggi è testo segnaposto.
   */
  craft: "Acquerello, gouache e matita su carta. Il digitale solo quando il lavoro lo chiede.",
  /*
    IN SOSPESO, PARTE LEGALE — non inventare. Se lei fattura come lavoratrice
    autonoma in Italia, la partita IVA e il titolare del sito vanno nel footer
    per obbligo di legge. Non li abbiamo. Quando arriveranno, entrano nella
    riga di chiusura del Footer, accanto al copyright; la riga è già pronta per
    ricevere un dato in più.
  */
  // Solo i social con un URL reale. Behance esiste ma non abbiamo ancora il
  // link al profilo, e pubblicarlo puntando alla home di behance.net porta il
  // visitatore da nessuna parte: torna in lista quando ci sarà l'URL.
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/illustrando.adocchichiusi/" },
  ],
} as const;

/**
 * Navigazione principale. "Works" punta alla radice perché la home è
 * l'archivio dell'opera, non l'anticamera dell'archivio.
 *
 * **Le etichette sono in inglese su richiesta della cliente**, e questo
 * contraddice PRODUCT.md, che fissa l'italiano come principio di prodotto e
 * dice che Work e About erano provvisori. La contraddizione resta scritta qui
 * invece di risolversi da sola: se un giorno si torna all'italiano, sono Opere
 * e Studio, e "Contatti" —oggi l'unica etichetta italiana rimasta— è il capo
 * del filo.
 *
 * I percorsi NON cambiano: restano `/studio` e `/contatti`. Un'etichetta si
 * riscrive gratis; un URL già condiviso, no.
 */
export const nav = [
  { label: "Works", href: "/" },
  { label: "About me", href: "/studio" },
  { label: "Contatti", href: "/contatti" },
] as const;

/**
 * Footer: per ora ripete il menu principale. Continua a esistere separato
 * perché il footer è arrivato a elencare percorsi che non erano in alto, e può
 * succedere di nuovo il giorno in cui entra un'altra sezione.
 */
export const footerNav = [
  { label: "Works", href: "/" },
  { label: "About me", href: "/studio" },
  { label: "Contatti", href: "/contatti" },
] as const;
