#!/usr/bin/env bash
#
# Porta in questo Mac il database di produzione, per lavorare con i dati veri.
#
# Benedetta carica tutto in produzione, e la base locale resta indietro.
# Questo script:
#   1. fa un backup della base locale in ~/Backups/benedetta/ (si può tornare indietro);
#   2. scarica la base di produzione;
#   3. la mette al posto di quella locale.
#
#   scripts/traer-produccion.sh
#
# Non tocca mai la produzione: legge e basta.

set -euo pipefail

SERVER="root@187.127.70.109"
CONTENITORE="vcjetqncbcnu9cbvzqihgfkc"
CARTELLA="${BACKUP_DIR:-$HOME/Backups/benedetta}"
CARTELLA_PROGETTO="$(cd "$(dirname "$0")/.." && pwd)"

# DATABASE_URL della base locale, da .env.local.
DATABASE_URL="$(grep -E '^DATABASE_URL=' "$CARTELLA_PROGETTO/.env.local" | head -1 | cut -d= -f2-)"
if [[ -z "$DATABASE_URL" ]]; then
  echo "Manca DATABASE_URL in .env.local." >&2
  exit 1
fi
case "$DATABASE_URL" in
  *localhost*|*127.0.0.1*) ;;
  *) echo "DATABASE_URL non punta a questo Mac: per sicurezza non tocco niente." >&2; exit 1 ;;
esac

read -r -p "Sostituisco la base LOCALE con quella di produzione. Continuo? [s/N] " si
[[ "$si" == "s" || "$si" == "S" ]] || { echo "Niente fatto."; exit 0; }

mkdir -p "$CARTELLA"
ORA="$(date +%Y%m%d-%H%M%S)"

echo "1/3 · Backup della base locale…"
pg_dump --no-owner "$DATABASE_URL" | gzip > "$CARTELLA/locale-$ORA.sql.gz"

echo "2/3 · Scarico la produzione…"
DUMP="$(mktemp)"
trap 'rm -f "$DUMP"' EXIT
ssh -o BatchMode=yes "$SERVER" \
  "docker exec $CONTENITORE pg_dump -U illustrando -d illustrando --no-owner --no-privileges" > "$DUMP"
grep -q "PostgreSQL database dump complete" "$DUMP" || { echo "Il dump di produzione non è completo." >&2; exit 1; }

echo "3/3 · Sostituisco la base locale…"
psql -q "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -q -v ON_ERROR_STOP=1 "$DATABASE_URL" < "$DUMP" > /dev/null

echo "Fatto. La base locale ora è uguale alla produzione."
echo "Quella di prima è in $CARTELLA/locale-$ORA.sql.gz"
