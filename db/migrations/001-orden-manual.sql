-- 001 · L'ordine dell'archivio diventa una decisione, non un calcolo
--
-- Eseguire una sola volta su un database che esiste già:
--   psql -d illustrando -f db/migrations/001-orden-manual.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già la colonna.
--
-- Fino a qui la griglia usciva con `ORDER BY year DESC, id DESC`, che è un
-- ordine che nessuno ha scelto: lo decidevano la data dell'opera e, a parità
-- di anno, il numero che le era toccato in tabella. Basta per un archivio che
-- si legge come una cronologia, e non basta per uno che si cura: quale pezzo
-- apre il sito e quale va accanto a quale è una decisione sua, e non aveva
-- dove essere scritta.

BEGIN;

ALTER TABLE works ADD COLUMN position integer;

-- L'ordine che c'era finora si conserva tale e quale, numerato. Partire
-- dall'ordine in vigore e non da zero è ciò che fa sì che la migrazione non si
-- noti: lei apre l'admin e vede l'archivio come l'ha lasciato, con la
-- differenza che adesso lo può spostare.
WITH orden_heredado AS (
  SELECT id, row_number() OVER (ORDER BY year DESC, id DESC) AS n
    FROM works
)
UPDATE works
   SET position = orden_heredado.n
  FROM orden_heredado
 WHERE works.id = orden_heredado.id;

ALTER TABLE works ALTER COLUMN position SET NOT NULL;

-- Unico, perché due opere nello stesso posto sono esattamente l'errore che
-- questa colonna esiste per non avere: se succede, la griglia torna a
-- riordinarsi da sola fra due caricamenti e non c'è modo di accorgersene
-- guardando.
--
-- DEFERRABLE INITIALLY DEFERRED perché riordinare è, per definizione, passare
-- per stati in cui due righe si calpestano: spostare la quinta al primo posto
-- fa scorrere quattro opere di una casella, e in mezzo a quell'UPDATE ci sono
-- duplicati. Il vincolo si verifica alla chiusura della transazione, quando
-- l'ordine è ormai un ordine.
ALTER TABLE works
  ADD CONSTRAINT works_position_unica UNIQUE (position) DEFERRABLE INITIALLY DEFERRED;

-- L'indice per anno se ne va insieme all'ordine che serviva. Non resta più
-- nessuna query che ordini o filtri per `year`: nella scheda dell'opera l'anno
-- è un dato che si mostra, non uno per cui si cerca. Un indice che nessuno usa
-- è lavoro a ogni scrittura in cambio di niente.
--
-- Il vincolo qui sopra lascia il proprio indice su `position`, che è quello
-- che adesso percorre la griglia, quindi non serve crearne un altro.
DROP INDEX IF EXISTS works_year_idx;

COMMIT;
