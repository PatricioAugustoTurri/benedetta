/**
 * Icone disegnate, un solo spessore di tratto (1.25) e una sola misura base.
 * Non usiamo glifi unicode come icone: non condividono né metrica né peso con
 * il carattere e cambiano forma a seconda del sistema operativo.
 */
type Props = {
  className?: string;
  /** Lato del riquadro in px. Il tratto resta ottico. */
  size?: number;
};

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export function ArrowLeft({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function ArrowRight({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

/** Freccia diagonale per i link che escono dal sito. */
export function ArrowUpRight({ className, size = 16 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function Mail({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

export function Instagram({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Close({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/**
 * Copiare: due fogli sfalsati. Si disegna perché l'azione non è "mandare una
 * mail" e usare la busta per tutte e due le cose farebbe sì che la busta non
 * significhi nessuna delle due.
 */
export function Copy({ className, size = 18 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="1" />
      <path d="M15 6.5V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h1.5" />
    </svg>
  );
}

/**
 * Tornare in cima. Ha l'asta, come la freccia diagonale dei link esterni e a
 * differenza di quelle della paginazione, che sono punte sole: questa non dice
 * "successiva", dice "fino all'inizio", e quella distanza è l'asta.
 */
export function ArrowUp({ className, size = 16 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 19V5m-7 7 7-7 7 7" />
    </svg>
  );
}

/*
  Le tre dell'admin. Entrano qui e non in una cartella a parte perché un
  secondo gruppo di icone con un altro tratto è esattamente quello che questo
  file esiste per evitare: la schermata di caricamento deve sembrare fatta
  dalla stessa mano del sito.
*/

/**
 * Aggiungere. Due tratti della stessa lunghezza, senza riquadro intorno: il
 * riquadro lo mette già la casella tratteggiata della griglia, e ripeterlo
 * dentro sarebbe disegnare due volte la stessa idea.
 */
export function Plus({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * Modificare: la matita, che è il suo strumento. Va inclinata a 45° come le
 * frecce diagonali del sistema, e con la punta segnata a parte perché a 16px
 * si legga ancora come una matita e non come una sbarra storta.
 */
export function Pencil({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14.5 5.5 18.5 9.5 9 19H5v-4z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

/**
 * Cancellare. Il cestino e non una croce: una croce in questo sistema chiude
 * —è il pulsante del pannello del menu— e lo stesso segno per chiudere e per
 * distruggere è quello che fa cancellare un'opera a qualcuno che credeva di
 * chiudere qualcosa.
 */
export function Trash({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.5A1 1 0 0 1 10.5 4.5h3a1 1 0 0 1 1 1V7" />
      <path d="M6.5 7l.8 11a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </svg>
  );
}

/**
 * Spostare: la maniglia con cui si trascina un'opera in un altro punto della
 * griglia.
 *
 * Quattro frecce da un centro, e non le tre righe di una maniglia da lista,
 * per due ragioni. La prima è che quelle tre righe sono già il pulsante del
 * menu sul telefono, e lo stesso disegno per aprire la navigazione e per
 * afferrare un pezzo è quello che fa toccare l'uno a chi credeva di toccare
 * l'altro. La seconda è che la griglia è una griglia: un pezzo si muove su due
 * assi, non su e giù in una lista, e l'icona lo deve dire prima che la mano lo
 * provi.
 *
 * Le punte vanno in tratti separati dalla croce perché a 16px, che è dove
 * vive, continuino a leggersi come frecce e non come un ispessimento
 * dell'estremità.
 *
 * La croce non arriva al bordo del riquadro: ridotta a 13 unità sulle 24, il
 * disegno occupa quanto la matita e il cestino accanto. Stirata fino al bordo
 * pesava più dei due vicini e il gruppo smetteva di leggersi come tre
 * controlli dello stesso rango.
 */
export function Move({ className, size = 20 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5.5v13M5.5 12h13" />
      <path d="m10 7.5 2-2 2 2" />
      <path d="m10 16.5 2 2 2-2" />
      <path d="M7.5 10l-2 2 2 2" />
      <path d="m16.5 10 2 2-2 2" />
    </svg>
  );
}
