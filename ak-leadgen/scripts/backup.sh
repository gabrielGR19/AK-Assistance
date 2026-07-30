#!/usr/bin/env bash
# Sichert data/leads.db per sqlite3 .backup, komprimiert sie und rotiert
# Backups älter als 14 Tage. Für Cron gedacht (siehe README).
set -euo pipefail

VERZEICHNIS="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PFAD="$VERZEICHNIS/data/leads.db"
BACKUP_VERZEICHNIS="$VERZEICHNIS/data/backups"
ZEITSTEMPEL="$(date +%Y-%m-%d_%H-%M-%S)"
BACKUP_DATEI="$BACKUP_VERZEICHNIS/leads_${ZEITSTEMPEL}.db"

if [ ! -f "$DB_PFAD" ]; then
  echo "Keine Datenbank unter $DB_PFAD gefunden - nichts zu sichern."
  exit 0
fi

mkdir -p "$BACKUP_VERZEICHNIS"

sqlite3 "$DB_PFAD" ".backup '$BACKUP_DATEI'"
gzip "$BACKUP_DATEI"

echo "Backup erstellt: ${BACKUP_DATEI}.gz"

# Rotation: Backups älter als 14 Tage löschen
find "$BACKUP_VERZEICHNIS" -name "leads_*.db.gz" -mtime +14 -delete

echo "Backup-Rotation abgeschlossen (Aufbewahrung: 14 Tage)."
