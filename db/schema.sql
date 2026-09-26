-- illustrando · schema
--
-- Database: illustrando (PostgreSQL 17)
-- Eseguire con:  psql -d illustrando -f db/schema.sql
--
-- Questo file è la fonte di verità della struttura. Se cambia una colonna,
-- cambia prima qui e poi nel database: al contrario, la prossima macchina che
-- avvia il progetto parte con uno schema che non è quello in uso.

BEGIN;

-- --------------------------------------------------------------------------
-- works — l'archivio d'opera
--
-- Una riga per pezzo, e l'unica fonte: il sito legge da qui. Ha sostituito
-- src/data/illustrations.ts, che è stato eliminato. Chi scrive è /admin.
-- --------------------------------------------------------------------------
CREATE TABLE works (
  id          integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- L'identificatore del link permanente: /opera/<slug>. Va UNIQUE perché un
  -- URL già condiviso non può cominciare a puntare a un'altra opera. Il CHECK
  -- lo mantiene adatto a un URL: minuscole, numeri e trattini, nient'altro.
  slug        text        NOT NULL UNIQUE
              CONSTRAINT works_slug_formato CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  title       text        NOT NULL
              CONSTRAINT works_title_no_vacio CHECK (length(trim(title)) > 0),

  -- Il contesto della commissione, per la pagina dell'opera. Può mancare: un
  -- pezzo può entrare nell'archivio prima che il suo testo sia scritto.
  description text,

  -- Le immagini dell'opera, in ordine: la prima è la copertina, quella che
  -- esce nella griglia dell'archivio. È un array e non una colonna singola
  -- perché ogni pezzo ha più di uno scatto —il fronte, un dettaglio, il foglio
  -- sul tavolo— e quel numero cambia da opera a opera.
  --
  -- jsonb e non text[] perché ogni immagine non è solo un indirizzo: Next.js
  -- ha bisogno delle misure reali del file per riservare lo spazio prima del
  -- caricamento, e l'alt è un obbligo di accessibilità, non un extra. Un
  -- array di URL sciolti obbligherebbe a conservare tutto questo altrove.
  --
  -- Segue la convenzione che già usavano products.image e categories.portada
  -- in questo stesso database.
  --
  -- Forma di ogni elemento:
  --   { "url": "/ilustraciones/01-a.jpg",   -- obbligatoria
  --     "alt": "Ramo con foglie sotto un cerchio",
  --     "width": 900,
  --     "height": 1200 }
  --
  -- Un elemento può essere un video MP4 invece di un'immagine: porta in più
  -- "tipo": "video", e l'URL è quello di Cloudinary sotto /video/upload/.
  -- Senza "tipo" è un'immagine, quindi le righe salvate prima dei video
  -- restano valide così come sono e non serve nessuna migrazione.
  image       jsonb       NOT NULL DEFAULT '[]'::jsonb
              -- Due regole, ed entrambe riguardano la forma e non il
              -- contenuto: che sia un array, e che nessun elemento arrivi
              -- senza url. Va con jsonpath perché un CHECK non ammette
              -- sottoquery, quindi non si può percorrere l'array con un
              -- SELECT.
              --
              -- La seconda conta invece di cercare quello sbagliato: un filtro
              -- `? (@.url.type() != "string")` non prende l'elemento che non
              -- ha `url` —se la chiave non c'è, non c'è niente da confrontare e
              -- il filtro non lo vede passare—. Contando quelli che ce l'hanno
              -- ed esigendo che siano tutti, anche quello mancante cade lo
              -- stesso.
              --
              -- Il CASE non è un ornamento: Postgres non garantisce l'ordine
              -- in cui valuta un AND, e jsonb_array_length su qualcosa che non
              -- è un array non restituisce falso, esplode. Il CASE garantisce
              -- invece che si guardi prima il tipo.
              CONSTRAINT works_image_es_arreglo CHECK (jsonb_typeof(image) = 'array')
              CONSTRAINT works_image_con_url CHECK (
                CASE WHEN jsonb_typeof(image) = 'array' THEN
                  jsonb_array_length(
                    jsonb_path_query_array(image, '$[*] ? (@.url.type() == "string")')
                  ) = jsonb_array_length(image)
                ELSE true END
              ),

  -- L'anno dell'opera. È un dato della scheda, non l'ordine dell'archivio: si
  -- mostra accanto al titolo e non decide niente. smallint basta e avanza.
  -- Il limite inferiore è arbitrario ma intercetta l'errore reale: un anno di
  -- due cifre o un refuso di quattro cifre che comincia con 1.
  year        smallint    NOT NULL
              CONSTRAINT works_year_plausible CHECK (year BETWEEN 1900 AND 2200),

  -- Il posto del pezzo nella griglia, che lo decide lei trascinando in /admin.
  -- È l'unica colonna che esiste per una decisione di curatela e non per un
  -- dato dell'opera.
  --
  -- Esiste perché l'ordine precedente —anno decrescente, e a parità di anno
  -- l'id più alto per primo— non l'aveva scelto nessuno: quale pezzo aprisse
  -- il sito era lasciato alla data dell'opera e al numero che le era toccato
  -- in tabella.
  --
  -- È un ordinale, non un indice: si legge solo in confronto agli altri, e non
  -- deve per forza essere contiguo né cominciare da 1. Un'opera nuova entra
  -- con il minimo meno uno, così l'ultima caricata apre la griglia;
  -- riordinare rinumera tutto da 1 a n.
  position    integer     NOT NULL,

  -- Acquerello, gouache, matita, serigrafia, inchiostro e digitale… Testo
  -- libero di proposito: è la scheda di un pezzo fatto a mano, e rinchiuderlo
  -- in una lista fissa obbligherebbe a migrare la tabella ogni volta che lei
  -- prova qualcosa di nuovo.
  tecnica     text        NOT NULL
              CONSTRAINT works_tecnica_no_vacia CHECK (length(trim(tecnica)) > 0),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Due opere non possono reclamare lo stesso posto: se succede, la griglia si
-- riordina da sola fra due caricamenti e non c'è modo di accorgersene
-- guardando.
--
-- DEFERRABLE INITIALLY DEFERRED perché riordinare è, per definizione, passare
-- per stati in cui due righe si calpestano: spostare la quinta al primo posto
-- fa scorrere quattro opere di una casella, e in mezzo a quell'UPDATE ci sono
-- duplicati. Si verifica alla chiusura della transazione, quando l'ordine è
-- ormai un ordine.
--
-- Il vincolo lascia il proprio indice su `position`, che è l'unico ordine in
-- cui si percorre l'archivio, quindi non serve crearne nessun altro. Non c'è
-- un indice su `year`: nessuna query ordina né filtra per quello.
ALTER TABLE works
  ADD CONSTRAINT works_position_unica UNIQUE (position) DEFERRABLE INITIALLY DEFERRED;

-- --------------------------------------------------------------------------
-- updated_at si mantiene da solo.
--
-- Nel trigger e non nell'applicazione: se la data dipendesse dal fatto che chi
-- scrive si ricordi di metterla, il giorno in cui qualcuno corregge un titolo
-- con un UPDATE a mano da psql la colonna mentirebbe, che è peggio che non
-- averla.
-- --------------------------------------------------------------------------
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER works_set_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
