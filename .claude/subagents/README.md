# Subagenten

Subagenten werden vom Hauptagenten (Claude) intern eingesetzt, um den Kontextfenster zu schonen.

## Prinzip

Ein Subagent bekommt eine eng definierte Aufgabe, analysiert sie und gibt dem Hauptagenten **nur das Minimum** zurück, das zur Lösung notwendig ist.

## Einsatzbereiche

- **Code-Review** — Prüft einen Codeabschnitt und gibt strukturierte Befunde zurück
- **Fehlersuche** — Analysiert Fehlermeldungen, liefert Ursache + relevante Zeilen
- **Kontextkomprimierung** — Filtert irrelevanten Kontext, spart Tokens

## Dateiformat

Jeder Subagent bekommt eine eigene Datei: `<name>-subagent.md`

Struktur pro Datei:
```
# Subagent: <Name>
## Auftrag (was er analysiert)
## Eingabe (was er bekommt)
## Ausgabe (was er zurückgibt — so minimal wie möglich)
## Prompt
```

## Status

| Subagent | Status | Datei |
|---|---|---|
| Code-Review | In Planung | — |
| Fehlersuche | In Planung | — |
