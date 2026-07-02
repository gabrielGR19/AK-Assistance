---
name: wochen-status-update
description: 'Erstellt ein wöchentliches Status-Update für Moritz aus drei Quellen: Git-Commits im AK-Assistance Repo, n8n-Workflow-Status (Executions/Fehler) und der Leadliste (Google Sheet "Marktforschung ak-assistance"). Ausgabe als Klartext zum direkten Einfügen in den Google Workspace Chat. Auslöser: "Status-Update erstellen", "Wochenupdate für Moritz", "was ist diese Woche passiert", "Update für Moritz" — oder der wöchentliche Scheduled Task (sonntags 23:00 Uhr). IMMER diesen Skill verwenden, wenn ein wöchentliches Status-Update für Moritz erstellt werden soll.'
---

# Wöchentliches Status-Update — AK Assistance

Erzeugt ein kompaktes Update über die letzten 7 Tage aus drei Quellen. Ergebnis ist reiner Text, den Gabriel direkt in den gemeinsamen Google Workspace Chat mit Moritz einfügen kann — kein Versand durch Claude.

## Konfiguration

- **Repo:** `/Users/gabrieladam/AK-Assistance` (lokal gemountet, via Bash-Tool)
- **Google Sheet:** `Marktforschung ak-assistance`, Tabellenblatt1 (gleiche Quelle wie Skill `followup-email-sender`)
- **n8n-Workflows (relevant):** `call-started`, `call-ended`, `email-agent`, `blog-news-agent`
- **Zeitraum:** letzte 7 Tage (bei Scheduled-Task-Lauf: seit dem letzten Update, siehe Snapshot)
- **Snapshot zum Vorwoche-Vergleich:** `references/letzter-stand.json` (im selben Verzeichnis wie diese Datei)

---

## Workflow

### Schritt 1 — Git-Commits sammeln

Im Repo `/Users/gabrieladam/AK-Assistance` (Bash-Pfad ggf. über Mount-Mapping):

```
git log --all --since="7 days ago" --pretty=format:"%ad|%an|%s" --date=short
```

Gruppiere nach Autor (Gabriel / Moritz), fasse thematisch zusammen (nicht jeden Commit einzeln auflisten — sinnvoll bündeln, z. B. "Telefonagent: 3 Commits zu Anrufabbruch-Handling").

**Hinweis:** Falls `git pull` wegen Dateisystem-Rechten auf dem gemounteten Ordner fehlschlägt (bekanntes Sandbox-Problem, z. B. `.git/index.lock` lässt sich nicht entfernen) — nicht mehrfach erzwingen. Mit dem lokalen Stand weiterarbeiten und Gabriel am Ende kurz darauf hinweisen, dass er selbst `git pull` im Terminal ausführen sollte, damit Moritz' Änderungen sicher erfasst sind.

### Schritt 2 — n8n-Workflow-Status

Über n8n-mcp:
1. `n8n_list_workflows` → aktive/inaktive Workflows prüfen
2. `n8n_executions` (action=list, je Workflow-ID, letzte 7 Tage) → Anzahl erfolgreich vs. fehlgeschlagen

Fasse zusammen: Wie viele Ausführungen gesamt, wie viele Fehler, bei welchem Workflow. Bei Fehlern: kurz benennen, welcher Workflow betroffen ist (kein Deep-Dive, nur Flag).

### Schritt 3 — Leadliste / Google Sheets

Über Google Drive MCP:
```
search_files → query: "Marktforschung ak-assistance"
read_file_content → file_id aus Suchergebnis
```

Zähle aktuell:
- Gesamtzahl Leads
- Anzahl "Anruf Status" = angerufen
- Anzahl "Interesse" = Interesse / Unsicherheit
- Anzahl befüllte "Followup Emails" (Spalte H)

### Schritt 4 — Vorwoche vergleichen & Snapshot aktualisieren

- Prüfe, ob `references/letzter-stand.json` existiert.
- Falls ja: Differenz zu den aktuellen Zahlen aus Schritt 3 bilden (z. B. "+12 neue Leads seit letztem Update").
- Falls nein (erster Lauf): keine Differenz möglich, das einfach vermerken.
- Nach dem Erstellen des Updates: aktuelle Zahlen + Datum in `references/letzter-stand.json` schreiben (überschreiben), damit der nächste Lauf vergleichen kann.

Format der Snapshot-Datei:
```json
{
  "datum": "2026-07-01",
  "leads_gesamt": 0,
  "angerufen": 0,
  "interesse": 0,
  "followup_versendet": 0
}
```

### Schritt 5 — Text formatieren (Google-Chat-tauglich)

Google Chat unterstützt `*fett*` und `_kursiv_`, keine Markdown-Header, keine Tabellen. Entsprechend formatieren — siehe Ausgabeformat unten.

---

## Ausgabeformat (Beispiel)

```
*Status-Update AK Assistance — KW 27 (24.06.–01.07.2026)*

*Entwicklung*
• Gabriel: Telefonagent — Anrufabbruch-Handling überarbeitet (3 Commits)
• Moritz: Website — Blog-News-Agent Workflow angepasst

*Automatisierung (n8n)*
• 42 Ausführungen gesamt, 2 Fehler (email-agent — Google Sheets Timeout)
• Alle anderen Workflows fehlerfrei

*Akquise*
• Leads gesamt: 87 (+12 seit letztem Update)
• Angerufen: 34 (+5)
• Interesse: 9 (+2)
• Follow-up-Mails versendet: 6

*Nächste Schritte*
• [aus Kontext ableiten, sonst weglassen]
```

Nicht erfinden, was nicht aus den Quellen hervorgeht — "Nächste Schritte" nur befüllen, wenn sich aus Commits/Sheet klar etwas ableiten lässt, sonst Abschnitt weglassen.

---

## Fehlerbehandlung

- **Google Sheet nicht gefunden:** Abschnitt "Akquise" mit Hinweis "Leadliste nicht erreichbar" versehen, restliches Update trotzdem ausgeben.
- **n8n nicht erreichbar:** Abschnitt "Automatisierung" mit Hinweis versehen, restliches Update trotzdem ausgeben.
- **Git-Pull schlägt fehl:** siehe Hinweis in Schritt 1 — mit lokalem Stand weiterarbeiten, am Ende erwähnen.
- Grundsatz: ein fehlender Quellen-Zugriff blockiert nie das gesamte Update — fehlenden Abschnitt kennzeichnen und Rest liefern.

## Wichtige Hinweise

- Kein automatischer Versand — Ergebnis ist Text zum manuellen Einfügen in Google Chat.
- Am Ende immer kurz nennen, aus welchen Dateien/Quellen die Zahlen stammen (Repo-Pfad, Sheet-Name, n8n-Workflows).
- Snapshot-Datei nach jedem Lauf aktualisieren, sonst funktioniert der Vorwoche-Vergleich beim nächsten Mal nicht.
