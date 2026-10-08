-- 006 · La newsletter
--
-- Eseguire una sola volta su un database che ha già la 005:
--   psql -d illustrando -f db/migrations/006-newsletter.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Chi si iscrive dal piè di pagina riceve una mail per confermare; solo dopo
-- è nella lista (doppio opt-in, cliente 2026-10-08). Le opere nuove e le
-- stampe pubblicate si mettono in fila da sole come «novità da annunciare», e
-- lei manda la mail dall'admin quando vuole, con tutte insieme.

BEGIN;

-- --------------------------------------------------------------------------
-- iscritti — chi riceve la newsletter
--
-- Tre stati, letti dalle date: in attesa (confermato_at nullo), iscritto
-- (confermato e non disiscritto), disiscritto. Chi si disiscrive resta nella
-- tabella con la data: è la prova che non gli si deve più scrivere.
-- --------------------------------------------------------------------------
CREATE TABLE iscritti (
  id                  integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Sempre in minuscolo, così «Ana@x.it» e «ana@x.it» sono la stessa persona.
  email               text        NOT NULL UNIQUE
                      CONSTRAINT iscritti_email_formato CHECK (
                        email = lower(email) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
                      ),

  -- Il segreto dei link di conferma e di disiscrizione. Non si indovina e
  -- non dice niente di chi è.
  token               text        NOT NULL UNIQUE,

  confermato_at       timestamptz,
  disiscritto_at      timestamptz,

  -- Quando è partita l'ultima mail di conferma: non se ne manda un'altra
  -- prima di dieci minuti, anche se qualcuno insiste sul modulo.
  conferma_inviata_at timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER iscritti_set_updated_at
  BEFORE UPDATE ON iscritti
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------------------------------------------------------------------
-- annunciato_at — se una cosa è già stata detta agli iscritti
--
-- Nullo vuol dire «da annunciare». Tutto quello che c'è già oggi si segna
-- come annunciato: la prima newsletter deve parlare di quello che arriva da
-- adesso, non di tutto l'archivio.
-- --------------------------------------------------------------------------
ALTER TABLE works    ADD COLUMN annunciato_at timestamptz;
ALTER TABLE prodotti ADD COLUMN annunciato_at timestamptz;
UPDATE works    SET annunciato_at = now();
UPDATE prodotti SET annunciato_at = now() WHERE pubblicato;

-- --------------------------------------------------------------------------
-- invii — le newsletter mandate
--
-- Una riga per invio, con una fotografia di cosa conteneva: se domani
-- un'opera cambia titolo, l'invio di ieri dice ancora cosa è partito.
-- --------------------------------------------------------------------------
CREATE TABLE invii (
  id           integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  oggetto      text        NOT NULL,
  testo        text,
  -- [{ "tipo": "opera" | "stampa", "id", "title", "url" }]
  contenuto    jsonb       NOT NULL CONSTRAINT invii_contenuto_es_arreglo CHECK (jsonb_typeof(contenuto) = 'array'),
  destinatari  integer     NOT NULL DEFAULT 0,
  consegnati   integer     NOT NULL DEFAULT 0,
  stato        text        NOT NULL DEFAULT 'in corso'
               CONSTRAINT invii_stato_valido CHECK (stato IN ('in corso', 'inviato', 'errore')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMIT;
