-- 005 · Le copertine delle categorie dello Shop
--
-- Eseguire una sola volta su un database che ha già la 004:
--   psql -d illustrando -f db/migrations/005-copertine.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già la tabella.
--
-- La pagina /shop è diventata tre porte, una per categoria, ognuna con
-- un'immagine che sceglie lei da /admin/shop (cliente, 2026-10-08). Quella
-- immagine non è di nessun prodotto né di nessun servizio: è della categoria.

BEGIN;

CREATE TABLE copertine (
  -- Le categorie di src/data/shop.ts. Quando se ne aggiunge una, si aggiunge
  -- anche qui.
  categoria   text        PRIMARY KEY
              CONSTRAINT copertine_categoria_valida CHECK (
                categoria IN ('illustrazioni-personalizzate', 'ritratti-illustrati', 'stampe')
              ),

  -- Un elemento come quelli di works.image: { "url", "alt", "width",
  -- "height", "publicId" }. Senza copertina non c'è la riga.
  immagine    jsonb       NOT NULL
              CONSTRAINT copertine_immagine_con_url CHECK (
                jsonb_typeof(immagine) = 'object' AND jsonb_typeof(immagine -> 'url') = 'string'
              ),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER copertine_set_updated_at
  BEFORE UPDATE ON copertine
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
