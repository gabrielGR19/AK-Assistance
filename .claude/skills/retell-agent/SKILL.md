---
name: retell-agent
description: Standard-Einstieg für JEDE Arbeit an Retell-Telefonagenten — Key aus ~/.retell-env laden, Verbindung verifizieren, erst dann Aussagen oder Änderungen. IMMER verwenden, wenn es um Telefonagenten, Retell, Anruf-Transkripte oder Voice-Agents geht — auch wenn Gabriel nur "schau dir den Agenten an" oder "prüfe die Retell-Anbindung" sagt.
---

# Retell-Agent: erst verbinden und verifizieren, dann reden

Warum: Am 21.07.2026 entstand die Falschaussage "kein aktiver Key gesetzt",
weil nur `.env` gegrept wurde — der Key liegt dokumentiert in
`~/.retell-env`. Dieser Skill macht den Einstieg deterministisch.

## Schritte

### 1. Zugang laden und live verifizieren

```bash
source ~/.retell-env   # enthält RETELL_API_KEY_GABRIEL
curl -s -H "Authorization: Bearer $RETELL_API_KEY_GABRIEL" \
  https://api.retellai.com/list-agents
```

- HTTP 200 + Agentenliste → arbeitsfähig. Alles andere → Fehler benennen
  und stoppen, keine Aussagen "aus Erinnerung".
- Der Key ist Gabriels eigener Lern-/Bau-Zugang ([[project_retell_api_gabriel]]).
  `.env`-Dateien werden nicht angefasst (Schutz-Hook).

### 2. Ist-Zustand zeigen, dann erst handeln

Vor jeder Aktion kurz ausgeben: welche Agenten existieren (Name, ID,
Nummer, Sprache/Stimme), welcher davon betroffen ist. Gabriel lernt das
Produkt — jede Session soll sichtbar machen, was da ist und was sich
gleich ändert.

### 3. Standard-Operationen (Retell-API)

- **Auflisten/Anzeigen:** `list-agents`, `get-agent/<id>` — Konfiguration
  (Prompt, Stimme, LLM, Webhook) lesbar zusammenfassen, nicht als
  Roh-JSON kippen.
- **Ändern:** `PATCH update-agent/<id>` — vorher Diff zeigen (alter Wert →
  neuer Wert), nachher per `get-agent` verifizieren.
- **Anrufe/Transkripte:** `list-calls` (gefiltert nach Agent), Transkripte
  für Qualitätsanalyse zusammenfassen: Was lief gut, wo brach das
  Gespräch, welche Prompt-Stelle verursachte es.
- Für alles Weitere: Retell-Doku live nachschlagen, nicht raten —
  die API ändert sich.

### 4. Guardrails (nicht verhandelbar)

- Keine echten Testanrufe an reale Nummern ohne Gabriels ausdrückliche
  Bestätigung im selben Gespräch.
- Keine Änderung an einem Agenten, der live für Kunden/Demo erreichbar
  ist, ohne Bestätigung — vorher sagen, welcher Agent live ist.
- Kein Löschen von Agenten; Kosten verursachende Aktionen (Anrufe,
  teure LLM-Konfigs) vorher mit Preis nennen.
- Nach Änderungen: kurzer Funktionsbeleg (get-agent zeigt neuen Stand)
  und — wenn verfügbar — /abnahme-Logik anwenden: was Gabriel selbst
  testen muss (echter Anruf), explizit sagen.
