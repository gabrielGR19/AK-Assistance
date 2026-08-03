# Retell Web-Call Demo — Huber Sanitärtechnik

Einseitige Landingpage für Kundentermine: Ein Klick startet einen
Live-Web-Call (Browser-Mikrofon) mit dem Retell-Agenten
`Max – Huber Sanitär Technik`.

## Aufbau

| Pfad | Zweck |
|---|---|
| `public/index.html`, `public/style.css` | Statisches Frontend, Brand-Farben Navy/Orange |
| `src/app.js` | Frontend-Logik, wird via esbuild nach `public/vendor/app.js` gebündelt |
| `netlify/functions/create-web-call.js` | Serverless-Function: prüft Zugangscode, erzeugt Web-Call-Token |
| `netlify.toml` | Build, Publish-Verzeichnis, `Permissions-Policy: microphone=(self)` |

**Sicherheitsprinzip:** Der Retell-API-Key liegt ausschließlich in der
Netlify-Umgebungsvariable `RETELL_API_KEY` und wird nur serverseitig
benutzt. Das Frontend erhält lediglich den `access_token` aus
`POST https://api.retellai.com/v2/create-web-call` — der gilt für genau
einen Anruf und verfällt 30 Sekunden nach Erstellung.

## Umgebungsvariablen

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `RETELL_API_KEY` | ja | Retell-API-Key (Server-seitig, nie im Frontend) |
| `ACCESS_CODE` | ja | Zugangscode, den Besucher vor dem Anruf eingeben |
| `RETELL_AGENT_ID` | nein | Überschreibt die fest hinterlegte Huber-Agent-ID |
| `RETELL_AGENT_VERSION` | nein | Nur nötig, wenn eine bestimmte Agent-Version erzwungen werden soll |

Nichts davon wird committet.

## Lokal testen

```bash
cd retell-webcall-demo
npm install
export RETELL_API_KEY="…"      # nicht in eine Datei schreiben
export ACCESS_CODE="…"
npm run dev                     # baut das Bundle und startet netlify dev
```

Seite läuft dann auf `http://localhost:8888` (bzw. dem angezeigten Port).
`localhost` gilt dem Browser als sicherer Kontext, deshalb funktioniert
die Mikrofon-Freigabe auch ohne HTTPS.

## Deployment

```bash
npm run build
netlify deploy --prod
```

Umgebungsvariablen vorher im Netlify-Dashboard unter
*Site configuration → Environment variables* setzen (oder per
`netlify env:set`). Nach jeder Änderung an den Variablen neu deployen.

## Betrieb

- Der Zugangscode ist eine niedrige Hürde gegen Fremdnutzung, kein Login.
  Nach dem Kundentermin am besten Code ändern oder die Site pausieren.
- Kosten entstehen erst, wenn ein Anruf tatsächlich zustande kommt;
  ein nur registrierter Call ohne Beitritt kostet nichts.
- Die Seite trägt `noindex, nofollow` und taucht damit nicht in
  Suchmaschinen auf.
