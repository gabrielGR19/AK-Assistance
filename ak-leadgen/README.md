# ak-leadgen

Eigenständiges CLI-Tool, das B2B-Leads über die Google Places API (New) zieht,
dauerhaft dedupliziert in SQLite ablegt und nur neue Leads in ein Google Sheet
anhängt.

## Setup (8 Schritte)

1. **Python 3.11+ installieren** (falls noch nicht vorhanden):
   ```
   brew install python@3.11
   ```

2. **Virtuelle Umgebung anlegen und Abhängigkeiten installieren:**
   ```
   cd ak-leadgen
   python3.11 -m venv venv
   ./venv/bin/pip install -r requirements.txt
   ```

3. **Google Cloud Projekt vorbereiten:** In der
   [Google Cloud Console](https://console.cloud.google.com/) ein Projekt wählen
   (oder anlegen) und folgende APIs aktivieren: **Places API (New)**,
   **Google Sheets API**, **Google Drive API**.

4. **API-Key für Places erzeugen:** APIs & Dienste → Anmeldedaten →
   API-Schlüssel erstellen, auf "Places API (New)" einschränken. Das ist
   `GOOGLE_MAPS_API_KEY`.

5. **Service-Account für Sheets anlegen:** APIs & Dienste → Anmeldedaten →
   Anmeldedaten erstellen → Dienstkonto. Nach dem Anlegen unter "Schlüssel"
   einen neuen JSON-Schlüssel erzeugen und herunterladen, z. B. als
   `service-account.json` im `ak-leadgen`-Ordner ablegen (wird durch
   `.gitignore` nie committet).

6. **Google Sheet anlegen und freigeben:** Ein neues Google Sheet erstellen,
   die im Service-Account-JSON enthaltene `client_email` als Editor
   freigeben. Die `SHEET_ID` steht in der URL zwischen `/d/` und `/edit`.

7. **`.env` anlegen:**
   ```
   cp .env.example .env
   ```
   und `GOOGLE_MAPS_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_FILE`, `SHEET_ID`
   eintragen.

8. **Config anpassen und ersten Lauf testen:** `config.yaml` mit den eigenen
   Regionen und Suchbegriffen befüllen, dann:
   ```
   ./venv/bin/python -m leadgen.main run --dry-run
   ```
   Zeigt Block-Zusammenfassungen, schreibt aber nichts in DB oder Sheet.
   Ohne `--dry-run` läuft der echte Lauf.

## Lauf auslösen

Normalfall: Doppelklick auf `Leads holen.command` im Finder. Öffnet ein
Terminal-Fenster, fragt vor dem echten Lauf kurz nach (verbraucht API-Calls
und schreibt ins Sheet), sichert vorher `data/leads.db` per `scripts/backup.sh`
und bleibt am Ende offen, damit die Zusammenfassung lesbar bleibt.

Für Sonderfälle (`--dry-run`, `--block`, `stats`, `sync-status`) das CLI direkt
nutzen, siehe unten.

## CLI

```
python -m leadgen.main run                      # Standardlauf
python -m leadgen.main run --dry-run            # API-Abfragen, aber kein Schreiben
python -m leadgen.main run --block "Bestatter"  # nur ein Suchblock
python -m leadgen.main sync-status              # Spalten G-K per place_id zurück in die DB
python -m leadgen.main stats                    # Bestand je Branche und Region
```

## Google Sheet — Spaltenschema (Tabellenblatt "Leads")

| Spalte | Inhalt |
|---|---|
| A | Firma |
| B | Branche |
| C | Website |
| D | Telefon |
| E | Ort |
| F | Bewertungen |
| G | Erreicht *(nur Nutzereingabe, Tool schreibt hier nie)* |
| H | Interesse |
| I | Lead-E-Mail |
| J | Termin |
| K | Notiz |
| L | Maps-Link |
| M | Gefunden am |
| N | place_id *(technischer Schlüssel für Rücksync, nicht anfassen)* |

Das Tool schreibt ausschließlich per `append_rows` (nie überschreiben, sortieren
oder löschen). Manuell eingetragene Werte in G–K überleben jeden weiteren Lauf.

## Google Sheet — Tabellenblatt "Meta"

Nach jedem echten Lauf (nicht bei `--dry-run`) schreibt das Tool zusätzlich eine
Zeile pro Monat mit dem kumulierten API-Call-Verbrauch: `Monat` (YYYY-MM),
`API-Calls`, `Aktualisiert am`. Anders als bei "Leads" wird diese Zeile bei
jedem Lauf im selben Monat überschrieben, nicht angehängt — es ist ein
Zählerstand, keine Einzelbeobachtung. Das Unternehmens-Cockpit liest dieses
Tabellenblatt, um den Monatsverbrauch gegen das kostenlose Kontingent der
Places API (1.000 Calls/Monat bei der hier genutzten Feldmaske) anzuzeigen.

## Tests

```
./venv/bin/python -m pytest tests/ -v
```

## Backup

`scripts/backup.sh` sichert `data/leads.db` per `sqlite3 .backup`, komprimiert
sie nach `data/backups/` und löscht Backups älter als 14 Tage.

Cron-Einträge (Beispiel, Pfade anpassen):
```
0 7 * * 1-5  cd /pfad/zu/ak-leadgen && ./venv/bin/python -m leadgen.main run
0 3 * * *    /pfad/zu/ak-leadgen/scripts/backup.sh
```

## Kostenbremse

`max_api_calls_pro_lauf` in `config.yaml` begrenzt die Places-API-Aufrufe pro
Lauf hart. `max_neue_leads_pro_lauf` begrenzt zusätzlich die Anzahl neuer
Leads, die pro Lauf ins Sheet geschrieben werden. Zusätzlich bricht `run` ab,
sobald der laufende Monat 900 Calls erreicht hat (Sicherheitsabstand zum
1.000er-Freikontingent) — noch bevor der erste API-Call dieses Laufs passiert.
