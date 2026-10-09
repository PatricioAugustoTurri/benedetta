/**
 * I post di Instagram che si vedono nel footer.
 *
 * **Questi tre sono reali.** Li ha scelti la cliente, uno per uno, e sono le
 * prime illustrazioni sue che entrano nel sito: tutto il resto che si vede in
 * `public/ilustraciones/` resta materiale segnaposto generato per la bozza.
 * Gli `href` puntano ai post veri, non al profilo.
 *
 * ## Perché la lista è scritta a mano e non la porta un'API
 *
 * Meta ha chiuso la Instagram Basic Display API il 4 dicembre 2024, che era
 * quella che serviva gli account personali. Quello che è rimasto richiede un
 * account Professional (Creator o Business) e un token che scade dopo 60
 * giorni e va rinnovato; questo sito è statico e non ha dove conservare un
 * segreto né dove far girare quel rinnovo. La via d'uscita abituale è un feed
 * JSON di terze parti —Behold e simili— che mantiene la connessione e pubblica
 * un array pubblico.
 *
 * È stata scartata su richiesta della cliente, e la decisione è buona finché
 * si tratta di tre pezzi scelti: **questo non è un feed, è una selezione**. Un
 * feed mostra l'ultima cosa caricata; questo mostra quello che lei vuole che
 * si veda. Per cambiarle si cambiano queste tre voci e le tre immagini.
 *
 * ## Le immagini
 *
 * Sono servite da `public/instagram/` e non dal CDN di Instagram, e non è una
 * preferenza: gli URL di `scontent-*.cdninstagram.com` arrivano firmati e con
 * scadenza, quindi un link diretto si rompe da solo nel giro di pochi giorni.
 *
 * Sono i file che ha mandato lei, numerati `1`, `2` e `3`, e il numero è
 * l'ordine in cui li vuole vedere. Hanno sostituito un ritaglio precedente
 * delle stesse tre illustrazioni: questi arrivano con l'inquadratura completa
 * —si vede il piede del mappamondo, la nuvola intera, il gilet a quadri— e
 * alla risoluzione originale, fra 2048 e 2953 px di lato. Tutte e tre quadrate,
 * che è quello che serve alla striscia: si mostrano in un ritaglio 1:1 e
 * nessuna perde niente.
 *
 * **Pesano molto più di quello che si scarica.** Fra tutte e tre fanno circa
 * 4,5 MB nel repository, ma il visitatore non li riceve: `next/image` le serve
 * ridimensionate alla misura della striscia —circa 200 px— e nel formato che
 * accetta il suo browser. Il costo è di disco e di build, non di caricamento.
 */
export type Post = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  href: string;
};

const PROFILE = "https://www.instagram.com/benedetta.zibetti/";

export const profileUrl = PROFILE;
export const handle = "@benedetta.zibetti";

/*
  Gli `alt` li ho scritti guardando ogni immagine, in italiano come il resto
  del footer. Descrivono quello che si vede e nient'altro: non inventano
  titolo, né committente, né data. Se lei mette loro un testo alternativo
  suo su Instagram, vince quello e questi si sostituiscono.
*/
export const posts: Post[] = [
  {
    id: "C7g1uUIs3ab",
    src: "/instagram/1.jpg",
    width: 2126,
    height: 2126,
    alt: "Una donna seduta su un mappamondo di legno, con gli occhi chiusi, in un cielo viola punteggiato di stelle.",
    href: "https://www.instagram.com/p/C7g1uUIs3ab/",
  },
  {
    id: "Cqa5QjTuWXc",
    src: "/instagram/2.jpg",
    width: 2953,
    height: 2953,
    alt: "Una ragazza con ali da libellula seduta su una nuvola, con un fiorellino fra i capelli.",
    href: "https://www.instagram.com/p/Cqa5QjTuWXc/",
  },
  {
    id: "ClTZU26NRSh",
    src: "/instagram/3.jpg",
    width: 2048,
    height: 2048,
    alt: "Una ragazza dai capelli lunghi che tiene una stella luminosa sul palmo della mano, su fondo bruno.",
    href: "https://www.instagram.com/p/ClTZU26NRSh/",
  },
];
