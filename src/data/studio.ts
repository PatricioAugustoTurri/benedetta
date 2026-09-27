/**
 * Quello che dice la pagina About.
 *
 * Il testo vive qui e non dentro il componente perché lo legge la pagina vera
 * e anche le anteprime di composizione: se fosse scritto in una delle due,
 * confrontare due bozze significherebbe confrontare due testi diversi.
 */

/**
 * Il video che apre la pagina, come fondo del frontespizio: proporzione
 * 16:9 —quella del file, 1920 × 1080—.
 *
 * È un montaggio di dodici secondi girato all'aperto, in campagna: lei in
 * piedi sotto un albero in un campo arato, su un ponticello sopra un canale,
 * con le braccia alzate in mezzo all'erba alta, al volano di una chiusa, e
 * alla fine i suoi piedi in calzini contro il cielo. Si guarda come
 * un'immagine che si muove: senza audio, in loop, e parte da solo. Il file ha
 * una traccia audio, ma la pagina la tiene muta: un video che parte da solo
 * con l'audio è un'imboscata.
 *
 * Il `poster` è il primo fotogramma del video, estratto a 1600px: quello che
 * si vede mentre il file carica, e quello che resta a chi ha chiesto meno
 * movimento. Essendo il primo, il passaggio al video non salta.
 *
 * Il file è rimontato con l'indice (`moov`) in testa, senza ricodificarlo: così
 * il browser comincia a riprodurlo mentre scarica, invece di aspettare la
 * fine dei 14 MB. Vive nella radice di `public/` perché è lì che l'ha messo
 * lei; gli spazi nel nome vanno codificati nell'indirizzo.
 */
export const studioFilm = {
  src: "/Bebi%20about%202.mp4" as string | null,
  poster: "/Bebi%20about%202.jpg",
  width: 1920,
  height: 1080,
  alt: "Benedetta in campagna: sotto un albero in un campo arato, su un ponticello sopra un canale, con le braccia alzate nell'erba alta, al volano di una chiusa, e i suoi piedi in calzini contro il cielo.",
};

/**
 * La bio, scritta da lei. Il saluto —«Ciao, sono Benedetta.»— non sta qui:
 * è il titolo della pagina e lo compone `StudioIntro` col nome di `site`.
 *
 * Le righe che ha mandato sono raccolte in paragrafi per argomento —chi è,
 * il viaggio, cosa fa e come, com'è—, senza toccare una parola.
 */
export const bio = [
  "Sono un'illustratrice freelance. Disegno da sempre e, dopo aver studiato Illustrazione e Fumetto al NID di Perugia, ho trasformato questa passione nel mio lavoro.",
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
 * Le cose che fa, e le opere che le mostrano.
 *
 * Le prime due vengono dalla bio: «Realizzo principalmente illustrazioni
 * personalizzate e ritratti». La terza viene dall'archivio: due lavori su
 * commissione —le etichette di vino e il canovaccio per Tessuto Artistico
 * Umbro— e un progetto personale sul packaging. Le tecniche non diventano un
 * servizio, perché nella bio sono sperimentazione e non una promessa di
 * consegna; editoria ed eventi nemmeno, finché nell'archivio sono solo
 * progetti personali.
 *
 * `opere` sono slug di `works`: la pagina li risolve contro la tabella, prende
 * il titolo da lì e li mette nell'ordine della griglia. Uno slug che non
 * esiste più —un'opera cancellata o rinominata in /admin— sparisce in
 * silenzio invece di diventare un link rotto.
 *
 * DA CONFERMARE CON LEI: i titoli delle prime due sono suoi, i tre testi sono
 * scritti a partire dalla bio e dalle schede delle opere e non aggiungono
 * niente che lei non abbia detto.
 */
export const servicios = [
  {
    title: "Illustrazioni personalizzate",
    body: "Parto da un ricordo, un luogo o una storia che mi racconti, e lo trasformo in un'immagine.",
    opere: ["coordinati-per-matrimoni"],
  },
  {
    title: "Ritratti",
    body: "Un volto e la sua storia: ritratti che nascono da quello che mi racconti.",
    opere: ["ritratti-illustrati"],
  },
  {
    title: "Prodotti e packaging",
    body: "Etichette, confezioni, tessuti: illustrazioni pensate per vivere fuori dalla carta, nate dal dialogo con chi produce.",
    opere: ["etichette-vino", "canovaccio-illustrato", "illustrazione-per-prodotti-e-packaging"],
  },
];
