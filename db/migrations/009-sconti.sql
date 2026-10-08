-- 009 · Gli sconti di stagione
--
-- Eseguire una sola volta su un database che ha già la 008:
--   psql -d illustrando -f db/migrations/009-sconti.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Una sezione sotto le categorie dello Shop, con un nome («Sconti di Natale»),
-- una percentuale e le stampe che lei sceglie, che si accende e si spegne da
-- sola fra due date (cliente, 2026-10-08). Lo sconto è vero: lo applica il
-- server al prezzo della scheda, del carrello e del pagamento.

BEGIN;

CREATE TABLE sconti (
  id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titolo     text        NOT NULL CONSTRAINT sconti_titolo_misura CHECK (length(trim(titolo)) BETWEEN 1 AND 80),
  -- Due righe facoltative sotto il titolo.
  testo      text        CONSTRAINT sconti_testo_misura CHECK (testo IS NULL OR length(testo) <= 400),
  -- La percentuale, intera: 20 vuol dire −20%.
  percentuale smallint   NOT NULL CONSTRAINT sconti_percentuale_valida CHECK (percentuale BETWEEN 1 AND 90),
  -- Il primo e l'ultimo giorno, compresi, con l'ora italiana.
  dal        date        NOT NULL,
  al         date        NOT NULL,
  -- Spento a mano: resta salvato ma non vale, anche dentro le sue date.
  attivo     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sconti_date_in_ordine CHECK (al >= dal)
);

CREATE TRIGGER sconti_set_updated_at
  BEFORE UPDATE ON sconti
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Le stampe di uno sconto, nell'ordine in cui escono. Cancellare uno sconto o
-- una stampa toglie la riga, non il resto.
CREATE TABLE sconti_stampe (
  sconto_id   integer NOT NULL REFERENCES sconti (id) ON DELETE CASCADE,
  prodotto_id integer NOT NULL REFERENCES prodotti (id) ON DELETE CASCADE,
  posizione   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (sconto_id, prodotto_id)
);

COMMIT;
