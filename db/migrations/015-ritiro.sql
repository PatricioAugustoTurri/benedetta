-- 015 · Il ritiro in negozio
--
-- Eseguire una sola volta su un database che ha già la 014:
--   psql -d illustrando -f db/migrations/015-ritiro.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Chi compra può scegliere, prima di pagare, di passare a ritirare l'ordine
-- nel negozio di Foligno invece di farselo spedire (cliente, 2026-11-06).
-- Gratis, per chiunque, senza scadenza. Si paga lo stesso con SumUp; la
-- spedizione dell'ordine vale 0 e l'indirizzo resta vuoto.
--
-- Gli stati non cambiano: «spedito» vuol dire consegnato, e per un ritiro è
-- il giorno in cui chi ha comprato è passato a prenderlo. In mezzo c'è un
-- passo che la spedizione non ha: lei lo segna pronto —le stampe si
-- stampano su ordinazione, non sono lì ad aspettare— e parte la mail che lo
-- dice. `cliente_avvisato_at` registra quella mail, come per la spedizione.

BEGIN;

ALTER TABLE ordini
  ADD COLUMN consegna text NOT NULL DEFAULT 'spedizione'
    CONSTRAINT ordini_consegna_valida CHECK (consegna IN ('spedizione', 'ritiro')),
  ADD COLUMN pronto_at timestamptz;

COMMIT;
