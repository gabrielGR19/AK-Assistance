# Blog-Agent — verschoben

Die finale Version des Blog-Agenten (beide n8n-Workflows + Doku) liegt jetzt an
**einer** Stelle, um doppelte Pflege zu vermeiden:

➡️ **[`website/blog-agent/`](../../website/blog-agent/)**

Dort findest du:

| Datei | Inhalt |
|---|---|
| `blog-news-agent.json` | Workflow 1 — wöchentliche KI-News-Recherche → Artikel-Entwurf → Telegram-Freigabe |
| `blog-approval-handler.json` | Workflow 2 — Freigabe per Telegram-Button (Approve/Reject) |
| `README.md` | Vollständige Setup-Doku (Credentials, Data Table, Dry-Run-Test) |

> Dieser Ordner unter `n8n-workflows/` bleibt nur als Wegweiser bestehen.
> **Quelle der Wahrheit ist `website/blog-agent/`** — dort wird gepflegt und von dort
> wird in n8n importiert.
