-- 023 · Le recensioni di chi ha comprato fuori dal sito
--
-- Eseguire una sola volta su un database che ha già la 022:
--   psql -d illustrando -f db/migrations/023-inviti-recensione.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Come la 020 e la 021, il sito la applica anche da solo quando parte
-- (src/lib/migrazioni.ts), ed è scritta per potersi ripetere.
--
-- Chi compra al mercato o in negozio non ha un ordine, e quindi nemmeno la
-- chiave per recensire (cliente, 2026-11-27). Dalla scheda di un prodotto,
-- nell'admin, lei crea un invito: un QR da mostrare sul telefono o da
-- stampare sulla cartolina, che apre /recensione/<chiave> su quel prodotto
-- solo. Vale per un invio solo, come il link di un ordine: un QR rimasto
-- sul banco non diventa una porta aperta a chiunque.

BEGIN;

-- --------------------------------------------------------------------------
-- inviti_recensione — uno per QR. La chiave ha la stessa forma di quella
-- degli ordini (32 caratteri esadecimali): la pagina le cerca tutte e due.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inviti_recensione (
  id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chiave     text        NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '')
             CONSTRAINT inviti_recensione_chiave_key UNIQUE,
  -- Se il prodotto si cancella, se ne vanno anche i suoi inviti (e con
  -- loro, per la cascata di recensioni, le recensioni).
  prodotto   integer     NOT NULL REFERENCES prodotti (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Quando è stato usato. Vuoto: il QR vale ancora.
  usato_at   timestamptz
);

CREATE INDEX IF NOT EXISTS inviti_recensione_prodotto ON inviti_recensione (prodotto);

-- --------------------------------------------------------------------------
-- Una recensione viene da un ordine o da un invito, mai da tutti e due.
-- --------------------------------------------------------------------------
ALTER TABLE recensioni ALTER COLUMN ordine DROP NOT NULL;
ALTER TABLE recensioni
  ADD COLUMN IF NOT EXISTS invito integer
    CONSTRAINT recensioni_invito_key UNIQUE
    REFERENCES inviti_recensione (id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recensioni_una_fonte') THEN
    ALTER TABLE recensioni
      ADD CONSTRAINT recensioni_una_fonte CHECK (num_nonnulls(ordine, invito) = 1);
  END IF;
END $$;

COMMIT;
