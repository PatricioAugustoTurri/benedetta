-- 011 · Il pagamento passa da Stripe a SumUp
--
-- Eseguire una sola volta su un database che ha già la 010:
--   psql -d illustrando -f db/migrations/011-sumup.sql
--
-- Un database nuovo non ne ha bisogno: db/schema.sql ha già tutto.
--
-- Lei incassa già con SumUp ai mercatini (cliente, 2026-10-11). Un
-- pagamento SumUp è solo un importo: l'indirizzo, il telefono e le righe li
-- scrive chi compra nel carrello, e l'ordine aspetta in `pagamenti` finché
-- SumUp non dice che è pagato.

BEGIN;

-- L'ordine viene da un pagamento, non più da una sessione di Stripe. Gli
-- ordini di prova fatti con Stripe tengono il loro id in questa colonna.
ALTER TABLE ordini RENAME COLUMN stripe_session_id TO pagamento;
ALTER TABLE ordini RENAME CONSTRAINT ordini_stripe_session_id_key TO ordini_pagamento_key;

ALTER TABLE ordini
  -- Il telefono per il corriere. Stripe lo chiedeva ma l'ordine non lo
  -- salvava: gli ordini di prima restano senza.
  ADD COLUMN telefono    text CONSTRAINT ordini_telefono_misura CHECK (telefono IS NULL OR length(telefono) <= 24),
  -- Il codice della transazione che lei ritrova nell'app di SumUp, per un rimborso.
  ADD COLUMN transazione text,
  -- Obbligatorio per chi spedisce in Italia (cliente, 2026-10-11): 16
  -- caratteri, o le 11 cifre di un'azienda. Vuoto per il resto dell'Unione.
  ADD COLUMN codice_fiscale text CONSTRAINT ordini_codice_fiscale_forma CHECK (codice_fiscale IS NULL OR codice_fiscale ~ '^([A-Z0-9]{16}|[0-9]{11})$');

-- --------------------------------------------------------------------------
-- pagamenti — l'ordine prima di essere pagato
--
-- Una riga ogni volta che qualcuno parte per SumUp: tutto quello che serve
-- per scrivere l'ordine quando SumUp dice che è pagato. Chi torna indietro
-- senza pagare lascia qui la sua riga; il sito butta quelle di più di sette
-- giorni, perché i dati di chi non ha comprato non servono a nessuno.
-- --------------------------------------------------------------------------
CREATE TABLE pagamenti (
  -- Il `checkout_reference` di SumUp: torna con ogni lettura del pagamento.
  riferimento uuid        PRIMARY KEY,
  -- L'id del pagamento SumUp. Vuoto per il mezzo secondo fra la bozza e la
  -- risposta di SumUp, o per sempre se SumUp non ha risposto.
  checkout    text        UNIQUE,
  -- L'ordine com'è prima di essere pagato: nome, email, telefono, indirizzo,
  -- righe, conti. Le stesse chiavi di `ordini`.
  bozza       jsonb       NOT NULL,
  -- In centesimi: si confronta con l'importo che SumUp dice di aver incassato.
  totale      integer     NOT NULL CHECK (totale > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pagamenti_created_at ON pagamenti (created_at);

COMMIT;
