-- 022 · PayPal fra i modi di pagare
--
-- Eseguire una sola volta su un database che ha già la 021:
--   psql -d illustrando -f db/migrations/022-vendite-paypal.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Qualcuno le paga con PayPal (cliente, 2026-11-22): non sono contanti, né
-- un bonifico, né SumUp. È un quarto canale delle vendite scritte a mano,
-- per ora senza commissione nei conti.

BEGIN;

ALTER TABLE vendite DROP CONSTRAINT vendite_canale_valido;
ALTER TABLE vendite ADD CONSTRAINT vendite_canale_valido CHECK (canale IN ('contanti', 'bonifico', 'sumup', 'paypal'));

COMMIT;
