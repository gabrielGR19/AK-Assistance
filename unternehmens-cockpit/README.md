# AK Assistance — Betriebs-Cockpit

Internes Ops-Dashboard: alle genutzten Dienste, Kosten (Monat/Jahr), Status und
Warnungen an einem Ort. Läuft lokal mit `npm run dev`, dauerhaft auf Hetzner.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript
- Persistenz: JSON-Datei unter `data/cockpit.json` (nicht im Git)
- Keine externen UI-Frameworks — plain CSS, Geist Sans + Geist Mono

## Lokal starten

```bash
npm install
npm run dev
# http://localhost:3000
```

## Datenhaltung

Die gepflegten Daten liegen in `data/cockpit.json`. Existiert die Datei nicht, wird
sie beim ersten Start aus dem Seed (`lib/seed.ts`) mit den 7 Diensten erzeugt —
alle Kostenfelder leer, von Gabriel selbst zu befüllen.

## Umgebungsvariablen (`.env.local`, nie committen)

Alle Keys ausschließlich in `unternehmens-cockpit/.env.local` (per `.gitignore` ausgeschlossen).
Werte werden nur serverseitig gelesen, nie ins Frontend serialisiert, nie geloggt.

| Variable | Zweck | Pflicht |
| -------- | ----- | ------- |
| `ANTHROPIC_ADMIN_KEY` | Admin-Key der Anthropic Console für den Cost-API-Live-Abruf des Claude-Guthabens. Ohne Key bleibt die manuelle Verbrauchseingabe als Fallback aktiv. | optional (nur für Live-Abruf) |
| `COCKPIT_PASSWORT` | Basic-Auth-Passwort (Schritt 6, Deployment) | erst bei Deployment |

Hinweis Cost-API: `amount` kommt in **kleinster Währungseinheit (Cent)** und wird durch 100 geteilt;
Währung immer USD. Restguthaben = Basis − Verbrauch ist **immer eine Schätzung**.

## Live-Konnektoren (API-Prüfung pro Dienst)

Wird ab Schritt 5/7 befüllt: pro Dienst dokumentiert, ob eine read-only
Status-/Verbrauchs-/Kosten-API existiert, welcher Endpoint und welcher Scope.

| Dienst | Live-API vorhanden? | Endpoint | Scope | Status |
| ------ | ------------------- | -------- | ----- | ------ |
| Anthropic / Claude API | ja (Doku bestätigt) | `GET https://api.anthropic.com/v1/organizations/cost_report` (Header `x-api-key` = Admin-Key, `anthropic-version: 2023-06-01`) | Admin-Key, read-only Usage/Cost | eingebaut — Live-Verifikation offen (Admin-Key nötig) |
| Retell.ai | zu prüfen (Schritt 7) | — | — | offen |
| Hetzner | zu prüfen (Schritt 7) | — | — | offen |
| IONOS | zu prüfen (Schritt 7) | — | — | offen |
| Google Workspace | zu prüfen (Schritt 7) | — | — | offen |
| Netlify | zu prüfen (Schritt 7) | — | — | offen |
| GitHub | zu prüfen (Schritt 7) | — | — | offen |
