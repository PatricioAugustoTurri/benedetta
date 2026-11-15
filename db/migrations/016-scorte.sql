-- 016 · Le copie in magazzino
--
-- Eseguire una sola volta su un database che ha già la 015:
--   psql -d illustrando -f db/migrations/016-scorte.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Le stampe si stampano su ordinazione e non finiscono mai. I quaderni no:
-- sono quelli che ha, e quando sono finiti sono finiti (cliente,
-- 2026-11-15). Lei scrive quante copie ha; ogni ordine pagato le scala, e
-- quelle che vende fuori dal sito —al mercato, in negozio— le toglie a mano
-- da /admin/shop.
--
-- NULL vuol dire «non si contano»: è il caso delle stampe e di tutto quello
-- che c'era prima, quindi nessuna riga esistente cambia comportamento.

BEGIN;

ALTER TABLE prodotti
  ADD COLUMN scorte integer
    CONSTRAINT prodotti_scorte_positive CHECK (scorte IS NULL OR scorte >= 0);

COMMIT;
