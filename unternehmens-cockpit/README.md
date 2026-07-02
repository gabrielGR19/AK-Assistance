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

## Passwortschutz (Basic Auth)

Der Zugang ist über `middleware.ts` mit Basic Auth geschützt. Der Schutz ist **nur aktiv,
wenn `COCKPIT_PASSWORT` in `.env.local` gesetzt ist** — lokal ohne Passwort bleibt das Cockpit
offen, produktiv (Passwort gesetzt) fragt der Browser beim Öffnen nach Zugangsdaten
(Benutzername beliebig, Passwort = `COCKPIT_PASSWORT`). Das Passwort wird nur serverseitig
geprüft, nie geloggt. Erst hinter HTTPS (Reverse-Proxy) einsetzen — Basic Auth überträgt das
Passwort sonst im Klartext.

## Deployment auf Hetzner

Kein automatisches Deployment. Vor jedem Deploy: aktuellen Stand prüfen, Änderung zeigen,
Bestätigung abwarten (siehe CLAUDE.md).

Voraussetzung: Node ≥ 20 und ein Prozessmanager (pm2) auf dem Server, der bereits laufende
Reverse-Proxy (nginx/Caddy) für ak-assistance.de.

```bash
# 1. Code auf den Server bringen (z. B. via git pull im Zielordner)
cd /pfad/zu/unternehmens-cockpit

# 2. .env.local auf dem SERVER anlegen (nie aus dem Repo — sie ist gitignored):
#    ANTHROPIC_ADMIN_KEY=sk-ant-admin...   (optional, nur Live-Abruf)
#    COCKPIT_PASSWORT=<starkes-passwort>   (Pflicht produktiv)

# 3. Abhängigkeiten + Produktions-Build
npm ci
npm run build

# 4. Mit pm2 starten (Port 3000, nur lokal — der Proxy terminiert HTTPS)
pm2 start "npm run start" --name cockpit
pm2 save
```

Reverse-Proxy (Beispiel nginx, eigene Subdomain `cockpit.ak-assistance.de`): Anfragen auf
`http://127.0.0.1:3000` weiterleiten, HTTPS am Proxy terminieren. Erst danach ist Basic Auth
sicher (Passwort sonst im Klartext übertragen).

Update-Deploy später: `git pull && npm ci && npm run build && pm2 restart cockpit`.

## Datenbank-Backup

`data/cockpit.json` ist die einzige Datenquelle — regelmäßig sichern. `scripts/backup.sh`
kopiert die Datei mit Zeitstempel nach `backups/` (gitignored) und behält die letzten 30 Stände.

```bash
# Manuell testen
./scripts/backup.sh

# Täglich per Cron (03:15), absoluten Pfad einsetzen:
15 3 * * * /pfad/zu/unternehmens-cockpit/scripts/backup.sh >> /pfad/zu/backup.log 2>&1
```

## Live-Konnektoren (API-Prüfung pro Dienst)

Wird ab Schritt 5/7 befüllt: pro Dienst dokumentiert, ob eine read-only
Status-/Verbrauchs-/Kosten-API existiert, welcher Endpoint und welcher Scope.

| Dienst | Live-API vorhanden? | Endpoint | Scope | Status |
| ------ | ------------------- | -------- | ----- | ------ |
| Anthropic / Claude API | ja (live verifiziert) | `GET https://api.anthropic.com/v1/organizations/cost_report` (Header `x-api-key` = Admin-Key, `anthropic-version: 2023-06-01`) | Admin-Key, read-only Usage/Cost | **verifiziert** — Live-Abruf liefert HTTP 200 + echte USD-Zahl |
| Retell.ai | zu prüfen (Schritt 7) | — | — | offen |
| Hetzner | zu prüfen (Schritt 7) | — | — | offen |
| IONOS | zu prüfen (Schritt 7) | — | — | offen |
| Google Workspace | zu prüfen (Schritt 7) | — | — | offen |
| Netlify | zu prüfen (Schritt 7) | — | — | offen |
| GitHub | zu prüfen (Schritt 7) | — | — | offen |
