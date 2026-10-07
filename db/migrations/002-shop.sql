-- 002 · Il negozio: prodotti e ordini
--
-- Eseguire una sola volta su un database che esiste già:
--   psql -d illustrando -f db/migrations/002-shop.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già le due tabelle.

BEGIN;

-- --------------------------------------------------------------------------
-- prodotti — quello che c'è nello Shop
--
-- Una tabella sola per le tre categorie, e non una per tipo. Quello che hanno
-- in comune —titolo, testo, immagini, ordine— è quasi tutto, e quello che le
-- separa è una cosa sola: una stampa ha formati con un prezzo, un lavoro su
-- commissione no. Quella differenza la tiene un CHECK, non una seconda tabella.
-- --------------------------------------------------------------------------
CREATE TABLE prodotti (
  id          integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Le tre categorie di src/data/shop.ts. Testo con CHECK e non un ENUM:
  -- aggiungere un valore a un ENUM non si disfa, e una lista che lei può
  -- ancora cambiare deve potersi cambiare in tutte e due le direzioni.
  categoria   text        NOT NULL
              CONSTRAINT prodotti_categoria_valida CHECK (
                categoria IN ('illustrazioni-personalizzate', 'ritratti-illustrati', 'stampe')
              ),

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

  -- Bozza o pubblicato. Parte da bozza: si carica con calma e si mostra
  -- quando è pronto, invece di caricare di notte per non farsi vedere a metà.
  pubblicato  boolean     NOT NULL DEFAULT false,

  -- Il posto dentro la sua categoria. Stesso ragionamento di works.position.
  position    integer     NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- La regola che separa le due famiglie, scritta dove nessuno la può
  -- saltare: una stampa senza formati non si può comprare, e un ritratto con
  -- un prezzo prometterebbe una cifra che lei non ha mai dato. Vale anche per
  -- chi scrive a mano da psql.
  CONSTRAINT prodotti_formati_solo_stampe CHECK (
    CASE WHEN jsonb_typeof(formati) = 'array' THEN
      (categoria = 'stampe') = (jsonb_array_length(formati) > 0)
    ELSE true END
  ),

  -- Solo una stampa esce da un'opera.
  CONSTRAINT prodotti_opera_solo_stampe CHECK (opera_slug IS NULL OR categoria = 'stampe')
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

COMMIT;
