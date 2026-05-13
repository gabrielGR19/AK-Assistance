# Claude Code Konfiguration — AK-Assistance

Dieser Ordner enthält alle Claude Code Konfigurationen für das AK-Assistance Projekt.

## Ordnerstruktur

```
.claude/
├── README.md              # Diese Datei
├── settings.local.json    # Lokale Permissions (nicht im Git)
├── commands/              # Skills / Slash-Commands
│   └── n8n-review.md     # /n8n-review — Workflow bauen + reviewen
├── hooks/                 # Hook-Dokumentation + Installationsanleitungen
│   └── auto-save.md      # Auto-Commit nach jedem Claude Edit
├── agents/                # Eigenständige KI-Agenten
│   └── README.md
└── subagents/             # Interne Hilfs-Agenten (Kontext sparen)
    └── README.md
```

---

## Setup nach dem Klonen

### 1. Skills installieren

Die Dateien in `commands/` können direkt als projektspezifische Slash-Commands genutzt werden — sie funktionieren automatisch, wenn Claude Code im Projektordner geöffnet wird.

Für **globale** Nutzung (in allen Projekten) die Dateien zusätzlich kopieren:
```bash
cp .claude/commands/*.md ~/.claude/commands/
```

### 2. Hook installieren

Der Auto-Save Hook läuft global. Anleitung: `.claude/hooks/auto-save.md`

Kurzversion — in `~/.claude/settings.json` unter `"hooks"` einfügen:
```bash
# Aktuelle settings.json anzeigen
cat ~/.claude/settings.json
```
Den JSON-Block aus `hooks/auto-save.md` einfügen.

Voraussetzung: `jq` installieren
```bash
brew install jq
```

### 3. Umgebungsvariablen

Aus `.env.example` eine `.env` Datei erstellen und ausfüllen:
```bash
cp .env.example .env
```

---

## Neue Skills hinzufügen

1. Neue Datei in `commands/<name>.md` erstellen
2. Format: Markdown-Datei mit klarem Trigger, Ablauf und Ausgabeformat
3. Committen — Partner zieht per `git pull` und hat den Skill sofort

## Neue Hooks hinzufügen

1. Dokumentation in `hooks/<name>.md` erstellen
2. Hook-Command testen
3. Installation per README beschreiben

---

## Conventions

- Alle Dateinamen auf Deutsch oder Englisch — kein Mischmasch
- Jeder Skill hat einen klaren **Trigger** (wann wird er eingesetzt?) und eine **Ausgabe** (was gibt er zurück?)
- Skills sind idempotent: mehrfaches Ausführen ändert nichts
