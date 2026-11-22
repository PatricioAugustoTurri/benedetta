-- 020 · Le recensioni di chi ha comprato
--
-- Eseguire una sola volta su un database che ha già la 019:
--   psql -d illustrando -f db/migrations/020-recensioni.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Chi compra nello Shop può lasciare stelle e due righe sui prodotti del suo
-- ordine, senza account (cliente, 2026-11-22). Non c'è login: c'è la chiave
-- dell'ordine, un link che arriva solo a chi ha pagato. Le opere
-- dell'archivio non si recensiscono: solo quello che si compra.

BEGIN;

-- --------------------------------------------------------------------------
-- La chiave dell'ordine: va nel link /recensione/<chiave>. Casuale e lunga
-- (128 bit) perché è l'unica cosa che separa un ordine da chiunque. Il
-- default si calcola riga per riga, quindi anche gli ordini già arrivati
-- ricevono la loro, tutte diverse.
-- --------------------------------------------------------------------------
ALTER TABLE ordini
  ADD COLUMN recensione_chiave text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '')
    CONSTRAINT ordini_recensione_chiave_key UNIQUE,
  -- Quando lei ha mandato la mail che chiede la recensione. Vuoto: mai.
  ADD COLUMN recensione_chiesta_at timestamptz;

-- --------------------------------------------------------------------------
-- recensioni — una per prodotto per ordine. Escono nella pagina del
-- prodotto appena arrivano; lei le può cancellare dall'admin, non
-- riscriverle: sono parole di chi ha comprato, non sue.
-- --------------------------------------------------------------------------
CREATE TABLE recensioni (
  id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ordine     integer     NOT NULL REFERENCES ordini (id) ON DELETE CASCADE,
  -- Per id e non per slug: lo slug di un prodotto si può cambiare, la
  -- recensione deve seguirlo. Se il prodotto si cancella, se ne vanno
  -- anche le sue recensioni.
  prodotto   integer     NOT NULL REFERENCES prodotti (id) ON DELETE CASCADE,
  voto       smallint    NOT NULL CONSTRAINT recensioni_voto_valido CHECK (voto BETWEEN 1 AND 5),
  testo      text        NOT NULL CONSTRAINT recensioni_testo_misura CHECK (length(trim(testo)) BETWEEN 1 AND 1200),
  -- Il nome così come vuole che esca: di solito il nome di battesimo.
  autore     text        NOT NULL CONSTRAINT recensioni_autore_misura CHECK (length(trim(autore)) BETWEEN 1 AND 60),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Un ordine recensisce ogni suo prodotto una volta sola: lo stesso link
  -- aperto due volte non scrive due recensioni.
  CONSTRAINT recensioni_una_per_prodotto UNIQUE (ordine, prodotto)
);

CREATE INDEX recensioni_prodotto ON recensioni (prodotto, created_at DESC);

COMMIT;
