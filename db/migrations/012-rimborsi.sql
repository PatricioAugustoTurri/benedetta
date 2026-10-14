-- 012 · I rimborsi
--
-- Eseguire una sola volta su un database che ha già la 011:
--   psql -d illustrando -f db/migrations/012-rimborsi.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Un ordine rimborsato non torna «pagato» né resta «spedito»: è un terzo
-- stato, e l'admin lo mette da parte. Il rimborso parte da /admin/ordini e
-- passa da SumUp; la data dice quando.

BEGIN;

ALTER TABLE ordini DROP CONSTRAINT ordini_stato_valido;
ALTER TABLE ordini
  ADD CONSTRAINT ordini_stato_valido CHECK (stato IN ('pagato', 'spedito', 'rimborsato')),
  ADD COLUMN rimborsato_at timestamptz;

COMMIT;
