#!/bin/bash

echo "=== AK-Assistance Update ==="

# 1. Code aktualisieren
echo ""
echo "1. Code wird aktualisiert..."
git pull origin main || { echo "FEHLER: git pull fehlgeschlagen."; exit 1; }

# 2. Fehlende .env-Variablen prüfen
echo ""
echo "2. .env-Konfiguration wird geprüft..."
if [ ! -f .env ]; then
    echo "   WARNUNG: Keine .env-Datei gefunden."
    echo "   Bitte .env.example kopieren und ausfuellen: cp .env.example .env"
else
    MISSING=()
    while IFS= read -r line; do
        [[ "$line" =~ ^[A-Z_]+=.* ]] || continue
        KEY="${line%%=*}"
        grep -q "^${KEY}=" .env || MISSING+=("$KEY")
    done < .env.example

    if [ ${#MISSING[@]} -eq 0 ]; then
        echo "   Alle Keys vorhanden."
    else
        echo "   FEHLENDE KEYS in .env:"
        for key in "${MISSING[@]}"; do
            echo "   - $key"
        done
        echo "   Bitte diese Keys in .env.example nachschlagen und in .env eintragen."
    fi
fi

# 3. Dependencies aktualisieren (falls package.json geaendert)
echo ""
echo "3. Dependencies werden geprueft..."
if git diff HEAD@{1} --name-only 2>/dev/null | grep -q "package.json"; then
    echo "   package.json geaendert -- npm install wird ausgefuehrt..."
    npm install
else
    echo "   Keine Aenderungen an package.json."
fi

echo ""
echo "=== Update abgeschlossen ==="
