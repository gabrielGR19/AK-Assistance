# Template Client Agent

Ein Minimal-Template, das du für neue Kunden kopieren und anpassen kannst.

Kurz: kopiere `config.template.json` nach `.env` oder `config.json` und fülle die Felder aus:

- `CRAFTWORKER_PHONE` — Telefonnummer des Handwerkers
- `WHATSAPP_API_TOKEN` — Meta/WhatsApp API Token
- `WHATSAPP_PHONE_NUMBER_ID` — Meta Phone Number ID
- `RETELL_API_KEY` — Retell.ai API Key
- `GOOGLE_CALENDAR_ID` — Google Calendar ID für Termine
- `SUPPORT_EMAIL` — Kontakt-E-Mail

Wichtig: Niemals `.env` ins Git committen. Benutze lokale Umgebungsvariablen oder Secrets im Deployment.
