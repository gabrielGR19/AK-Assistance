# Setup-Anleitung: Lead Agent - Automatisierte E-Mails

## Was dieser Workflow macht

1. Lädt alle Zeilen aus deiner Google Sheets Leadliste
2. Filtert: **Anruf Status = "angerufen"** UND **Interesse = "Interesse" oder "Unsicherheit"**
3. Ruft die Website des Betriebs ab und sucht per Regex die relevanteste E-Mail-Adresse
4. Generiert eine personalisierte Nachfass-E-Mail via Claude (Bezug auf das Telefonat)
5. Sendet die E-Mail direkt über dein Gmail-Konto
6. Aktualisiert den Status in Google Sheets auf "E-Mail gesendet"

---

## Schritt 1: Workflow importieren

1. n8n öffnen → **Workflows** → **Import from file**
2. Datei wählen: `n8n-workflows/email-agent.json`
3. Workflow wird unter "Lead Agent - Automatisierte E-Mails" importiert

---

## Schritt 2: Google Sheets verbinden

### Credential einrichten
1. n8n → **Credentials** → **Add credential** → **Google Sheets OAuth2 API**
2. Google Account verbinden (das Account mit der Leadliste)
3. Credential benennen: `Google Sheets Account`

### Sheet-ID eintragen (2x im Workflow)
- Öffne deine Google Sheets Leadliste im Browser
- Die ID steht in der URL: `docs.google.com/spreadsheets/d/**HIER_STEHT_DIE_ID**/edit`
- Im Workflow bei beiden Google Sheets Knoten eintragen:
  - **"Leads aus Google Sheets laden"** → documentId
  - **"Status in Google Sheets aktualisieren"** → documentId
- Sheetname anpassen falls nötig (Standard: `Tabelle1`)

### Spaltenname prüfen
Der Workflow erwartet diese Spalten (exakt so geschrieben):
| Spalte | Wert zum Filtern |
|--------|-----------------|
| `Anruf Status` | `angerufen` |
| `Interesse` | `Interesse` oder `Unsicherheit` |
| `Website` | URL der Firmenwebsite |
| `Firmenname` | Name des Betriebs |
| `Branche` | Branche (optional) |
| `Beschreibung` | Kurzbeschreibung (optional) |

> Falls deine Spalten anders heißen: Im Filter-Knoten und Code-Knoten anpassen.

---

## Schritt 3: Gmail verbinden

1. n8n → **Credentials** → **Add credential** → **Gmail OAuth2 API**
2. Business-E-Mail-Konto verbinden (das Konto von dem gesendet werden soll)
3. Credential benennen: `Gmail - AK-Assistance Business`
4. Im Workflow-Knoten **"E-Mail senden"** dieses Credential auswählen

---

## Schritt 4: Claude API Key eintragen

Im Knoten **"Personalisierte E-Mail via Claude erstellen"**:
- Header `x-api-key` → Wert: deinen Anthropic API Key eintragen
- Alternativ: Umgebungsvariable `ANTHROPIC_API_KEY` in n8n hinterlegen und Wert auf `{{ $env.ANTHROPIC_API_KEY }}` ändern

---

## Schritt 5: Erster Test

### Empfehlung für die ersten Läufe:
Bevor du direkt sendest, ändere im Knoten **"E-Mail senden"**:
- `sendTo` → deine eigene E-Mail-Adresse eintragen
- So kannst du die generierten E-Mails zuerst prüfen

### Workflow ausführen:
1. Workflow öffnen → **Execute Workflow** (Play-Button)
2. Ergebnisse in der Execution-Ansicht prüfen
3. Beim Knoten **"E-Mail extrahieren"** prüfen: Welche E-Mail wurde gefunden?
4. Beim Knoten **"Claude-Antwort verarbeiten"** prüfen: Wie sieht der generierte Text aus?

---

## Häufige Probleme

**Website-Abruf schlägt fehl:**
- Der Knoten "Website abrufen" hat `continueOnFail: true` → der Workflow läuft weiter
- Wenn keine E-Mail gefunden wird, überspringt der IF-Knoten diesen Lead

**Keine E-Mail auf der Website:**
- Manche Betriebe verstecken E-Mails (Kontaktformular statt Adresse)
- In diesem Fall: E-Mail manuell in eine Spalte "E-Mail" in Google Sheets eintragen und den Knoten "E-Mail extrahieren" anpassen

**Falscher Betreff/Text:**
- Claude antwortet manchmal nicht als reines JSON → der Code-Knoten fängt das ab und nutzt den Rohtext
- Prompt im Code-Knoten "E-Mail extrahieren" anpassen falls nötig

**Filter greift nicht:**
- Spaltennamen müssen exakt stimmen (Groß-/Kleinschreibung, Leerzeichen)
- Werte müssen exakt stimmen: "angerufen", "Interesse", "Unsicherheit"

---

## Workflow anpassen (nach ersten Tests)

- **Versendung pausieren:** Workflow deaktivieren oder `sendTo` auf eigene Adresse setzen
- **Andere Filterwerte:** Im Knoten "Filter - Angerufen mit Interesse" anpassen
- **E-Mail-Vorlage ändern:** Im Knoten "E-Mail extrahieren" → `claudePrompt` Variable anpassen
- **HTML-E-Mail:** Im Gmail-Knoten `emailType` auf `html` ändern
