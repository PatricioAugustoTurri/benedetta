-- 024 · Le testimonianze di chi ha commissionato un ritratto o un'illustrazione
--
-- Eseguire una sola volta su un database che ha già la 023:
--   psql -d illustrando -f db/migrations/024-inviti-testimonianza.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Come la 020, la 021 e la 023, il sito la applica anche da solo quando
-- parte (src/lib/migrazioni.ts), ed è scritta per potersi ripetere.
--
-- Fino a qui le testimonianze dei due servizi le copiava lei a mano
-- nell'admin. Adesso (cliente, 2026-11-27) dalla scheda del servizio crea
-- un invito, lo stesso QR dei prodotti: chi ha ricevuto il ritratto lo
-- inquadra, lascia stelle, due righe e il nome, e la testimonianza esce da
-- sola nella pagina del servizio. Vale per un invio solo, come quello dei
-- prodotti.

BEGIN;

-- --------------------------------------------------------------------------
-- inviti_testimonianza — uno per QR. La chiave ha la stessa forma di quella
-- degli ordini e degli inviti dei prodotti: /recensione/<chiave> le cerca
-- tutte e tre, quindi il QR e la cartolina sono gli stessi.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inviti_testimonianza (
  id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chiave     text        NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '')
             CONSTRAINT inviti_testimonianza_chiave_key UNIQUE,
  servizio   text        NOT NULL REFERENCES servizi (slug) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Quando è stato usato. Vuoto: il QR vale ancora.
  usato_at   timestamptz
);

CREATE INDEX IF NOT EXISTS inviti_testimonianza_servizio ON inviti_testimonianza (servizio);

-- --------------------------------------------------------------------------
-- Le stelle, e da quale invito è arrivata. Tutte e due vuote per le
-- testimonianze che lei copia a mano: quelle non hanno stelle, e non le si
-- inventano.
--
-- Se l'invito sparisce, la testimonianza resta: sono parole di un cliente,
-- non del QR.
-- --------------------------------------------------------------------------
ALTER TABLE testimonianze
  ADD COLUMN IF NOT EXISTS voto smallint
    CONSTRAINT testimonianze_voto_valido CHECK (voto IS NULL OR voto BETWEEN 1 AND 5);
ALTER TABLE testimonianze
  ADD COLUMN IF NOT EXISTS invito integer
    CONSTRAINT testimonianze_invito_key UNIQUE
    REFERENCES inviti_testimonianza (id) ON DELETE SET NULL;

COMMIT;
