# Phone Agent Core

Kernkomponenten des internen Telefon-Agenten. Enthält Adapter für Retell.ai Webhooks, n8n-Triggers und WhatsApp-Integration.

Struktur (Beispiel):
- `src/` — Agent runtime
- `skills/` — Claude-Prompts und Skills
- `hooks/` — Command-Hooks
- `config.example.json` — Beispielkonfiguration

Deployment: lokale Server oder Cloudflare Worker (siehe `agents/demo-agent` als Referenz).
