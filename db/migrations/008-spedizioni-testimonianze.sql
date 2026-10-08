-- 008 · La spedizione di un ordine e le testimonianze
--
-- Eseguire una sola volta su un database che ha già la 007:
--   psql -d illustrando -f db/migrations/008-spedizioni-testimonianze.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.

BEGIN;

-- --------------------------------------------------------------------------
-- La spedizione: quando è partito, con chi e con che numero. Quando lei segna
-- un ordine come spedito, chi ha comprato riceve una mail con questi dati.
-- --------------------------------------------------------------------------
ALTER TABLE ordini
  ADD COLUMN spedito_at timestamptz,
  ADD COLUMN corriere   text CONSTRAINT ordini_corriere_misura CHECK (corriere IS NULL OR length(corriere) <= 80),
  ADD COLUMN tracking   text CONSTRAINT ordini_tracking_misura CHECK (tracking IS NULL OR length(tracking) <= 300),
  -- Quando è partita la mail al cliente. Vuoto con l'ordine spedito vuol dire
  -- che il cliente non sa ancora niente: l'admin lo segnala e permette di
  -- riprovare.
  ADD COLUMN cliente_avvisato_at timestamptz;

-- Gli ordini già segnati come spediti prendono come data l'ultima modifica:
-- è il momento più vicino a quello vero che il database conosce.
UPDATE ordini SET spedito_at = updated_at WHERE stato = 'spedito';

-- --------------------------------------------------------------------------
-- testimonianze — le parole di chi ha commissionato un ritratto o
-- un'illustrazione. Escono nella pagina del servizio. Le scrive lei
-- dall'admin, copiandole da quello che le hanno scritto: mai inventate.
-- --------------------------------------------------------------------------
CREATE TABLE testimonianze (
  id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  servizio   text        NOT NULL REFERENCES servizi (slug) ON DELETE CASCADE,
  testo      text        NOT NULL CONSTRAINT testimonianze_testo_misura CHECK (length(trim(testo)) BETWEEN 1 AND 800),
  autore     text        NOT NULL CONSTRAINT testimonianze_autore_misura CHECK (length(trim(autore)) BETWEEN 1 AND 80),
  -- Una riga di contesto facoltativa: «ritratto di famiglia, 2025».
  dettaglio  text        CONSTRAINT testimonianze_dettaglio_misura CHECK (dettaglio IS NULL OR length(dettaglio) <= 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX testimonianze_servizio ON testimonianze (servizio, created_at DESC);

COMMIT;
