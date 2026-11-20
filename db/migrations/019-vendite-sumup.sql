-- 019 · SumUp fra i modi di pagare
--
-- Eseguire una sola volta su un database che ha già la 018:
--   psql -d illustrando -f db/migrations/019-vendite-sumup.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Al banco lei incassa anche con la carta, dal lettore SumUp (cliente,
-- 2026-11-20). Non sono contanti e non sono un bonifico: è un terzo canale
-- delle vendite scritte a mano. Le vendite del sito restano negli ordini,
-- anche se il sito incassa con SumUp anche lui.

BEGIN;

ALTER TABLE vendite DROP CONSTRAINT vendite_canale_valido;
ALTER TABLE vendite ADD CONSTRAINT vendite_canale_valido CHECK (canale IN ('contanti', 'bonifico', 'sumup'));

COMMIT;
