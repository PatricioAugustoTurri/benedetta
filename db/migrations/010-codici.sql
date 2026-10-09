-- 010 · I codici sconto
--
-- Eseguire una sola volta su un database che ha già la 009:
--   psql -d illustrando -f db/migrations/010-codici.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Un codice che si scrive nel carrello prima di pagare (cliente, 2026-10-09).
-- Due tipi nella stessa tabella:
--   · generali, come BENZIBET98 al 15%, il primo biglietto stampato uguale
--     per tutti: valgono per chiunque e quante volte si vuole;
--   · personali, uno per ordine, che lei scrive a mano sul biglietto del
--     pacco: 15%, una volta sola, 90 giorni dalla spedizione. Tutto
--     correggibile prima di spedire.
-- Non si sommano agli sconti di stagione: valgono solo sulle stampe che non
-- sono già scontate.

BEGIN;

-- L'ordine ricorda quanto è stato scontato e con quale codice: è una
-- fotografia, come le righe. Se domani il codice cambia percentuale o si
-- cancella, l'ordine di ieri dice ancora quello che è stato pagato.
ALTER TABLE ordini
  ADD COLUMN sconto integer NOT NULL DEFAULT 0 CONSTRAINT ordini_sconto_positivo CHECK (sconto >= 0),
  ADD COLUMN codice text;

CREATE INDEX ordini_codice ON ordini (codice) WHERE codice IS NOT NULL;

CREATE TABLE codici (
  id          integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Sempre in maiuscolo e senza spazi: chi lo scrive non deve indovinare come.
  codice      text        NOT NULL UNIQUE
              CONSTRAINT codici_codice_forma CHECK (codice ~ '^[A-Z0-9-]{3,30}$'),
  -- La percentuale, intera: 15 vuol dire −15%.
  percentuale smallint    NOT NULL CONSTRAINT codici_percentuale_valida CHECK (percentuale BETWEEN 1 AND 90),
  -- Spento a mano: resta salvato, con il conto degli usi, ma non vale.
  attivo      boolean     NOT NULL DEFAULT true,
  -- L'ultimo giorno in cui vale, compreso, con l'ora italiana. Vuoto: sempre.
  scade       date,
  -- Vale per un ordine solo: dopo il primo pagamento resta, segnato, e non vale più.
  monouso     boolean     NOT NULL DEFAULT false,
  -- Il codice personale del biglietto: l'ordine nel cui pacco va. Uno per
  -- ordine. Finché il pacco non parte la scadenza resta vuota; la fissa la
  -- spedizione, 90 giorni dopo, se lei non ne ha scelta un'altra.
  ordine_id   integer     UNIQUE REFERENCES ordini (id) ON DELETE SET NULL,
  -- L'ordine in cui un codice monouso è stato speso.
  usato_ordine_id integer REFERENCES ordini (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER codici_set_updated_at
  BEFORE UPDATE ON codici
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO codici (codice, percentuale) VALUES ('BENZIBET98', 15);

COMMIT;
