-- 007 · Il nome di chi si iscrive
--
-- Eseguire una sola volta su un database che ha già la 006:
--   psql -d illustrando -f db/migrations/007-nome-iscritti.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già la colonna.
--
-- La newsletter è una lettera di lei e comincia con «Ciao Giulia,» (cliente,
-- 2026-10-08). Il nome è facoltativo nel modulo: senza, la mail dice «Ciao,».

BEGIN;

ALTER TABLE iscritti
  ADD COLUMN nome text
             CONSTRAINT iscritti_nome_misura CHECK (nome IS NULL OR length(nome) BETWEEN 1 AND 80);

COMMIT;
