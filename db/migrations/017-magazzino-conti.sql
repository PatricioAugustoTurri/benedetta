-- 017 · Il magazzino delle stampe e i conti del mese
--
-- Eseguire una sola volta su un database che ha già la 016:
--   psql -d illustrando -f db/migrations/017-magazzino-conti.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Due quaderni di lavoro di lei, che il sito non legge (cliente, 2026-11-19):
--
-- - **magazzino**: quante stampe ha davvero nel cassetto, formato per
--   formato. È solo per lei: una stampa a zero si vende lo stesso, perché si
--   stampa su ordinazione. Le copie che il sito conta davvero —i quaderni—
--   restano in prodotti.scorte (la 016) e non c'entrano.
-- - **movimenti**: le vendite fuori dal sito —in contanti o con bonifico— e
--   le spese. Le vendite del sito non si scrivono qui: si leggono dagli ordini.

BEGIN;

CREATE TABLE magazzino (
  prodotto_id integer     NOT NULL REFERENCES prodotti (id) ON DELETE CASCADE,
  formato     text        NOT NULL,
  copie       integer     NOT NULL CONSTRAINT magazzino_copie_positive CHECK (copie >= 0),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (prodotto_id, formato)
);

CREATE TABLE movimenti (
  id         integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  giorno     date        NOT NULL,
  tipo       text        NOT NULL CONSTRAINT movimenti_tipo_valido CHECK (tipo IN ('vendita', 'spesa')),
  canale     text        CONSTRAINT movimenti_canale_valido CHECK (
                           (tipo = 'vendita' AND canale IN ('contanti', 'bonifico'))
                           OR (tipo = 'spesa' AND canale IS NULL)
                         ),
  importo    integer     NOT NULL CONSTRAINT movimenti_importo_positivo CHECK (importo > 0),
  nota       text        CONSTRAINT movimenti_nota_misura CHECK (nota IS NULL OR length(nota) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX movimenti_giorno ON movimenti (giorno);

COMMIT;
