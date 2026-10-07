-- 003 · Ritratti e illustrazioni diventano servizi, non prodotti
--
-- Eseguire una sola volta su un database che ha già la 002:
--   psql -d illustrando -f db/migrations/003-servizi.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql è già così.
--
-- Nella 002 le tre categorie dello Shop vivevano tutte in `prodotti`, come se
-- si potessero aggiungere ritratti uno dopo l'altro. Non è così (cliente,
-- 2026-10-07): Illustrazioni Personalizzate e Ritratti Illustrati sono due
-- servizi, uno ciascuno e sempre gli stessi. Si leggono e si commissionano
-- scrivendole; non si comprano e non si moltiplicano. Quello che cambia è il
-- loro testo e le immagini che li mostrano.
--
-- Le stampe invece restano prodotti: si aggiungono di continuo.

BEGIN;

-- --------------------------------------------------------------------------
-- servizi — i due lavori su commissione
--
-- Due righe e mai di più né di meno. La chiave è lo slug, e il CHECK ammette
-- solo i due: non c'è un INSERT da fare dall'admin, né un DELETE. L'admin le
-- modifica e basta.
-- --------------------------------------------------------------------------
CREATE TABLE servizi (
  slug        text        PRIMARY KEY
              CONSTRAINT servizi_slug_valido CHECK (
                slug IN ('illustrazioni-personalizzate', 'ritratti-illustrati')
              ),

  title       text        NOT NULL
              CONSTRAINT servizi_title_no_vacio CHECK (length(trim(title)) > 0),

  -- Di cosa si tratta e come funziona: quello che si legge prima di scriverle.
  description text,

  -- La stessa forma di works.image e prodotti.image, con le stesse regole.
  image       jsonb       NOT NULL DEFAULT '[]'::jsonb
              CONSTRAINT servizi_image_es_arreglo CHECK (jsonb_typeof(image) = 'array')
              CONSTRAINT servizi_image_con_url CHECK (
                CASE WHEN jsonb_typeof(image) = 'array' THEN
                  jsonb_array_length(
                    jsonb_path_query_array(image, '$[*] ? (@.url.type() == "string")')
                  ) = jsonb_array_length(image)
                ELSE true END
              ),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER servizi_set_updated_at
  BEFORE UPDATE ON servizi
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Le due righe esistono da subito, col solo nome: il testo e le immagini li
-- mette lei da /admin/shop.
INSERT INTO servizi (slug, title) VALUES
  ('illustrazioni-personalizzate', 'Illustrazioni Personalizzate'),
  ('ritratti-illustrati', 'Ritratti Illustrati');

-- --------------------------------------------------------------------------
-- prodotti diventa solo stampe.
--
-- Se qualcuno aveva già caricato un ritratto o un'illustrazione come prodotto,
-- il primo di ognuno passa al suo servizio —testo e immagini— invece di
-- perdersi, e poi le righe se ne vanno.
-- --------------------------------------------------------------------------
UPDATE servizi s
   SET title = p.title, description = p.description, image = p.image
  FROM (
    SELECT DISTINCT ON (categoria) categoria, title, description, image
      FROM prodotti
     WHERE categoria <> 'stampe'
     ORDER BY categoria, position, id
  ) p
 WHERE s.slug = p.categoria;

DELETE FROM prodotti WHERE categoria <> 'stampe';

ALTER TABLE prodotti DROP CONSTRAINT prodotti_categoria_valida;
ALTER TABLE prodotti DROP CONSTRAINT prodotti_formati_solo_stampe;
ALTER TABLE prodotti DROP CONSTRAINT prodotti_opera_solo_stampe;

-- La colonna resta —è nell'indirizzo, /shop/stampe/<slug>, e nell'ordine per
-- categoria— ma ammette un valore solo.
ALTER TABLE prodotti
  ADD CONSTRAINT prodotti_categoria_valida CHECK (categoria = 'stampe');

-- Una stampa senza formati non si può comprare.
ALTER TABLE prodotti
  ADD CONSTRAINT prodotti_formati_presenti CHECK (
    CASE WHEN jsonb_typeof(formati) = 'array' THEN jsonb_array_length(formati) > 0 ELSE true END
  );

ALTER TABLE prodotti ALTER COLUMN categoria SET DEFAULT 'stampe';

COMMIT;
