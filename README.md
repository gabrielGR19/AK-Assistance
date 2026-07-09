# AK-Assistance

Monorepo für die AK-Assistance-Infrastruktur: Website, Automatisierungen und Kundentools.

## Struktur

| Verzeichnis | Inhalt |
|---|---|
| `website/` | Statische Website (ak-assistance.de), Blog und Blog-Agent |
| `n8n-workflows/` | n8n-Automatisierungen (Blog-News-Agent, E-Mail-Agent, Call-Events) |
| `phone-agents/` | Telefon-Agent (Retell + Claude + WhatsApp) inkl. Demo |
| `unternehmens-cockpit/` | Betriebs-Cockpit (Next.js) |
| `marketing/` | Lead-Generierung und Marketing-Assets |
| `client-templates/` | Vorlagen für Kundenprojekte |
| `docs/` | Setup- und Betriebsdokumentation |
| `assets/` | Logos und geteilte Medien |

## Deployment

Die Website läuft als statisches HTML auf einem Hetzner-VPS. Deployment nur nach expliziter Bestätigung (siehe `CLAUDE.md`).

## Hinweise

- Secrets ausschließlich in `.env` — niemals committen.
- Arbeitsregeln und Konventionen: siehe [`CLAUDE.md`](./CLAUDE.md).
