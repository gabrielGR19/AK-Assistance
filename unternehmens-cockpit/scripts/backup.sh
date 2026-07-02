#!/usr/bin/env bash
# Tägliches Backup der Cockpit-JSON-DB. Kopiert data/cockpit.json mit Zeitstempel
# nach backups/ und behält die letzten BEHALTEN Stände. Für einen Cronjob gedacht.
#
# Cron (täglich 03:15), Pfad anpassen:
#   15 3 * * * /pfad/zu/unternehmens-cockpit/scripts/backup.sh >> /pfad/zu/backup.log 2>&1

set -euo pipefail

# Projektwurzel = übergeordneter Ordner dieses Skripts (funktioniert unabhängig vom Aufrufort).
WURZEL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QUELLE="$WURZEL/data/cockpit.json"
ZIEL_DIR="$WURZEL/backups"
BEHALTEN=30

if [ ! -f "$QUELLE" ]; then
  echo "Keine DB gefunden unter $QUELLE — nichts zu sichern."
  exit 0
fi

mkdir -p "$ZIEL_DIR"
STEMPEL="$(date +%Y%m%d-%H%M%S)"
cp "$QUELLE" "$ZIEL_DIR/cockpit-$STEMPEL.json"
echo "Backup erstellt: cockpit-$STEMPEL.json"

# Älteste Stände über das Limit hinaus entfernen (nur eigene Backup-Dateien).
ANZAHL="$(ls -1 "$ZIEL_DIR"/cockpit-*.json 2>/dev/null | wc -l | tr -d ' ')"
if [ "$ANZAHL" -gt "$BEHALTEN" ]; then
  ls -1t "$ZIEL_DIR"/cockpit-*.json | tail -n +"$((BEHALTEN + 1))" | while read -r alt; do
    rm -f "$alt"
    echo "Alt entfernt: $(basename "$alt")"
  done
fi
