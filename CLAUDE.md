# CLAUDE.md — AK Assistance

## Sprache & Kommunikation

- Antworte immer auf Deutsch, unabhängig von der Eingabesprache.
- Kommentare im Code auf Deutsch.
- Direkt, sachlich, ohne Fülltext.
- Beginne jede Antwort mit "Gabriel," — ohne Ausnahme.
  Fehlt der Name: Warnsignal für nachlassende Kontextqualität →
  neue Session starten oder /rewind ausführen.

---

## Kontext-Management

- Bei 50–60 % Kontext-Auslastung: Gabriel aktiv darauf hinweisen
  und /compact empfehlen, bevor die Session-Qualität nachlässt.

---

## Projekt

AK Assistance — Startup von Gabriel Adam und Moritz Koch.
Ziel: Handwerksbetriebe und andere Dienstleister digitalisieren.
Erstes Produkt: KI-Telefonagent.
Weitere Produkte: Marketing-Automatisierung, weitere Agenten, App.

---

## Nicht verhandelbare Regeln

### Legalität

- Alle Aktionen müssen legal sein. Bei Unsicherheit: sofort stoppen,
  explizit nachfragen, bevor weitergearbeitet wird.
- Kein Scraping ohne robots.txt-Prüfung der Zielwebsite.
  Websites, die Scraping ausdrücklich verbieten, werden nicht gescrapt.
- Keine personenbezogenen Daten ohne klaren, dokumentierten
  Verwendungszweck speichern oder verarbeiten (DSGVO).
- Bei rechtlichen oder steuerlichen Fragen, die im Code-Kontext
  entstehen: explizit kennzeichnen und empfehlen, einen Fachanwalt
  oder Steuerberater hinzuzuziehen. Nicht selbst rechtlich bewerten.

### GitHub & Versionskontrolle

- Zu Beginn jeder Session: git pull —
  Moritz Koch hat Repo-Zugriff und kann Änderungen gepusht haben.
- Jede abgeschlossene Funktionseinheit committen.
  Kein funktionierendes Feature bleibt uncommitted.
- Commit-Messages auf Deutsch, beschreibend.
- Vor größeren Änderungen: neuen Branch erstellen,
  nie direkt auf main entwickeln.
- Niemals committen: .env, .env.*, .claude/settings.local.json,
  data/, *.log, API-Keys, Tokens, Passwörter.
- .gitignore muss von Anfang an korrekt konfiguriert sein.
- Getrackte Secrets prüfen:
  git ls-files | grep -iE "\.env|key|token|secret"

### Produktions-Deployments

- Vor jedem Deployment auf eine Live-Umgebung
  (Website, Server, DNS, Datenbank-Produktion):
  1. Aktuellen Stand prüfen: git status, git log, was ist live.
  2. Zeigen, was sich ändern wird — Diff oder klare Beschreibung.
  3. Explizite Bestätigung abwarten, bevor deployed wird.
- Niemals automatisch deployen, auch wenn der Auftrag es impliziert.

### Codequalität & Sicherheit

- Keine hardcodierten API-Keys oder Secrets — immer .env.
- Alle externen API-Calls mit Fehlerbehandlung (try/catch) absichern.
- Eingaben vor jedem Datenbankschreibvorgang validieren.
- settings.local.json enthält MCP-Credentials —
  darf niemals committed werden.

### Verifikation

- Vor Erstellung von Credentials, API-Keys oder Integrationen:
  zuerst live prüfen, ob bereits etwas Passendes existiert
  (z.B. n8n_manage_credentials list, .env auf vorhandene Keys prüfen).
- Niemals aus Erinnerung vorheriger Sessions annehmen,
  dass etwas existiert oder fehlt.
- Bei Unsicherheit: nachfragen, nicht raten.

---

## Arbeitsweise

1. Plan vor Code: Bei komplexen Features zuerst Plan vorlegen
   und bestätigen lassen. Plan Mode (Shift+Tab) aktiv nutzen.
2. Schritt für Schritt: Kleine, testbare Einheiten —
   keine mehrfachen großen Änderungen auf einmal.
3. Nicht im Kreis drehen: Nach zwei erfolglosen Versuchen
   Ursache analysieren und anderen Ansatz vorschlagen.
   Nie tiefer in eine falsche Richtung.
4. Fehler erklären: Immer die Ursache benennen,
   nicht nur den Fix liefern.
5. Irreversible Aktionen immer bestätigen lassen:
   Datenlöschung, Massenversand, Deployments, DNS-Änderungen.
6. Unklar = nachfragen. Nicht mit Annahmen weiterarbeiten.
