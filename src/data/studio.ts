/**
 * Quello che dice la pagina About.
 *
 * Il testo vive qui e non dentro il componente perché lo legge la pagina vera
 * e anche le anteprime di composizione: se fosse scritto in una delle due,
 * confrontare due bozze significherebbe confrontare due testi diversi.
 */

/**
 * Il video che apre la pagina, come tavola sul foglio: stessi margini di
 * un'opera dell'archivio, proporzione 16:9 —quella del file, 1920 × 1080—.
 *
 * È un montaggio di otto secondi e mezzo del suo lavoro: lei che disegna sul
 * tablet in poltrona, un cielo con un albero, le mani che rifilano una stampa
 * alla taglierina. Si guarda come un'immagine che si muove: senza audio, in
 * loop, e parte da solo. Il file ha una traccia audio, ma la pagina la tiene
 * muta: un video che parte da solo con l'audio è un'imboscata.
 *
 * Il `poster` è il primo fotogramma del video, estratto a 1600px: quello che
 * si vede mentre il file carica, e quello che resta a chi ha chiesto meno
 * movimento. Essendo il primo, il passaggio al video non salta.
 *
 * Vive in `public/instagram/` perché è lì che l'ha messo lei. Lo spazio nel
 * nome va codificato nell'indirizzo.
 */
export const studioFilm = {
  src: "/instagram/Bebi%20About.mp4" as string | null,
  poster: "/instagram/Bebi%20About.jpg",
  width: 1920,
  height: 1080,
  alt: "Benedetta disegna sul tablet in poltrona, un cielo con un albero, poi le sue mani rifilano una stampa alla taglierina.",
};

/**
 * La bio, scritta da lei. Il saluto —«Ciao, sono Benedetta.»— non sta qui:
 * è il titolo della pagina e lo compone `StudioIntro` col nome di `site`.
 *
 * Le righe che ha mandato sono raccolte in paragrafi per argomento —chi è,
 * il viaggio, cosa fa e come, com'è—, senza toccare una parola.
 */
export const bio = [
  "Sono un'illustratrice e Illustrando è il nome con cui condivido il mio lavoro. Disegno da sempre e, dopo aver studiato Illustrazione e Fumetto al NID di Perugia, ho trasformato questa passione nel mio lavoro.",
  "Per tre anni ho viaggiato per il mondo, riempiendo i miei quaderni di luoghi, persone e piccoli momenti. Dal 2024 vivo di nuovo stabilmente in Italia e oggi trovo la mia ispirazione soprattutto nelle cose semplici: la quotidianità, la natura, il cibo, le tradizioni e le storie delle persone.",
  "Realizzo principalmente illustrazioni personalizzate e ritratti, trasformando ricordi e racconti in immagini. Lavoro soprattutto in digitale, ma amo sperimentare con acrilici, pastelli, legno e tecniche diverse. Mi piace sporcarmi le mani, provare cose nuove e, soprattutto, raccontare storie attraverso quello che disegno.",
  "Sono curiosa, spontanea e sempre alla ricerca di nuovi progetti e nuovi modi per usare l'illustrazione.",
];

/**
 * L'ultima riga della bio. Va a parte perché è l'unica che si rivolge a chi
 * legge, e la pagina la compone in inchiostro pieno come chiusura.
 */
export const bioChiusura = "Se hai una storia da raccontare, magari possiamo disegnarla insieme.";

/**
 * Le due cose che dice di fare nella bio: «Realizzo principalmente
 * illustrazioni personalizzate e ritratti». Sono due e non tre perché lei ne
 * nomina due; le tecniche non diventano un servizio, perché nella bio sono
 * sperimentazione e non una promessa di consegna.
 *
 * DA CONFERMARE CON LEI: i titoli sono suoi, i due testi sono scritti a
 * partire dalla bio e non aggiungono niente che lei non abbia detto.
 */
export const servicios = [
  {
    title: "Illustrazioni personalizzate",
    body: "Parto da un ricordo, un luogo o una storia che mi racconti, e lo trasformo in un'immagine.",
  },
  {
    title: "Ritratti",
    body: "Un volto e la sua storia: ritratti che nascono da quello che mi racconti.",
  },
];
