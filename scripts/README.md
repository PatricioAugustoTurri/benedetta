# Scripts

## `backup-produccion.sh`

Descarga una copia de la base de producción a este Mac, en
`~/Backups/benedetta/`, comprimida. Guarda las últimas 30. Necesita el acceso
SSH al servidor que ya tiene este Mac.

```bash
scripts/backup-produccion.sh
```

### Que se haga solo, todos los días

Con `launchd`, el programador de macOS. Corre a las 3 de la mañana; si el Mac
estaba apagado o dormido, corre cuando se prende.

```bash
cat > ~/Library/LaunchAgents/com.benedetta.backup.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.benedetta.backup</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string>
    <string>$PWD/scripts/backup-produccion.sh</string>
  </array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>$HOME/Backups/benedetta/backup.log</string>
  <key>StandardErrorPath</key><string>$HOME/Backups/benedetta/backup.log</string>
</dict></plist>
PLIST
launchctl load ~/Library/LaunchAgents/com.benedetta.backup.plist
```

Para sacarlo: `launchctl unload ~/Library/LaunchAgents/com.benedetta.backup.plist`.

Esto cubre el caso «se rompe el servidor». Para estar cubiertos también si se
pierde el Mac, conviene además activar los backups programados de Coolify
hacia un almacenamiento externo (S3, Backblaze B2, Cloudflare R2): en Coolify,
`benedetta-db` → Backups → agregar un destino S3.

## `traer-produccion.sh`

Reemplaza la base local por una copia de la de producción, para trabajar con
los datos reales. Antes guarda la local en `~/Backups/benedetta/locale-*.sql.gz`.
Pide confirmación y se niega a correr si `DATABASE_URL` no apunta a este Mac.
Nunca escribe en producción.

```bash
scripts/traer-produccion.sh
```

Para volver a la base local de antes:

```bash
gunzip -c ~/Backups/benedetta/locale-AAAAMMDD-HHMMSS.sql.gz | psql "$DATABASE_URL"
```

(después de vaciarla con `psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`).
