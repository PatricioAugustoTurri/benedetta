-- 013 · Le categorie dello Shop escono dal codice
--
-- Eseguire una sola volta su un database che ha già la 012:
--   psql -d illustrando -f db/migrations/013-categorie.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Fino a qui le categorie erano tre, scritte in src/data/shop.ts, e il
-- database le controllava con un CHECK: aggiungerne una era una migrazione.
-- Adesso lei le crea da /admin/shop (cliente, 2026-11-01, per il Calendario
-- 2027), e la lista vive qui.
--
-- Le due di servizio restano due e fisse: hanno la loro riga in `servizi`.
-- Quelle che nascono dall'admin sono tutte come Stampe: prodotti con formati,
-- prezzo e carrello.

BEGIN;

CREATE TABLE categorie (
  -- Va nell'indirizzo, /shop/<slug>: non si cambia dopo, perché un link già
  -- condiviso non può cominciare a puntare altrove.
  slug        text        PRIMARY KEY
              CONSTRAINT categorie_slug_formato CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  -- Il nome come esce nel menu, nel footer e sulla porta di /shop.
  label       text        NOT NULL
              CONSTRAINT categorie_label_misura CHECK (length(trim(label)) BETWEEN 1 AND 60),

  -- 'servizio': una pagina sola che porta al modulo (vedi `servizi`).
  -- 'prodotti': una lista che si compra.
  tipo        text        NOT NULL DEFAULT 'prodotti'
              CONSTRAINT categorie_tipo_valido CHECK (tipo IN ('servizio', 'prodotti')),

  -- Una categoria nuova nasce nascosta, come una stampa nasce bozza: si
  -- riempie con calma e compare nel menu quando ha qualcosa da mostrare.
  visibile    boolean     NOT NULL DEFAULT false,

  -- L'ordine del menu, del footer e delle porte.
  position    integer     NOT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categorie
  ADD CONSTRAINT categorie_position_unica UNIQUE (position) DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER categorie_set_updated_at
  BEFORE UPDATE ON categorie
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Le tre di sempre, visibili e nell'ordine di prima. Il Calendario 2027 entra
-- nascosto: lei lo accende da /admin/shop quando ci sono i calendari.
INSERT INTO categorie (slug, label, tipo, visibile, position) VALUES
  ('illustrazioni-personalizzate', 'Illustrazioni Personalizzate', 'servizio', true, 1),
  ('ritratti-illustrati', 'Ritratti Illustrati', 'servizio', true, 2),
  ('stampe', 'Stampe', 'prodotti', true, 3),
  ('calendario-2027', 'Calendario 2027', 'prodotti', false, 4);

-- Un prodotto sta in una categoria che esiste. ON UPDATE CASCADE per
-- prudenza: lo slug non si cambia dall'admin, ma se un giorno si cambia a
-- mano i prodotti lo seguono.
ALTER TABLE prodotti DROP CONSTRAINT prodotti_categoria_valida;
ALTER TABLE prodotti
  ADD CONSTRAINT prodotti_categoria_fkey
  FOREIGN KEY (categoria) REFERENCES categorie (slug) ON UPDATE CASCADE;

-- La copertina se ne va con la sua categoria.
ALTER TABLE copertine DROP CONSTRAINT copertine_categoria_valida;
ALTER TABLE copertine
  ADD CONSTRAINT copertine_categoria_fkey
  FOREIGN KEY (categoria) REFERENCES categorie (slug) ON UPDATE CASCADE ON DELETE CASCADE;

COMMIT;
