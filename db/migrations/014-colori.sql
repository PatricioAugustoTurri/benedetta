-- 014 · I colori di un prodotto
--
-- Eseguire una sola volta su un database che ha già la 013:
--   psql -d illustrando -f db/migrations/014-colori.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Il Calendario 2027 è uno solo, ma la copertina si sceglie fra cinque colori
-- (cliente, 2026-11-05). Il colore non cambia il prezzo, quindi non è un
-- formato: è una seconda scelta accanto al formato, e resta scritta nella
-- riga dell'ordine. Un prodotto senza colori —le stampe— non chiede niente.

BEGIN;

ALTER TABLE prodotti
  ADD COLUMN colori jsonb NOT NULL DEFAULT '[]'::jsonb
    CONSTRAINT prodotti_colori_es_arreglo CHECK (jsonb_typeof(colori) = 'array')
    -- Ogni colore ha un nome e una tinta #rrggbb. Si contano i buoni e si
    -- esige che siano tutti, come per i formati.
    CONSTRAINT prodotti_colori_validi CHECK (
      CASE WHEN jsonb_typeof(colori) = 'array' THEN
        jsonb_array_length(
          jsonb_path_query_array(
            colori,
            '$[*] ? (@.nome.type() == "string" && @.tinta.type() == "string" && @.tinta like_regex "^#[0-9a-f]{6}$")'
          )
        ) = jsonb_array_length(colori)
      ELSE true END
    );

-- Il calendario che c'è già nasce con i cinque colori. Le tinte sono una
-- proposta: lei le corregge dall'admin perché somiglino alla copertina vera.
UPDATE prodotti
   SET colori = '[
     {"nome": "Verde",   "tinta": "#5e7d4f"},
     {"nome": "Rosso",   "tinta": "#b5402f"},
     {"nome": "Celeste", "tinta": "#8ec3dc"},
     {"nome": "Viola",   "tinta": "#7b5d9c"},
     {"nome": "Giallo",  "tinta": "#e4b93e"}
   ]'::jsonb
 WHERE categoria = 'calendario-2027' AND colori = '[]'::jsonb;

COMMIT;
