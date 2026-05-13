# CLAUDE.md — AK-Assistance

## Sprache & Kommunikation

- Antworte **immer auf Deutsch**, unabhängig von der Eingabesprache.
- Schreibe Kommentare im Code ebenfalls auf Deutsch.
- Kommuniziere direkt, sachlich und ohne Fülltext.

---

## Projektbeschreibung

**AK-Assistance** ist ein Startup von Gabriel Adam und Moritz Koch mit dem Ziel, das Handwerk vollständig zu digitalisieren.

Der Assistent übernimmt eingehende Anrufe, vereinbart Termine, beantwortet häufige Kundenfragen und entlastet damit Handwerker im stressigen Arbeitsalltag — damit sie sich auf ihre eigentliche Arbeit konzentrieren können, ohne wichtige Kundenanfragen zu verpassen.

### Roadmap

**Phase 1 — KI-Telefon-Agent**
- Anrufe entgegennehmen und Informationen aufnehmen
- Kundenfragen beantworten
- Automatisch WhatsApp-Nachrichten senden
- Kalendereinträge automatisch erstellen

**Phase 2 — Vollständige Digitalisierung**
Schrittweise Digitalisierung aller organisatorischen Abläufe im Handwerk mit KI.

**Phase 3 — Marketing-Automatisierung**
- Lokale Handwerksbetriebe automatisch identifizieren (Apify Scraping)
- Websites analysieren und bewerten
- Personalisierte Akquise-E-Mails generieren und versenden
- Workflow über n8n automatisiert triggern

### Geschäftsmodell

Gabriel installiert und konfiguriert das System direkt beim Kunden:
- **Einmalige Setupgebühr** für Installation und Konfiguration
- **Monatliches Abo** für laufenden Betrieb und Support

### Zielkunden

Kleine und mittelständische Handwerksbetriebe, z.B. Elektriker, Klempner, Maler, Schreiner.

### Inhaber

Gabriel Adam und moritz koch

---

## Technischer Stack

| Komponente | Technologie |
|---|---|
| Telefon-KI | Retell.ai |
| Sprachmodell | Claude API (Anthropic) |
| Automatisierung | n8n (lokal gehostet) |
| Messaging | WhatsApp Business API |
| CRM / Datenbank | Airtable oder Notion |
| Web-Scraping | Apify |
| Tunneling (lokal→extern) | ngrok |
| Versionskontrolle | GitHub |

---

## Nicht verhandelbare Regeln

### Legalität & Datenschutz
- **Alle Aktionen müssen in jeder Hinsicht legal sein.** Bei Unsicherheit: sofort stoppen und explizit nachfragen, bevor weitergearbeitet wird.
- **Kein Scraping ohne Prüfung der robots.txt** der Zielwebsite. Websites, die Scraping ausdrücklich verbieten, werden nicht gescrapt.
- **Keine personenbezogenen Daten** (Namen, E-Mail-Adressen, Telefonnummern von Privatpersonen) ohne klaren, dokumentierten Verwendungszweck speichern.
- **DSGVO-Konformität** hat Priorität: Daten nur so lange speichern wie nötig, keine unnötige Weitergabe an Dritte.
- Bei E-Mail-Outreach: Nur geschäftliche Kontakte von Unternehmen (keine Privatadressen), immer mit Abmeldemöglichkeit gemäß UWG.
- Bei rechtlichen oder steuerlichen Themen: klar kennzeichnen und Expertenkontakt empfehlen.

### GitHub & Versionskontrolle
- **Jede abgeschlossene Funktionseinheit wird committed.** Kein Feature bleibt uncommitted, wenn es funktioniert.
- **Commit-Messages auf Deutsch**, beschreibend und nachvollziehbar (z.B. `Apify-Scraper Grundstruktur hinzugefügt`).
- **Vor größeren Änderungen:** neuen Branch erstellen, nie direkt auf `main` entwickeln.
- **Niemals ins Repository committen:** API-Keys, Passwörter, `.env`-Dateien, temporäre Daten (`/data/`).
- `.gitignore` muss von Beginn an korrekt konfiguriert sein.
- Ziel: Jederzeit auf einen funktionierenden Stand zurückrollen können.

### Codequalität & Sicherheit
- Keine hartcodierten API-Keys oder Secrets im Code — immer `.env`-Datei verwenden.
- Alle externen API-Calls mit Fehlerbehandlung (try/catch) absichern.
- Vor jedem Datenbankschreibvorgang: Eingabe validieren.
- Kein Code in Produktion ohne vorherige Validierung der Kernlogik.

### Verhalten bei Unsicherheit
- Wenn eine Anforderung unklar ist: **nachfragen, nicht raten.**
- Wenn eine Aktion potenziell irreversibel ist (Datenlöschung, Massenversand, Produktions-Deployment): explizit bestätigen lassen.

---

## Arbeitsweise

- **Plan vor Code:** Bei neuen Features zuerst den Plan beschreiben und bestätigen lassen, dann implementieren.
- **Schritt für Schritt:** Keine mehrfachen großen Änderungen auf einmal — lieber kleine, testbare Einheiten.
- **Keine vollständige Blaupause** ohne Rückfrage bei komplexen Aufgaben.
- **Fehler erklären:** Bei Fehlern immer die Ursache erläutern, nicht nur den Fix liefern.

---

## Subagenten-Strategie

Subagenten werden auf ausdrückliche Aufforderung eingesetzt, um den Hauptagenten zu entlasten:

**Einsatzbereiche:**
- **Code-Review:** Ein Subagent prüft einen definierten Codeabschnitt auf Qualität, Sicherheit und Logikfehler — gibt dem Hauptagenten nur eine strukturierte Zusammenfassung der Befunde zurück.
- **Fehlersuche:** Ein Subagent analysiert Fehlermeldungen und relevante Codezeilen — liefert dem Hauptagenten nur die relevanten Zeilen und die wahrscheinliche Ursache, nicht den gesamten Kontext.
- **Kontextkomprimierung:** Irrelevanter Kontext wird durch Subagenten gefiltert und komprimiert, bevor er an den Hauptagenten weitergegeben wird — spart Kontextfenster und erhöht die Genauigkeit.

**Regel:** Subagenten geben dem Hauptagenten immer nur das Minimum an Information zurück, das zur Lösung der Aufgabe notwendig ist.

---

## Projektstruktur (Referenz)

```
ak-assistance/
├── CLAUDE.md               # Diese Datei
├── .env                    # API-Keys (nicht ins Git!)
├── .gitignore
├── agents/                 # KI-Agenten (Scraping, E-Mail, etc.)
├── workflows/              # n8n-Workflow-Exporte
├── scripts/                # Hilfsskripte
├── data/                   # Temporäre Daten (nicht ins Git!)
└── docs/                   # Dokumentation
```

---

## Aktuelle Prioritäten

1. **Marketing-Agent:** Lokale Handwerksbetriebe scrapen (Apify) → Website analysieren → personalisierte Akquise-E-Mail generieren
2. **n8n-Integration:** Workflow für automatisierten Trigger des Marketing-Agenten (via ngrok-Webhook)
3. **Retell.ai + Claude API:** Telefon-Agent konfigurieren und testen
