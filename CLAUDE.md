# CLAUDE.md — AK Assistance

Gabriels Globalregeln (Sprache, Legalität, Git, Deployments,
Karpathy-Prinzipien) stehen in `~/CLAUDE.md` und gelten hier vollständig,
sofern vorhanden. Für alle ohne diese Datei (z.B. Moritz) gelten
mindestens die Team-Regeln unten.

## Team-Regeln (gelten für jeden, der in diesem Repo arbeitet)

- Antworte auf Deutsch, Code-Kommentare auf Deutsch.
- **Git-Fluss:** Sessionstart = automatischer Pull (Hook), Sessionende =
  automatischer Push committeter Arbeit (Hook). Jede fertige
  Funktionseinheit sofort committen — nichts bleibt uncommitted liegen.
  Vor größeren Änderungen eigenen Branch erstellen. Gemergte Branches
  nie löschen.
- **Niemals direkt auf dem Server entwickeln oder Dateien ändern.**
  Der Server (Hetzner) wird ausschließlich über den /deploy-Skill
  beliefert und ist kein Arbeitsort (Hintergrund: Incident 2026-07-18,
  uncommitteter Server-Code wurde bei einem Deploy überschrieben).
- **Deployments nur über den /deploy-Skill** (.claude/skills/deploy/) —
  nie automatisch, immer mit Server-Stand-Prüfung, Diff und expliziter
  Bestätigung.
- **Secrets:** nur in .env/.env.local, niemals committen. Die
  Schutz-Hooks in .claude/hooks/ blockieren Änderungen an geschützten
  Dateien und fragen bei riskanten Server-/Git-Befehlen nach — nicht
  umgehen.
- Kein Push-Zugang für Server-Cronjobs: Es wird kein Deploy-Key mit
  Schreibrecht im GitHub-Repo hinterlegt (Entscheidung Gabriel,
  2026-07-19).
- Irreversible Aktionen (Löschen, Massenversand, DNS, Produktions-DB)
  immer bestätigen lassen. Unklar = nachfragen, nicht raten.

## Projekt

AK Assistance — Startup von Gabriel Adam und Moritz Koch.
Ziel: Handwerksbetriebe und andere Dienstleister digitalisieren.
Erstes Produkt: KI-Telefonagent.
Weitere Produkte: Marketing-Automatisierung, weitere Agenten, App.

## Zusammenarbeit

- Moritz Koch hat Repo-Zugriff und kann Änderungen gepusht haben —
  deshalb zu Sessionbeginn immer git pull (läuft automatisch via
  SessionStart-Hook in .claude/settings.json).
- Beide entwickeln lokal auf dem eigenen Rechner. Der Stand auf GitHub
  ist die einzige Quelle der Wahrheit; der Server pullt nur.

## Monorepo-Struktur

| Verzeichnis | Inhalt |
|---|---|
| `unternehmens-cockpit/` | Betriebs-Cockpit, Next.js 16 |
| `phone-agents/` | Telefonagent-Backend: Express + Anthropic SDK + Retell + WhatsApp |
| `website/` | ak-assistance.de, statisches HTML, deployed auf Hetzner VPS |
| `n8n-workflows/` | JSON-Exporte der n8n-Workflows (inkl. Blog-Agent) |
| `client-templates/` | Vorlagen für Kundenprojekte |
| `docs/`, `marketing/`, `assets/` | Doku, Marketing-Material, Medien |

## n8n

- Produktions-Instanz: n8n.ak-assistance.de (Zugriff via n8n-MCP).
- n8n v2.0: Workflow aktivieren = "Publish"-Button, kein Active-Toggle.
- Workflows erst bauen, dann unabhängig reviewen (/n8n-review).
- Workflow-Änderungen als JSON-Export in `n8n-workflows/` versionieren.
