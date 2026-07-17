# CLAUDE.md — AK Assistance

Globalregeln (Sprache, Legalität, Git, Deployments, Karpathy-Prinzipien)
stehen in `~/CLAUDE.md` und gelten hier vollständig.
Diese Datei enthält nur Projektwissen.

## Projekt

AK Assistance — Startup von Gabriel Adam und Moritz Koch.
Ziel: Handwerksbetriebe und andere Dienstleister digitalisieren.
Erstes Produkt: KI-Telefonagent.
Weitere Produkte: Marketing-Automatisierung, weitere Agenten, App.

## Zusammenarbeit

- Moritz Koch hat Repo-Zugriff und kann Änderungen gepusht haben —
  deshalb zu Sessionbeginn immer git pull (Globalregel, hier besonders wichtig).

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
