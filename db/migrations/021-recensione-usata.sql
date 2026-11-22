-- 021 · Il link della recensione si usa una volta sola
--
-- Eseguire una sola volta su un database che ha già la 020:
--   psql -d illustrando -f db/migrations/021-recensione-usata.sql
--
-- Come la 020, non serve correrla a mano: il sito la applica da solo quando
-- parte (src/lib/migrazioni.ts), e si può ripetere senza cambiare niente.
--
-- Chi ha lasciato la recensione non può lasciarne un'altra: il link —e il QR
-- nel pacco— vale per un invio solo, anche se quella volta ha saltato
-- qualche prodotto (cliente, 2026-11-22). Non basta guardare se l'ordine ha
-- recensioni: se lei ne cancella una dall'admin, il link tornerebbe a
-- funzionare. Per questo l'ordine ricorda quando è stato usato.

BEGIN;

ALTER TABLE ordini ADD COLUMN IF NOT EXISTS recensione_usata_at timestamptz;

-- Gli ordini che hanno già recensioni hanno già usato il link: quando, lo
-- dice la prima.
UPDATE ordini o
   SET recensione_usata_at = (SELECT min(r.created_at) FROM recensioni r WHERE r.ordine = o.id)
 WHERE o.recensione_usata_at IS NULL
   AND EXISTS (SELECT 1 FROM recensioni r WHERE r.ordine = o.id);

COMMIT;
