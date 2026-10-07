-- 004 · Il mockup di ogni stampa
--
-- Eseguire una sola volta su un database che ha già la 003:
--   psql -d illustrando -f db/migrations/004-mockup.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già la colonna.
--
-- Il mockup è la stampa fotografata appesa in una stanza. Nella griglia dello
-- Shop prende il posto della copertina quando il mouse si ferma sopra la
-- stampa per un secondo (cliente, 2026-10-07).
--
-- Non entra in `image` perché non è un'immagine come le altre: è una sola, non
-- si ordina, non può essere un video, e ha un posto fisso. Metterla in `image`
-- come «la seconda» farebbe dipendere la griglia dall'ordine in cui lei
-- carica i dettagli.

BEGIN;

-- La stessa forma di un elemento di `image`, { "url", "alt", "width",
-- "height", "publicId" }, oppure niente: una stampa senza mockup resta ferma
-- sulla sua copertina.
ALTER TABLE prodotti
  ADD COLUMN mockup jsonb
             CONSTRAINT prodotti_mockup_con_url CHECK (
               mockup IS NULL
               OR (jsonb_typeof(mockup) = 'object' AND jsonb_typeof(mockup -> 'url') = 'string')
             );

COMMIT;
