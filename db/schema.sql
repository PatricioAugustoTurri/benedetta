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

-- --------------------------------------------------------------------------
-- prodotti — le stampe dello Shop
--
-- Una riga per stampa, e si aggiungono di continuo. Ritratti e illustrazioni
-- su commissione non stanno qui: sono due servizi fissi, in `servizi`.
-- --------------------------------------------------------------------------
CREATE TABLE prodotti (
  id          integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Sempre 'stampe'. La colonna resta perché è nell'indirizzo
  -- (/shop/stampe/<slug>) e nell'ordine; ritratti e illustrazioni non sono
  -- prodotti ma servizi, e vivono in `servizi` (vedi sotto).
  categoria   text        NOT NULL DEFAULT 'stampe'
              CONSTRAINT prodotti_categoria_valida CHECK (categoria = 'stampe'),

  -- /shop/<categoria>/<slug>. Unico in tutto il negozio e non per categoria:
  -- è anche quello che viaggia in /contatti?prodotto=<slug>, e lì la
  -- categoria non c'è.
  slug        text        NOT NULL UNIQUE
              CONSTRAINT prodotti_slug_formato CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  title       text        NOT NULL
              CONSTRAINT prodotti_title_no_vacio CHECK (length(trim(title)) > 0),

  description text,

  -- La stessa forma di works.image, con le stesse due regole: è un array, e
  -- nessun elemento senza url. Così l'admin carica le immagini con lo stesso
  -- codice delle opere.
  image       jsonb       NOT NULL DEFAULT '[]'::jsonb
              CONSTRAINT prodotti_image_es_arreglo CHECK (jsonb_typeof(image) = 'array')
              CONSTRAINT prodotti_image_con_url CHECK (
                CASE WHEN jsonb_typeof(image) = 'array' THEN
                  jsonb_array_length(
                    jsonb_path_query_array(image, '$[*] ? (@.url.type() == "string")')
                  ) = jsonb_array_length(image)
                ELSE true END
              ),

  -- I formati in vendita, in ordine: [{ "formato": "A4", "prezzo": 1500 }].
  --
  -- Il prezzo è in centesimi e intero. Mai decimale: 0,1 + 0,2 non fa 0,3 in
  -- virgola mobile, e un totale di carrello sbagliato di un centesimo è un
  -- totale sbagliato.
  --
  -- jsonb dentro la riga e non una tabella a parte perché un formato non
  -- esiste da solo: non si cerca, non si ordina, non si collega a niente.
  -- Viaggia sempre con la sua stampa.
  formati     jsonb       NOT NULL DEFAULT '[]'::jsonb
              CONSTRAINT prodotti_formati_es_arreglo CHECK (jsonb_typeof(formati) = 'array')
              -- Ogni formato ha un nome e un prezzo intero positivo. Si contano
              -- quelli buoni e si esige che siano tutti, per la stessa ragione
              -- di works.image: un filtro sui cattivi non vede la chiave che
              -- manca.
              CONSTRAINT prodotti_formati_validi CHECK (
                CASE WHEN jsonb_typeof(formati) = 'array' THEN
                  jsonb_array_length(
                    jsonb_path_query_array(
                      formati,
                      '$[*] ? (@.formato.type() == "string" && @.prezzo.type() == "number" && @.prezzo > 0 && @.prezzo == @.prezzo.floor())'
                    )
                  ) = jsonb_array_length(formati)
                ELSE true END
              ),

  -- Da quale opera dell'archivio esce la stampa, se esce da una. La pagina
  -- dell'opera allora dice «Disponibile come stampa», e la stampa rimanda
  -- all'originale. ON UPDATE CASCADE perché lei può rinominare l'opera; ON
  -- DELETE SET NULL perché cancellare un'opera non deve cancellare la stampa.
  opera_slug  text        REFERENCES works (slug) ON UPDATE CASCADE ON DELETE SET NULL,

  -- La stampa appesa in una stanza: nella griglia dello Shop prende il posto
  -- della copertina quando il mouse si ferma sopra per un secondo. Uno solo,
  -- con la forma di un elemento di `image`, o niente. Vedi la migrazione 004.
  mockup      jsonb
              CONSTRAINT prodotti_mockup_con_url CHECK (
                mockup IS NULL
                OR (jsonb_typeof(mockup) = 'object' AND jsonb_typeof(mockup -> 'url') = 'string')
              ),

  -- Bozza o pubblicato. Parte da bozza: si carica con calma e si mostra
  -- quando è pronto, invece di caricare di notte per non farsi vedere a metà.
  pubblicato  boolean     NOT NULL DEFAULT false,

  -- Il posto dentro la sua categoria. Stesso ragionamento di works.position.
  position    integer     NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- Una stampa senza formati non si può comprare.
  CONSTRAINT prodotti_formati_presenti CHECK (
    CASE WHEN jsonb_typeof(formati) = 'array' THEN jsonb_array_length(formati) > 0 ELSE true END
  )
);

-- Due prodotti della stessa categoria non si contendono lo stesso posto.
-- Differito, come in works, perché riordinare passa per stati in cui due righe
-- si calpestano.
ALTER TABLE prodotti
  ADD CONSTRAINT prodotti_position_unica UNIQUE (categoria, position) DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER prodotti_set_updated_at
  BEFORE UPDATE ON prodotti
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- servizi — i due lavori su commissione
--
-- Due righe e mai di più né di meno. La chiave è lo slug, e il CHECK ammette
-- solo i due: non c'è un INSERT da fare dall'admin, né un DELETE. L'admin le
-- modifica e basta.
-- --------------------------------------------------------------------------
CREATE TABLE servizi (
  slug        text        PRIMARY KEY
              CONSTRAINT servizi_slug_valido CHECK (
                slug IN ('illustrazioni-personalizzate', 'ritratti-illustrati')
              ),

  title       text        NOT NULL
              CONSTRAINT servizi_title_no_vacio CHECK (length(trim(title)) > 0),

  -- Di cosa si tratta e come funziona: quello che si legge prima di scriverle.
  description text,

  -- La stessa forma di works.image e prodotti.image, con le stesse regole.
  image       jsonb       NOT NULL DEFAULT '[]'::jsonb
              CONSTRAINT servizi_image_es_arreglo CHECK (jsonb_typeof(image) = 'array')
              CONSTRAINT servizi_image_con_url CHECK (
                CASE WHEN jsonb_typeof(image) = 'array' THEN
                  jsonb_array_length(
                    jsonb_path_query_array(image, '$[*] ? (@.url.type() == "string")')
                  ) = jsonb_array_length(image)
                ELSE true END
              ),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER servizi_set_updated_at
  BEFORE UPDATE ON servizi
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Le due righe esistono da subito, col solo nome: il testo e le immagini li
-- mette lei da /admin/shop.
INSERT INTO servizi (slug, title) VALUES
  ('illustrazioni-personalizzate', 'Illustrazioni Personalizzate'),
  ('ritratti-illustrati', 'Ritratti Illustrati');

-- --------------------------------------------------------------------------
-- copertine — l'immagine di ogni categoria nella pagina /shop
--
-- Una riga per categoria che ne ha una; senza copertina la riga non c'è e la
-- pagina usa la prima immagine del servizio o della prima stampa. Vedi la
-- migrazione 005.
-- --------------------------------------------------------------------------
CREATE TABLE copertine (
  categoria   text        PRIMARY KEY
              CONSTRAINT copertine_categoria_valida CHECK (
                categoria IN ('illustrazioni-personalizzate', 'ritratti-illustrati', 'stampe')
              ),

  -- Un elemento come quelli di works.image.
  immagine    jsonb       NOT NULL
              CONSTRAINT copertine_immagine_con_url CHECK (
                jsonb_typeof(immagine) = 'object' AND jsonb_typeof(immagine -> 'url') = 'string'
              ),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER copertine_set_updated_at
  BEFORE UPDATE ON copertine
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- ordini — quello che è stato pagato
--
-- Una riga per pagamento riuscito, e la scrive solo il webhook di Stripe:
-- nessuno la crea dal sito. Il carrello non c'è qui: vive nel browser di chi
-- compra finché non paga.
-- --------------------------------------------------------------------------
CREATE TABLE ordini (
  id                integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- La sessione di Checkout da cui viene. UNIQUE perché Stripe può mandare lo
  -- stesso evento più di una volta, e un ordine ripetuto si spedirebbe due
  -- volte.
  stripe_session_id text        NOT NULL UNIQUE,

  nome              text,
  email             text        NOT NULL,

  -- L'indirizzo di spedizione così come l'ha scritto chi compra:
  -- { "line1", "line2", "city", "postal_code", "state", "country" }.
  indirizzo         jsonb       NOT NULL,

  -- Una fotografia di quello che si è comprato, non un riferimento:
  -- [{ "slug", "title", "formato", "prezzo", "quantita" }]. Se domani lei
  -- cambia il prezzo o il titolo di una stampa, l'ordine di ieri deve dire
  -- ancora quello che è stato pagato.
  righe             jsonb       NOT NULL
                    CONSTRAINT ordini_righe_es_arreglo CHECK (jsonb_typeof(righe) = 'array'),

  -- In centesimi, come i prezzi.
  subtotale         integer     NOT NULL CHECK (subtotale >= 0),
  spedizione        integer     NOT NULL CHECK (spedizione >= 0),
  totale            integer     NOT NULL CHECK (totale >= 0),

  -- Pagato quando arriva, spedito quando lei lo segna.
  stato             text        NOT NULL DEFAULT 'pagato'
                    CONSTRAINT ordini_stato_valido CHECK (stato IN ('pagato', 'spedito')),

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- L'elenco dell'admin va dal più recente.
CREATE INDEX ordini_created_at ON ordini (created_at DESC);

CREATE TRIGGER ordini_set_updated_at
  BEFORE UPDATE ON ordini
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- iscritti — chi riceve la newsletter
--
-- Tre stati, letti dalle date: in attesa (confermato_at nullo), iscritto
-- (confermato e non disiscritto), disiscritto. Chi si disiscrive resta nella
-- tabella con la data: è la prova che non gli si deve più scrivere.
-- --------------------------------------------------------------------------
CREATE TABLE iscritti (
  id                  integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Sempre in minuscolo, così «Ana@x.it» e «ana@x.it» sono la stessa persona.
  email               text        NOT NULL UNIQUE
                      CONSTRAINT iscritti_email_formato CHECK (
                        email = lower(email) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
                      ),

  -- Il segreto dei link di conferma e di disiscrizione. Non si indovina e
  -- non dice niente di chi è.
  token               text        NOT NULL UNIQUE,

  confermato_at       timestamptz,
  disiscritto_at      timestamptz,

  -- Quando è partita l'ultima mail di conferma: non se ne manda un'altra
  -- prima di dieci minuti, anche se qualcuno insiste sul modulo.
  conferma_inviata_at timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER iscritti_set_updated_at
  BEFORE UPDATE ON iscritti
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- annunciato_at — se una cosa è già stata detta agli iscritti
--
-- Nullo vuol dire «da annunciare». Vedi la migrazione 006.
-- --------------------------------------------------------------------------
ALTER TABLE works    ADD COLUMN annunciato_at timestamptz;
ALTER TABLE prodotti ADD COLUMN annunciato_at timestamptz;

-- --------------------------------------------------------------------------
-- invii — le newsletter mandate
--
-- Una riga per invio, con una fotografia di cosa conteneva: se domani
-- un'opera cambia titolo, l'invio di ieri dice ancora cosa è partito.
-- --------------------------------------------------------------------------
CREATE TABLE invii (
  id           integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  oggetto      text        NOT NULL,
  testo        text,
  -- [{ "tipo": "opera" | "stampa", "id", "title", "url" }]
  contenuto    jsonb       NOT NULL CONSTRAINT invii_contenuto_es_arreglo CHECK (jsonb_typeof(contenuto) = 'array'),
  destinatari  integer     NOT NULL DEFAULT 0,
  consegnati   integer     NOT NULL DEFAULT 0,
  stato        text        NOT NULL DEFAULT 'in corso'
               CONSTRAINT invii_stato_valido CHECK (stato IN ('in corso', 'inviato', 'errore')),
  created_at   timestamptz NOT NULL DEFAULT now()
);


COMMIT;
