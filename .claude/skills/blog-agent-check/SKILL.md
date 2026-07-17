---
name: blog-agent-check
description: Prüft das Blog-Agent-Setup (Auto-Publish via GitHub) live gegen die n8n-Produktions-Instanz — Credentials, DataTable-Spalten, Workflows, Aktivierung, letzte Executions — und liefert eine ✅/❌-Checkliste mit konkreten nächsten Schritten. IMMER verwenden bei Fragen wie "läuft der Blog-Agent?", "Blog-Setup prüfen", "blog-agent-check", "warum kam kein Artikel?" oder wenn am Blog-Agent weitergearbeitet werden soll.
---

# Blog-Agent-Check

Ziel: Den tatsächlichen Live-Zustand des Blog-Agent-Setups feststellen —
nicht den erinnerten. Memory-Einträge und alte Checklisten sind
Momentaufnahmen; einzelne Schritte können längst erledigt oder wieder
kaputt sein. Deshalb: jeden Punkt live prüfen (Globalregel Verifikation).

Alle Prüfungen sind read-only. Reparaturen nur nach Befund und mit
Gabriels Bestätigung.

## Checkliste (live prüfen, der Reihe nach)

### 1. n8n erreichbar
`n8n_health_check`. Wenn nicht erreichbar: abbrechen und melden.

### 2. GitHub-Credential in n8n
`n8n_manage_credentials` (list): Existiert ein GitHub-Credential
(Header Auth, zuletzt "GitHub API")? Nur Existenz prüfen — ob der
Token gültig ist, zeigt Check 6.

### 3. DataTable `blog_archive`
`n8n_manage_datatable`: Spalten `meta_description`, `body_markdown`,
`article_filename` (alle String) vorhanden?

### 4. Workflows vorhanden
`n8n_list_workflows`: Existieren "Blog-News-Agent" und
"Approval-Handler" (Namen können leicht abweichen — nach "blog"
filtern)? Entsprechen sie inhaltlich den JSON-Exporten im Repo
(`n8n-workflows/` bzw. `website/blog-agent/`)? Bei Abweichung nur
melden, nicht ungefragt überschreiben.

### 5. Approval-Handler aktiv
Der Approval-Handler muss dauerhaft aktiv sein (n8n v2.0: published),
sonst laufen die Telegram-Buttons ins Leere.

### 6. Letzte Executions
`n8n_executions` für beide Workflows: letzte Läufe erfolgreich?
Fehlgeschlagene Executions kurz analysieren (welcher Node, welche
Ursache) — ein 401 im GitHub-Node heißt z. B. Token ungültig (Check 2
formal ok, faktisch kaputt).

## Ausgabe

```
## Blog-Agent-Check <Datum>

| # | Prüfung | Status | Befund |
|---|---------|--------|--------|
| 1 | n8n erreichbar | ✅/❌ | … |
| … | | | |

### Nächste Schritte
- <nur was tatsächlich offen ist, konkret und in Reihenfolge;
  manuelle Schritte (z. B. Token in GitHub-UI erzeugen) klar als
  "macht Gabriel" markieren>
```

Wenn alles grün ist: sagen, dass das Setup steht, und den nächsten
geplanten Lauf nennen (Schedule des News-Agents), statt künstlich
Arbeit zu erfinden.
