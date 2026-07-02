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

## Live-Konnektoren (API-Prüfung pro Dienst)

Wird ab Schritt 5/7 befüllt: pro Dienst dokumentiert, ob eine read-only
Status-/Verbrauchs-/Kosten-API existiert, welcher Endpoint und welcher Scope.

| Dienst | Live-API vorhanden? | Endpoint | Scope | Status |
| ------ | ------------------- | -------- | ----- | ------ |
| Anthropic / Claude API | zu prüfen (Schritt 5) | `/v1/organizations/cost_report` (Admin-Key) | read-only Usage/Cost | offen |
| Retell.ai | zu prüfen (Schritt 7) | — | — | offen |
| Hetzner | zu prüfen (Schritt 7) | — | — | offen |
| IONOS | zu prüfen (Schritt 7) | — | — | offen |
| Google Workspace | zu prüfen (Schritt 7) | — | — | offen |
| Netlify | zu prüfen (Schritt 7) | — | — | offen |
| GitHub | zu prüfen (Schritt 7) | — | — | offen |
