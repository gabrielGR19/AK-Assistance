#!/usr/bin/env bash
# Doppelklick-Starter für einen echten ak-leadgen-Lauf. Fragt vorher nach,
# sichert die Lead-DB und lässt das Terminal-Fenster danach offen, damit die
# Zusammenfassung lesbar bleibt (auch im Fehlerfall).
set -euo pipefail

VERZEICHNIS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$VERZEICHNIS"

trap 'echo; read -r -p "Fenster schließen mit Enter... " _ || true' EXIT

if [ ! -x "venv/bin/python" ]; then
  echo "Fehler: venv/bin/python nicht gefunden."
  echo "Setup-Schritt 2 aus README.md ausführen (venv anlegen, Abhängigkeiten installieren)."
  exit 1
fi

echo "Echter Lauf: verbraucht Google-API-Calls und schreibt neue Leads ins Sheet."
read -r -p "Fortfahren? [j/n] " antwort
case "$antwort" in
  j|J) ;;
  *) echo "Abgebrochen."; exit 0 ;;
esac

./scripts/backup.sh

./venv/bin/python -m leadgen.main run
