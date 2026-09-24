/**
 * Quello che dice la pagina About.
 *
 * Il testo vive qui e non dentro il componente perché lo legge la pagina vera
 * e anche le anteprime di composizione: se fosse scritto in una delle due,
 * confrontare due bozze significherebbe confrontare due testi diversi.
 */

/**
 * Il video che apre la pagina, come tavola sul foglio: stessi margini di
 * un'opera dell'archivio, proporzione 16:9.
 *
 * PLACEHOLDER: il file non c'è ancora. Finché `src` è `null`, la cornice
 * disegna il fotogramma di copertina e nient'altro —vedi `StudioFilm`—, così
 * la pagina non ha un lettore rotto né un buco nero in attesa.
 *
 * Il giorno in cui arriva il video cambia una riga: `src: "/studio.mp4"`.
 * Quello che conviene che porti con sé il file:
 *
 * - **Senza audio e breve.** Parte da solo, in loop, e un video che parte da
 *   solo con l'audio è un'imboscata. Se dovesse avere audio, smette di partire
 *   da solo e passa ad avere i controlli.
 * - **La proporzione la decide la bozza scelta**, non il contrario: 16:9 per
 *   le orizzontali, 4:5 o 3:4 per la verticale.
 * - **Un fotogramma di copertina vero** (`poster`), che è quello che si vede
 *   mentre carica e quello che resta se il visitatore ha chiesto meno
 *   movimento.
 */
export const studioFilm = {
  src: null as string | null,
  poster: "/retrato.svg",
  /* PLACEHOLDER: il ritratto è un SVG segnaposto, non è lei. */
  alt: "L'illustratrice al lavoro nel suo studio.",
};

/** PLACEHOLDER: la bio è testo segnaposto. */
export const bio = [
  "Illustro da {location}. Ho studiato design e sono passata dai caratteri tipografici ai pennelli senza voltarmi indietro: oggi la maggior parte di quello che faccio comincia sulla carta, con acquerello e matita, e passa al digitale solo quando il lavoro lo chiede.",
  "Mi interessa il dettaglio piccolo —la nervatura di una foglia, il gesto di una mano— e il silenzio intorno. Lavoro meglio quando c'è spazio per provare, così parto quasi sempre da schizzi rapidi prima di impegnarmi in una direzione.",
  "I miei lavori sono apparsi su riviste, in libri illustrati e in collezioni private. Se vuoi vedere il processo più da vicino, lo condivido spesso su Instagram.",
];

/** PLACEHOLDER: i tre servizi sono descrizioni segnaposto. */
export const servicios = [
  {
    title: "Editoriale",
    body: "Illustrazione per articoli, copertine e inserti. Consegno nei formati e nei tempi che chiede la redazione.",
  },
  {
    title: "Libro per l'infanzia",
    body: "Sviluppo dei personaggi, storyboard e arte finale per il libro illustrato, in dialogo con autori ed editori.",
  },
  {
    title: "Serie botaniche",
    body: "Tavole ed erbari su commissione, ad acquerello o matita colorata, con opzione di stampa fine art.",
  },
];
