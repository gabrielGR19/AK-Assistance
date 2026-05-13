# Hook: Auto-Save zu GitHub

## Was er tut

Nach jedem `Write`- oder `Edit`-Tool-Aufruf von Claude:
1. Erkennt die geänderte Datei und das zugehörige Git-Repository
2. Staged die Datei (`git add`)
3. Committet mit Timestamp (`Auto-save: dateiname - YYYY-MM-DD HH:MM`)
4. Pusht automatisch zum Remote

## Installation

Diesen Block in `~/.claude/settings.json` unter `"hooks"` einfügen:

```json
"PostToolUse": [
  {
    "matcher": "Write|Edit",
    "hooks": [
      {
        "type": "command",
        "statusMessage": "Auto-saving to GitHub...",
        "command": "jq -r '.tool_input.file_path // empty' | { read -r f || exit 0; d=$(dirname \"$f\"); root=$(git -C \"$d\" rev-parse --show-toplevel 2>/dev/null) || exit 0; git -C \"$root\" add \"$f\"; git -C \"$root\" diff --cached --quiet && exit 0; git -C \"$root\" commit -m \"Auto-save: $(basename \"$f\") - $(date '+%Y-%m-%d %H:%M')\"; git -C \"$root\" push 2>/dev/null || true; }"
      }
    ]
  }
]
```

## Voraussetzungen

- `jq` installiert (`brew install jq`)
- Git-Repository mit konfiguriertem Remote (`git remote -v`)
- SSH-Key oder Token für GitHub-Push hinterlegt

## Hinweis

Der Hook läuft global für alle Projekte. Nur Dateien in Git-Repos werden committed — außerhalb von Git passiert nichts.
