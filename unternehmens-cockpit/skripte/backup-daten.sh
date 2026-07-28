#!/bin/bash
# Tägliche Sicherung der Cockpit-Daten (kalender.json, cockpit.json).
#
# Warum es das gibt: data/ ist per .gitignore vom Repo ausgeschlossen und liegt nur auf dem
# Server. Ohne diesen Job entsteht eine Sicherung nur als Nebenprodukt eines Deploys — ein
# täglich genutzter Kalender braucht mehr.
#
# Installation auf dem Server (als root, einmalig):
#   crontab -e
#   15 3 * * * /root/unternehmens-cockpit/skripte/backup-daten.sh >> /root/backups/daten.log 2>&1
#
# Wiederherstellen: Datei aus /root/backups/daten/ nach /root/unternehmens-cockpit/data/
# kopieren und `pm2 restart unternehmens-cockpit`.

set -euo pipefail

QUELLE="${1:-/root/unternehmens-cockpit/data}"
ZIEL="${2:-/root/backups/daten}"
TAGE=14

if [ ! -d "$QUELLE" ]; then
  echo "$(date '+%F %T') FEHLER: Quellordner $QUELLE fehlt." >&2
  exit 1
fi

mkdir -p "$ZIEL"
STEMPEL=$(date '+%Y%m%d-%H%M%S')
ANZAHL=0

for datei in "$QUELLE"/*.json; do
  [ -e "$datei" ] || continue
  name=$(basename "$datei" .json)
  cp -p "$datei" "$ZIEL/${name}_${STEMPEL}.json"
  ANZAHL=$((ANZAHL + 1))
done

if [ "$ANZAHL" -eq 0 ]; then
  echo "$(date '+%F %T') WARNUNG: keine JSON-Dateien in $QUELLE gefunden." >&2
  exit 1
fi

# Ältere Sicherungen aufräumen — sonst läuft die Platte irgendwann voll.
find "$ZIEL" -name '*.json' -type f -mtime +$TAGE -delete

echo "$(date '+%F %T') $ANZAHL Datei(en) gesichert nach $ZIEL (Aufbewahrung: $TAGE Tage)."
