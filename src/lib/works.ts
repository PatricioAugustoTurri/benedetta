import { query, transaction } from "@/lib/db";

/**
 * Un'immagine di un'opera. È la forma che conserva la colonna `image`, che è
 * un array ordinato: il primo elemento è la copertina, quella che esce nella
 * griglia.
 *
 * `width` e `height` non sono facoltativi e non si scrivono a mano: li
 * restituisce Cloudinary quando riceve il file. Sono quello che serve a
 * `next/image` per riservare lo spazio prima che l'immagine carichi, e una
 * misura inventata fa saltare la pagina nel momento esatto in cui si sta
 * guardando l'opera.
 *
 * `publicId` è il nome che l'immagine ha dentro l'account Cloudinary, ed
 * esiste per una sola ragione: è l'unica cosa che permette di cancellarla da
 * lì quando si cancella l'opera. Senza, ogni opera eliminata lascerebbe le sue
 * immagini a occupare l'account per sempre.
 *
 * È facoltativo perché le immagini che vivevano in `public/` non ce l'hanno:
 * quelle si cancellano dal disco tramite il loro URL. La colonna accetta
 * entrambe le forme.
 *
 * `tipo` c'è solo quando il pezzo è un video MP4: vedi `src/lib/video.ts`.
 * Assente vuol dire immagine.
 */
export type WorkImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
  publicId?: string;
  tipo?: "video";
};

export type Work = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  image: WorkImage[];
  year: number;
  tecnica: string;
};

/**
 * Quello che si può scrivere. `id` non c'è: lo mette il database, e lasciare
 * che lo proponga il modulo è aprire la porta a due opere che si contendono lo
 * stesso numero.
 */
export type WorkInput = Omit<Work, "id">;

/*
  `year` arriva dal database come numero; `id` anche. Il resto è testo o jsonb,
  che il driver consegna già come oggetto. Non serve mappare niente, se non
  assicurarsi che `image` sia un array anche se la riga viene da prima che il
  vincolo esistesse.
*/
function hydrate(row: Record<string, unknown>): Work {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: row.description === null ? null : String(row.description),
    image: Array.isArray(row.image) ? (row.image as WorkImage[]) : [],
    year: Number(row.year),
    tecnica: String(row.tecnica),
  };
}

/**
 * L'archivio intero, nell'ordine che gli ha dato lei.
 *
 * Quell'ordine vive nella colonna `position` e si scrive trascinando in
 * /admin. Prima usciva `ORDER BY year DESC, id DESC`, che è un ordine che
 * nessuno aveva scelto: quale pezzo aprisse il sito lo decideva la data
 * dell'opera, e fra due dello stesso anno, il numero che era toccato loro in
 * tabella. L'anno resta nella scheda; ha smesso di comandare.
 *
 * Lo spareggio per `id` discendente resta anche se `position` è unica, e non è
 * un ornamento: è quello che dà al motore un ordine totale anche se una volta
 * due righe dovessero pareggiare per una scrittura fatta a mano da psql. Una
 * griglia che si riordina da sola fra due caricamenti è un errore che costa
 * ore da trovare.
 */
export async function listWorks(): Promise<Work[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, slug, title, description, image, year, tecnica
       FROM works
      ORDER BY position ASC, id DESC`,
  );
  return rows.map(hydrate);
}

export async function getWork(slug: string): Promise<Work | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, slug, title, description, image, year, tecnica
       FROM works
      WHERE slug = $1`,
    [slug],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function getWorkById(id: number): Promise<Work | null> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, slug, title, description, image, year, tecnica
       FROM works
      WHERE id = $1`,
    [id],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

/** Solo gli slug, per `generateStaticParams`. */
export async function listSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(`SELECT slug FROM works`);
  return rows.map((r) => r.slug);
}

/**
 * L'opera precedente e la successiva dentro l'archivio, per navigare senza
 * tornare indietro. L'ordine deve essere lo stesso di `listWorks` o la
 * paginazione contraddice la griglia da cui si è usciti.
 */
export async function neighbours(slug: string): Promise<{ prev: Work | null; next: Work | null }> {
  const all = await listWorks();
  const i = all.findIndex((w) => w.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? all[i - 1] : null,
    next: i < all.length - 1 ? all[i + 1] : null,
  };
}

/**
 * Un'opera nuova entra per prima nella griglia.
 *
 * `position` non la manda il modulo: la calcola il database prendendo il
 * minimo che già esiste e sottraendogli uno. Lei ha appena caricato quel
 * pezzo, quindi è quello che vuole vedere, e chiederle per giunta di
 * trascinarlo dalla fine fino in cima sarebbe farle pagare un gesto per una
 * cosa che ha già detto caricandolo.
 *
 * Che il numero vada in negativo non conta: `position` è un ordinale, si legge
 * solo in confronto agli altri, e il prossimo riordinamento rinumera tutto da
 * 1 a n. Il COALESCE copre la tabella vuota, dove non c'è un minimo.
 */
export async function createWork(input: WorkInput): Promise<Work> {
  return transaction(async (run) => {
    /*
      Il posto dell'opera nuova si calcola leggendo il minimo che già esiste, e
      fra quella lettura e la scrittura ci sta un altro inserimento: tutti e
      due sceglierebbero lo stesso ordinale e il secondo morirebbe contro
      `works_position_unica`. L'errore che vedrebbe lei sarebbe «Il database ha
      rifiutato l'opera. Controlla i campi.» su campi che sono impeccabili, che
      è un vicolo cieco.

      Il lock lo rende impossibile invece che improbabile. È di tabella e suona
      costoso, ma qui scrive una persona sola da una sola schermata: non c'è
      nessuno da far aspettare. Lascia passare le letture, quindi il sito
      pubblico non se ne accorge.
    */
    await run(`LOCK TABLE works IN SHARE ROW EXCLUSIVE MODE`);

    const rows = await run<Record<string, unknown>>(
      `INSERT INTO works (slug, title, description, image, year, tecnica, position)
            VALUES ($1, $2, $3, $4::jsonb, $5, $6,
                    (SELECT COALESCE(MIN(position), 1) - 1 FROM works))
         RETURNING id, slug, title, description, image, year, tecnica`,
      [
        input.slug,
        input.title,
        input.description,
        JSON.stringify(input.image),
        input.year,
        input.tecnica,
      ],
    );
    return hydrate(rows[0]);
  });
}

export async function updateWork(id: number, input: WorkInput): Promise<Work> {
  const rows = await query<Record<string, unknown>>(
    `UPDATE works
        SET slug = $2, title = $3, description = $4, image = $5::jsonb,
            year = $6, tecnica = $7
      WHERE id = $1
  RETURNING id, slug, title, description, image, year, tecnica`,
    [
      id,
      input.slug,
      input.title,
      input.description,
      JSON.stringify(input.image),
      input.year,
      input.tecnica,
    ],
  );
  return hydrate(rows[0]);
}

/**
 * Restituisce l'opera cancellata invece di niente: chi chiama ha bisogno di
 * sapere quali file immagine sono rimasti senza padrone per poterli pulire.
 */
export async function deleteWork(id: number): Promise<Work | null> {
  const rows = await query<Record<string, unknown>>(
    `DELETE FROM works
       WHERE id = $1
   RETURNING id, slug, title, description, image, year, tecnica`,
    [id],
  );
  return rows[0] ? hydrate(rows[0]) : null;
}

/**
 * Riscrive l'ordine dell'archivio intero: `orden` sono gli id di tutte le
 * opere, dalla prima all'ultima della griglia.
 *
 * **Chiede la lista completa di proposito.** Un riordinamento parziale
 * —«metti queste tre qui»— obbliga a inventare cosa succede alle altre, e ogni
 * risposta possibile lascia buchi o duplicati. Con la lista intera c'è una
 * sola lettura: l'archivio è questo, in quest'ordine.
 *
 * Restituisce `false`, senza scrivere niente, quando quello che arriva non è
 * una permutazione di quello che c'è. Non è paranoia: la schermata costruisce
 * la lista all'apertura, e se nel frattempo si è caricata o cancellata
 * un'opera da un'altra scheda, salvare lascerebbe un pezzo fuori dall'ordine o
 * calpesterebbe un posto. Meglio rifiutarlo e far ricaricare la schermata.
 *
 * Il `WITH ORDINALITY` è quello che ne fa un solo UPDATE: numera l'array così
 * com'è arrivato —il primo id è l'1— e lo unisce alla tabella per id. Senza,
 * bisognerebbe mandare una query per opera.
 */
export async function reorderWorks(orden: number[]): Promise<boolean> {
  return transaction(async (run) => {
    /*
      FOR UPDATE blocca le righe fino al COMMIT. Senza, fra il controllo che la
      lista sia completa e la sua scrittura ci sta qualsiasi altra scrittura, e
      il controllo smette di significare qualcosa.
    */
    const actuales = await run<{ id: number }>(`SELECT id FROM works ORDER BY id FOR UPDATE`);

    const hay = new Set(actuales.map((r) => Number(r.id)));
    const pedidas = new Set(orden);
    if (pedidas.size !== orden.length) return false; // un id ripetuto
    if (pedidas.size !== hay.size) return false;
    if (orden.some((id) => !hay.has(id))) return false;

    await run(
      `UPDATE works AS w
          SET position = nuevo.n
         FROM unnest($1::int[]) WITH ORDINALITY AS nuevo(id, n)
        WHERE w.id = nuevo.id`,
      [orden],
    );

    return true;
  });
}

/** Il database è vivo? La barra dell'admin lo dice in una parola. */
export async function pingDb(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
