# Claude Code Konfiguration — AK-Assistance

## Ordnerstruktur

```
.claude/
├── README.md              # Diese Datei
├── settings.local.json    # Lokale Permissions (nicht im Git!)
├── commands/              # Skills (Slash-Commands)
│   └── _TEMPLATE.md      # Vorlage für neue Skills
└── agents/                # KI-Agenten
    └── _TEMPLATE.md      # Vorlage für neue Agenten
```

## Skill-Format (commands/)

Jeder Skill ist eine `.md`-Datei mit YAML-Frontmatter:

```yaml
---
name: skill-name          # Pflicht. Kleinbuchstaben, Bindestriche, max 64 Zeichen.
description: Was er tut.   # Pflicht. Wann soll Claude ihn einsetzen?
allowed-tools: Read, Bash  # Optional. Schränkt verfügbare Tools ein.
model: sonnet              # Optional. sonnet | opus | haiku
---
```

Nach dem Frontmatter folgen die Anweisungen (unter 500 Zeilen).
Claude lädt nur `name` und `description` zum Matching —
der Rest wird erst bei Aktivierung gelesen.

## Agenten-Format (agents/)

Gleiches Frontmatter-Format. Zusätzlich enthalten Agenten:
Rolle, Eingabe, Ausgabe, Ablauf, Werkzeuge, Regeln.

## Neuen Skill oder Agenten anlegen

1. `_TEMPLATE.md` im jeweiligen Ordner kopieren
2. Frontmatter ausfüllen (name + description sind Pflicht)
3. Anweisungen schreiben
4. Committen — Moritz zieht per `git pull` und hat es sofort

## Model-Auswahl

| Model | Wann einsetzen |
|---|---|
| `opus` | Komplexe Aufgaben, tiefe Analyse, schwierige Logik |
| `sonnet` | Standard — gute Balance aus Qualität und Geschwindigkeit |
| `haiku` | Einfache, schnelle Aufgaben (Formatierung, Lookup) |
