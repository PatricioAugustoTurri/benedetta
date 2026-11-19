-- 018 · Il registro delle vendite e le spese
--
-- Eseguire una sola volta su un database che ha già la 017:
--   psql -d illustrando -f db/migrations/018-vendite-spese.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- I conti della 017 erano solo importi. Lei vuole sapere di ogni vendita a
-- chi, cosa, se ha pagato e se è arrivata (cliente, 2026-11-19): le vendite
-- fuori dal sito diventano un registro con il cliente e lo stato, e le spese
-- restano due cose, in cosa e quanto. Le vendite del sito continuano a
-- venire da `ordini`.
--
-- `movimenti` si butta: in produzione era vuota (controllato il 2026-11-19).

BEGIN;

DROP TABLE movimenti;

CREATE TABLE vendite (
  id          integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Il numero dell'anno: V-2026-014. Non è l'id perché ricomincia a gennaio,
  -- e non si ricalcola perché cancellare una vendita non deve rinumerare le
  -- altre.
  anno        smallint    NOT NULL,
  numero      integer     NOT NULL,
  giorno      date        NOT NULL,
  nome        text        NOT NULL CONSTRAINT vendite_nome_misura CHECK (length(trim(nome)) BETWEEN 1 AND 120),
  email       text        CONSTRAINT vendite_email_misura CHECK (email IS NULL OR length(email) <= 200),
  telefono    text        CONSTRAINT vendite_telefono_misura CHECK (telefono IS NULL OR length(telefono) <= 40),
  cosa        text        NOT NULL CONSTRAINT vendite_cosa_misura CHECK (length(trim(cosa)) BETWEEN 1 AND 500),
  importo     integer     NOT NULL CONSTRAINT vendite_importo_positivo CHECK (importo > 0),
  canale      text        NOT NULL CONSTRAINT vendite_canale_valido CHECK (canale IN ('contanti', 'bonifico')),
  -- Il giorno in cui è arrivato il denaro. Vuoto: da incassare.
  pagato_il   date,
  consegna    text        NOT NULL CONSTRAINT vendite_consegna_valida CHECK (consegna IN ('mano', 'spedizione')),
  -- Il giorno in cui è partita o l'ha data in mano. Vuoto: ancora da fare.
  consegnato_il date,
  -- Le copie tolte dal magazzino con questa vendita, per rimetterle se la si
  -- cancella: [{ "prodotto_id": 12, "formato": "A4", "copie": 2 }].
  magazzino   jsonb       NOT NULL DEFAULT '[]'::jsonb
              CONSTRAINT vendite_magazzino_es_arreglo CHECK (jsonb_typeof(magazzino) = 'array'),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vendite_numero_unico UNIQUE (anno, numero)
);

CREATE INDEX vendite_giorno ON vendite (giorno);

CREATE TRIGGER vendite_set_updated_at
  BEFORE UPDATE ON vendite
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE spese (
  id          integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  giorno      date        NOT NULL,
  descrizione text        NOT NULL CONSTRAINT spese_descrizione_misura CHECK (length(trim(descrizione)) BETWEEN 1 AND 200),
  importo     integer     NOT NULL CONSTRAINT spese_importo_positivo CHECK (importo > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX spese_giorno ON spese (giorno);

COMMIT;
