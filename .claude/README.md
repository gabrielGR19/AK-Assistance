# Claude Code Konfiguration — AK-Assistance

## Ordnerstruktur

```
.claude/
├── README.md              # Diese Datei
├── settings.local.json    # Lokale Permissions (nicht im Git!)
└── skills/                # Agent Skills
    └── <skill-name>/      # Jeder Skill = ein Verzeichnis
        ├── SKILL.md        # Pflicht. Frontmatter + Anweisungen.
        └── references/     # Optional. Zusätzliche Dateien.
```

## Skill erstellen

1. Verzeichnis anlegen: `.claude/skills/<mein-skill>/`
2. `SKILL.md` darin erstellen (Vorlage: `_vorlage/SKILL.md` kopieren)
3. Frontmatter + Anweisungen schreiben
4. Claude Code neu starten — Skill ist sofort verfügbar
5. Committen — Moritz zieht per `git pull` und hat es auch

## SKILL.md Format

```yaml
---
name: mein-skill            # Pflicht. Kleinbuchstaben, Bindestriche, max 64 Zeichen.
description: Was er tut.    # Pflicht. Wann soll Claude ihn einsetzen?
allowed-tools: Read, Bash   # Optional. Schränkt verfügbare Tools ein.
model: sonnet               # Optional. sonnet | opus | haiku
---

Anweisungen hier. Unter 500 Zeilen halten.
Bei größeren Skills auf Dateien im selben Verzeichnis verlinken.
```

**Wichtig:**
- `name` und `description` sind Pflicht — alles andere optional
- Claude lädt nur Name + Description zum Matching
- Der volle Inhalt wird erst bei Aktivierung gelesen
- `allowed-tools` schränkt ein, welche Tools Claude nutzen darf
- Für größere Skills: `references/`, `scripts/` im Skill-Verzeichnis ablegen

## Skill-Ebenen (Priorität)

| Ebene | Pfad | Geltungsbereich |
|---|---|---|
| Persönlich | `~/.claude/skills/<name>/SKILL.md` | Alle deine Projekte |
| Projekt | `.claude/skills/<name>/SKILL.md` | Nur dieses Repo (geteilt via Git) |

Bei Namenskonflikten: Persönlich > Projekt > Plugins.

## Model-Auswahl

| Model | Wann einsetzen |
|---|---|
| `opus` | Komplexe Aufgaben, tiefe Analyse, schwierige Logik |
| `sonnet` | Standard — gute Balance aus Qualität und Geschwindigkeit |
| `haiku` | Einfache, schnelle Aufgaben (Formatierung, Lookup) |
