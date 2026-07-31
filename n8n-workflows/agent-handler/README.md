# AK Telefonagenten — n8n-Struktur

Ein Handler für alle Telefonagenten, eine Config-Quelle, ein Antwortformat.
Die Retell-Agenten **2 (Assistenz)**, **3 (Rezeption)** und **4 (Leitstelle)**
rufen ausschließlich `ak-agent-handler` auf. **Agent 1 (Empfang) wird nicht
angebunden** — der hat keine Function Calls.

```
Retell Agent 2/3/4
      │  POST /webhook/ak-agent-handler   Header: X-AK-Auth
      ▼
┌─────────────────────────────────────────────────────────┐
│ ak-agent-handler                                        │
│  1. Auth (X-AK-Auth gegen $env.AK_WEBHOOK_SECRET) → 401 │
│  2. Validierung (kunde_id, agent_typ, action)           │
│  3. Kunden-Config laden (DataTable ak_kunden_config)    │
│  4. Router (action)                                     │
│  5. Antwort { success, data, message } + Log            │
└─────────────────────────────────────────────────────────┘
      │ Execute Workflow, immer mit kunde_id + geladener Config
      ▼
ak-sub-identify_caller        ak-sub-send_sms
ak-sub-check_availability     ak-sub-notify_dispatch ──┐
ak-sub-book_appointment       ak-sub-system_query      │ ruft bei
ak-sub-reschedule_appointment                          │ dispatch_kanal=sms
ak-sub-cancel_appointment     ak-sub-send_sms ◄────────┘
```

## Schnittstelle

**Request** — `POST https://n8n.ak-assistance.de/webhook/ak-agent-handler`

```json
{
  "kunde_id": "muster-bau",
  "agent_typ": "rezeption",
  "action": "check_availability",
  "params": { "terminart": "besichtigung", "zeitraum_von": "2026-08-03" }
}
```

Header `X-AK-Auth: <Secret>` ist Pflicht. Fehlt er oder stimmt er nicht:
HTTP 401, `{ "success": false, "data": {}, "message": "unauthorized" }` —
ohne jede weitere Verarbeitung.

**Response** — immer, ausnahmslos, auch bei jedem Fehler:

```json
{ "success": true, "data": { }, "message": "termine gefunden" }
```

`success` ist die einzige Weiche, auf die ein Agent seine Erfolgs- und
Fehlerzweige bauen soll. `message` ist kurz und kleingeschrieben, damit der
Agent sie notfalls vorlesen kann, ohne dass es technisch klingt.

### Actions

| action | params | data bei Erfolg |
|---|---|---|
| `identify_caller` | `telefon` | `ist_bekannt`, `name`, `kundenstatus`, `letztes_anliegen`, `vorgeschichte_notiz` |
| `check_availability` | `terminart`, `zeitraum_von`, `zeitraum_bis` | `verfuegbare_zeiten` (max. 5), `anzahl`, `zeitzone` |
| `book_appointment` | `name`, `start` (ISO), `telefon`, `email`, `anliegen` | `buchung_erfolgreich`, `bestaetigungsnummer`, `start` |
| `reschedule_appointment` | `neue_zeit` (ISO) + `referenz` **oder** `telefon` **oder** `name` | `verschoben`, `bestaetigungsnummer`, `alter_termin` |
| `cancel_appointment` | `referenz` **oder** `telefon` **oder** `name`, `grund` | `storniert`, `bestaetigungsnummer` |
| `send_sms` | `telefon`, `textvorlage`, `werte` | `gesendet`, `sid`, `status` |
| `notify_dispatch` | `name`, `telefon`, `ort`, `anliegen` | `alarmiert`, `kanal` |
| `system_query` | `system` + beliebige weitere Felder | Antwort des Kundensystems, unverändert |

Unbekannte `action` → `{ success: false, message: "unknown action" }`.

## Einrichtung

### 1. Umgebungsvariablen (auf dem n8n-Server, nicht im Workflow)

| Variable | Zweck |
|---|---|
| `AK_WEBHOOK_SECRET` | Secret für den Header `X-AK-Auth`. Ohne diese Variable lehnt der Handler **jede** Anfrage ab — das ist Absicht. |

Setzen in der n8n-Umgebung (docker-compose `environment:` oder `.env` des
Containers), danach n8n neu starten. Prüfen: `docker exec <container> env | grep AK_`.

Der Code-Node liest die Variable über `$env`. Falls in eurer Instanz
`N8N_BLOCK_ENV_ACCESS_IN_NODE=true` gesetzt ist, muss das auf `false`
stehen, sonst ist das Secret im Node nicht lesbar.

### 2. Credentials (n8n-Credential-Store, nie im Node)

Beim ersten Öffnen der Workflows sind diese Credentials rot markiert und
müssen einmal ausgewählt werden — im Repo stehen bewusst nur Platzhalter-IDs.

| Credential | Typ | Verwendet in |
|---|---|---|
| `Cal.com API` | Header Auth, Name `Authorization`, Wert `Bearer cal_live_…` | 03, 04, 05, 06 |
| `Twilio API` | Basic Auth, Benutzer = Account SID, Passwort = Auth Token | 07 |
| `CRM API` | Header Auth (nur bei `crm_typ: http` bzw. `system_query`) | 02, 09 |
| `Google Sheets account 2` | vorhanden | 02 (`crm_typ: sheets`) |
| `Telegram account` | vorhanden | 08 |
| `Gmail account Agent` | vorhanden | 08 |

### 3. DataTables anlegen

n8n → **Data Tables** → *Create*. Beide Tabellen sind Pflicht.

**`ak_kunden_config`** — eine Zeile pro Kunde:

| Spalte | Typ | Pflicht | Beispiel |
|---|---|---|---|
| `kunde_id` | String | ja | `muster-bau` |
| `kunde_name` | String | – | `Muster Bau GmbH` |
| `aktiv` | Boolean | ja | `true` |
| `zeitzone` | String | – | `Europe/Berlin` (Standard) |
| `kalender_typ` | String | – | `calcom` |
| `cal_api_base` | String | – | `https://api.cal.com/v2` (Standard) |
| `cal_event_type_id` | String | für Termine | `1234567` |
| `cal_username` | String | – | `muster-bau` |
| `buchung_platzhalter_email` | String | für Termine | `termine@muster-bau.de` |
| `sms_from` | String | für SMS | `+4915112345678` |
| `twilio_account_sid` | String | für SMS | `AC…` |
| `crm_typ` | String | – | `sheets`, `http` oder `none` |
| `crm_quelle` | String | – | Sheet-ID oder HTTPS-URL |
| `crm_blatt` | String | – | `Tabelle1` |
| `dispatch_kanal` | String | für Notfall | `sms`, `telegram` oder `email` |
| `dispatch_ziel` | String | für Notfall | Nummer, Chat-ID oder E-Mail |
| `system_endpoints` | String (JSON) | – | `{"auftragsstatus":"https://erp.kunde.de/api/status"}` |
| `sms_vorlagen` | String (JSON) | – | siehe unten |

`sms_vorlagen` — Platzhalter werden serverseitig gefüllt, der Agent liefert
nur Werte:

```json
{
  "terminbestaetigung": "Hallo {{name}}, Ihr Termin am {{zeitpunkt}} ist bestätigt. {{betrieb}}",
  "notfall": "NOTFALL {{betrieb}}: {{anrufer}}, Rückruf {{telefon}}. {{anliegen}}"
}
```

**`ak_agent_log`** — eine Zeile pro Anfrage:

| Spalte | Typ |
|---|---|
| `ts` | String |
| `request_id` | String |
| `kunde_id` | String |
| `agent_typ` | String |
| `action` | String |
| `call_id` | String |
| `success` | Boolean |
| `dauer_ms` | Number |
| `message` | String |

Bewusst **ohne** Gesprächsinhalte, Namen oder Telefonnummern.

### 4. Workflows importieren und verdrahten

1. Alle zehn JSONs importieren (n8n → *Import from File*), Reihenfolge egal.
2. Die neun `ak-sub-*`- und `ak-health`-Workflows **speichern** — dabei
   vergibt n8n je eine Workflow-ID (steht in der URL).
3. In `ak-agent-handler` die acht `Sub …`-Nodes öffnen und den jeweiligen
   Sub-Workflow auswählen. Im JSON stehen dort Platzhalter (`ID_BOOK_APPOINTMENT`
   usw.), die genau so ersetzt werden:

   | Node im Handler | Sub-Workflow |
   |---|---|
   | `Sub identify_caller` | `ak-sub-identify_caller` |
   | `Sub check_availability` | `ak-sub-check_availability` |
   | `Sub book_appointment` | `ak-sub-book_appointment` |
   | `Sub reschedule_appointment` | `ak-sub-reschedule_appointment` |
   | `Sub cancel_appointment` | `ak-sub-cancel_appointment` |
   | `Sub send_sms` | `ak-sub-send_sms` |
   | `Sub notify_dispatch` | `ak-sub-notify_dispatch` |
   | `Sub system_query` | `ak-sub-system_query` |

4. In `ak-sub-notify_dispatch` zusätzlich den Node `SMS-Workflow aufrufen`
   auf `ak-sub-send_sms` zeigen lassen (Platzhalter `ID_SEND_SMS`).
5. Erst `ak-agent-handler` und `ak-health` aktivieren (Publish). Die
   Sub-Workflows brauchen **keine** Aktivierung — sie werden aufgerufen,
   nicht getriggert.

### 5. Retell-Agenten anbinden

Pro Agent ein Custom-Function-Tool je Action:

- **URL:** `https://n8n.ak-assistance.de/webhook/ak-agent-handler`
- **Method:** POST
- **Header:** `X-AK-Auth: <AK_WEBHOOK_SECRET>`
- **Body:** `kunde_id` und `agent_typ` fest verdrahtet, `action` fest,
  nur `params` kommt aus dem Gespräch.

```json
{
  "kunde_id": "muster-bau",
  "agent_typ": "rezeption",
  "action": "book_appointment",
  "params": { "name": "{{name}}", "start": "{{start}}", "telefon": "{{telefon}}" }
}
```

`kunde_id` gehört **nicht** in die Hand des Sprachmodells — sonst kann ein
Anrufer sie im Gespräch beeinflussen.

## Neuen Kunden anlegen

1. Cal.com: Event-Type anlegen, ID notieren.
2. Optional Twilio-Nummer, CRM-Quelle, Bereitschaftskontakt klären.
3. In `ak_kunden_config` eine Zeile anlegen, `aktiv = true`.
4. Retell-Agenten kopieren, in den Function-Tools `kunde_id` eintragen.
5. Testen — ohne echten Anruf:

```bash
curl -s -X POST https://n8n.ak-assistance.de/webhook/ak-agent-handler \
  -H "X-AK-Auth: $AK_WEBHOOK_SECRET" -H "Content-Type: application/json" \
  -d '{"kunde_id":"muster-bau","agent_typ":"rezeption","action":"check_availability","params":{}}'
```

Erwartet: `{"success":true,"data":{"verfuegbare_zeiten":[...]},...}`.
Gegenprobe ohne Header muss 401 liefern, mit falscher `kunde_id`
`unknown kunde_id`.

**Kein Workflow muss dafür angefasst werden.** Wenn doch, ist etwas falsch
konfiguriert — nicht den Workflow anpassen, sondern die Config.

## Mandantentrennung

Die harte Regel: eine Anfrage für Kunde A darf Kalender, Nummer oder Daten
von Kunde B nicht berühren. Umgesetzt an vier Stellen:

1. **Eine Config-Quelle.** `ak_kunden_config` wird einmal im Handler
   gelesen; jeder Sub-Workflow bekommt sie mitgegeben und ermittelt nichts
   selbst.
2. **Kein Fallback.** Unbekannte oder inaktive `kunde_id` bricht ab. Es gibt
   keinen Default-Kunden, auch nicht zum Testen.
3. **Config schlägt Parameter.** `cal_event_type_id`, `sms_from` und
   `dispatch_ziel` stammen ausschließlich aus der Config. Schickt ein Agent
   dieselben Felder in `params` mit, werden sie ignoriert.
4. **Prüfung vor dem Schreiben.** `reschedule` und `cancel` prüfen, dass die
   gefundene Buchung zum Event-Type dieses Kunden gehört, bevor sie
   verschieben oder stornieren.

## Betrieb

- **Health-Check:** `GET https://n8n.ak-assistance.de/webhook/ak-health` →
  `{"success":true,...}`. Für Uptime-Monitoring geeignet, ohne Auth und ohne
  Kundendaten.
- **Timeouts:** 15 s pro externem Call (System-Abfrage 10 s). Danach
  `success: false` — der Agent hängt nie.
- **Retries:** einmalig auf lesende Calls. **Kein Retry** auf `book`,
  `reschedule`, `cancel` und `send_sms` — ein zweiter Versuch würde doppelt
  buchen oder doppelt senden.
- **Logging:** `ak_agent_log`, eine Zeile pro Anfrage. Das Logging läuft
  *nach* der Antwort an Retell, kostet also keine Gesprächszeit und kann
  eine Antwort nicht kaputtmachen.
- **Fehlersuche:** In n8n unter *Executions* nach `ak-agent-handler`
  filtern; die `request_id` aus dem Log verbindet Handler und Sub-Workflow.

## Grenzen (bewusst so)

- **Ein Cal.com-Konto für alle Kunden**, getrennt über `cal_event_type_id`.
  Braucht ein Kunde ein eigenes Cal.com-Konto, geht das nicht über die
  Config: n8n kann Credentials nicht dynamisch pro Datensatz wählen. Dann
  `ak-sub-book_appointment` kopieren, eigenes Credential setzen und den Klon
  im Handler-Router eintragen. Gleiches gilt für Twilio.
- **Cal.com kann nicht nach Telefonnummer filtern.** `reschedule` und
  `cancel` holen deshalb die kommenden Buchungen des Event-Types und
  vergleichen im Code (letzte 9 Ziffern). Bei sehr vielen Terminen pro Tag
  sollte das auf eine gezieltere Suche umgestellt werden.
- **`system_query` ist nur eine Weiche.** Kundenspezifische Logik gehört
  hinter den Endpunkt, nie in diesen Workflow.
