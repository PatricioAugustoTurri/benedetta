#!/usr/bin/env bash
#
# Copia di sicurezza del database di produzione, fuori dal server.
#
# Scarica un pg_dump della base `illustrando` dal server di Coolify e lo salva
# in questo Mac, compresso, in ~/Backups/benedetta/. Tiene gli ultimi 30 e
# cancella i più vecchi. Se il server si rompe, il database c'è ancora qui.
#
#   scripts/backup-produccion.sh
#
# Serve l'accesso SSH al server (la chiave di questo Mac). Per farlo ogni
# giorno da solo, vedi scripts/README.md.

set -euo pipefail

SERVER="root@187.127.70.109"
CONTENITORE="vcjetqncbcnu9cbvzqihgfkc"   # benedetta-db su Coolify
CARTELLA="${BACKUP_DIR:-$HOME/Backups/benedetta}"
TENERE=30

mkdir -p "$CARTELLA"
FILE="$CARTELLA/illustrando-$(date +%Y%m%d-%H%M%S).sql.gz"
PARZIALE="$FILE.parziale"

# Prima in un file a parte: un dump interrotto a metà non deve sembrare buono.
ssh -o BatchMode=yes "$SERVER" \
  "docker exec $CONTENITORE pg_dump -U illustrando -d illustrando --no-owner" | gzip > "$PARZIALE"

# Un dump vero finisce sempre con la chiusura di pg_dump.
if ! gzip -dc "$PARZIALE" | tail -5 | grep -q "PostgreSQL database dump complete"; then
  rm -f "$PARZIALE"
  echo "Il backup non è completo: niente salvato." >&2
  exit 1
fi
mv "$PARZIALE" "$FILE"

# Solo gli ultimi $TENERE.
ls -1t "$CARTELLA"/illustrando-*.sql.gz | tail -n +$((TENERE + 1)) | xargs -r rm -f

echo "Backup salvato: $FILE ($(du -h "$FILE" | cut -f1))"
