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
| `reschedule_appointment` | `neue_zeit` (ISO) + `referenz` (sonst zählt die Anrufernummer) | `verschoben`, `bestaetigungsnummer`, `alter_termin` |
| `cancel_appointment` | `referenz` (sonst zählt die Anrufernummer), `grund` | `storniert`, `bestaetigungsnummer` |
| `send_sms` | `telefon`, `textvorlage`, `werte` | `gesendet`, `sid`, `status` |
| `notify_dispatch` | `name`, `telefon`, `ort`, `anliegen` | `alarmiert`, `kanal` |
| `system_query` | `system` + beliebige weitere Felder | Antwort des Kundensystems, unverändert |

Unbekannte `action` → `{ success: false, message: "unknown action" }`.

## Einrichtung

### 1. Umgebungsvariablen (auf dem n8n-Server, nicht im Workflow)

| Variable | Pflicht | Zweck |
|---|---|---|
| `AK_WEBHOOK_SECRET` | ja | Secret für den Header `X-AK-Auth`. Ohne diese Variable lehnt der Handler **jede** Anfrage ab — das ist Absicht. |
| `AK_CAL_API_BASE` | nein | Abweichende Cal.com-Basis-URL (Standard `https://api.cal.com/v2`). Bewusst serverseitig und nicht pro Kunde: sonst könnte eine Config-Zeile den gemeinsamen Cal.com-Key an einen fremden Host schicken. |
| `AK_SYS_<KUNDE>` | nein | Token für die Kundensysteme hinter `system_query` bzw. ein HTTP-CRM. Der Name der Variablen steht in der Kundenzeile (`system_token_env`), der Wert nur auf dem Server. So bekommt kein Kunde das Token eines anderen. |

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
| `Twilio API` | Basic Auth, Benutzer = Account SID, Passwort = Auth Token | 07, 08 |
| `Google Sheets account 2` | vorhanden | 02 (`crm_typ: sheets`) |
| `Telegram account` | vorhanden | 08 |
| `Gmail account Agent` | vorhanden | 08 |

Für Kundensysteme (`crm_typ: http`, `system_query`) gibt es bewusst **kein**
gemeinsames Credential — deren Token kommen pro Kunde aus einer
Umgebungsvariablen (`system_token_env`). Ein geteiltes Credential an eine
kundenkonfigurierte URL zu schicken hieße, dass Kunde B das Token sieht, mit
dem auch Kunde A angesprochen wird.

### 3. DataTables anlegen

n8n → **Data Tables** → *Create*. Beide Tabellen sind Pflicht.

**`ak_kunden_config`** — eine Zeile pro Kunde:

| Spalte | Typ | Pflicht | Beispiel |
|---|---|---|---|
| `kunde_id` | String | ja | `muster-bau` |
| `kunde_name` | String | – | `Muster Bau GmbH` |
| `aktiv` | Boolean | ja | `true` |
| `zeitzone` | String | – | `Europe/Berlin` (Standard) |
| `kalender_typ` | String | – | `calcom` (anderes wird sauber abgelehnt) |
| `cal_event_type_id` | String | für Termine | `1234567` |
| `cal_username` | String | – | `muster-bau` |
| `buchung_platzhalter_email` | String | – | `termine@muster-bau.de` |
| `sms_from` | String | für SMS | `+4915112345678` |
| `twilio_account_sid` | String | für SMS | `AC…` |
| `sms_prefixe` | String (JSON) | – | `["+49"]` (Standard) — erlaubte Zielvorwahlen |
| `crm_typ` | String | – | `sheets`, `http` oder `none` |
| `crm_quelle` | String | – | Sheet-ID oder HTTPS-URL |
| `crm_blatt` | String | – | `Tabelle1` |
| `dispatch_kanal` | String | für Notfall | `sms`, `telegram` oder `email` |
| `dispatch_ziel` | String | für Notfall | Nummer, Chat-ID oder E-Mail |
| `system_endpoints` | String (JSON) | – | `{"auftragsstatus":"https://erp.kunde.de/api/status"}` |
| `system_token_env` | String | – | `AK_SYS_MUSTER` — Name der Umgebungsvariablen mit dem Token |
| `sms_vorlagen` | String (JSON) | – | siehe unten |
| `erlaubte_actions` | String (JSON) | – | `["check_availability","book_appointment"]` — leer = alles erlaubt |

`cal_api_base` gibt es bewusst **nicht** als Kundenspalte (siehe
Umgebungsvariablen). Ohne `buchung_platzhalter_email` bucht der Handler auf
`telefontermin+<kunde_id>@ak-assistance.de` — am Telefon nennt kaum jemand
eine E-Mail, und Cal.com verlangt eine.

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
| `details` | String |

Bewusst **ohne** Gesprächsinhalte, Namen oder Telefonnummern. `details` hält
nur den technischen Grund (`unauthorized`, `unknown_kunde`, Fehlertext eines
Sub-Workflows) für die Fehlersuche.

### 4. Workflows in n8n

Auf `n8n.ak-assistance.de` sind alle zehn bereits angelegt — **inaktiv** und
mit korrekt eingetragenen Sub-Workflow-IDs:

| Workflow | ID |
|---|---|
| `ak-agent-handler` | `ww8zB7nz78M3zgaO` |
| `ak-sub-identify_caller` | `ejBo2mAaKB9CEIM4` |
| `ak-sub-check_availability` | `Wf0LjCKahvIrftGZ` |
| `ak-sub-book_appointment` | `j3xYodOzaMv7866A` |
| `ak-sub-reschedule_appointment` | `2qCGROEXchEqRP59` |
| `ak-sub-cancel_appointment` | `WOonFxMOZKQCHAqd` |
| `ak-sub-send_sms` | `PwpMpmrb2yEE75Qn` |
| `ak-sub-notify_dispatch` | `xUd3i5EoJvSLdyWu` |
| `ak-sub-system_query` | `5NQecJWYW9aRjQN4` |
| `ak-health` | `1XpPQbJC3wftO6Tk` |

Zu aktivieren (Publish) sind nur `ak-agent-handler` und `ak-health` — und
erst, wenn Schritte 1 bis 3 erledigt sind. Die Sub-Workflows brauchen
**keine** Aktivierung, sie werden aufgerufen und nicht getriggert. Die
Sub-Workflows rufen sich untereinander nicht auf; jeder hängt nur am Handler.

Beim Import in eine **andere** Instanz (Test-Umgebung, Neuaufbau) stimmen
diese IDs nicht mehr: dann in den acht `Sub …`-Nodes des Handlers den
jeweiligen Sub-Workflow neu auswählen. Der Node-Name sagt, welcher gemeint
ist.

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
Anrufer sie im Gespräch beeinflussen. Deshalb liest der Handler `kunde_id`
und `agent_typ` bevorzugt aus der **Query der Tool-URL**, die im Agenten
fest steht:

```
https://n8n.ak-assistance.de/webhook/ak-agent-handler?kunde_id=muster-bau&agent_typ=rezeption
```

Retell schickt bei Custom Functions `{ name, args, call }`. Der Handler
versteht das: `name` wird als `action` gelesen, `args` als `params`. Der
Modus *"Payload: args only"* funktioniert ebenfalls, ist aber nicht nötig.

### Was in den bestehenden Flows ersetzt wird

Alle Function-Nodes zeigen heute auf Platzhalter-URLs. Sie bekommen dieselbe
Handler-URL, unterscheiden sich nur noch im Tool-Namen:

| Agent | Tool heute | neue `action` |
|---|---|---|
| 2 | `check_availability` | `check_availability` |
| 2 | `book_appointment` | `book_appointment` |
| 2 | `find_appointment` | entfällt — Suche steckt in `reschedule`/`cancel` |
| 2 | `update_appointment` (`aktion`: verschieben/absagen) | `reschedule_appointment` bzw. `cancel_appointment` |
| 3 | `verfuegbarkeit_pruefen` | `check_availability` |
| 3 | `termin_buchen` | `book_appointment` |
| 3 | `termin_verschieben` | `reschedule_appointment` |
| 3 | `termin_absagen` | `cancel_appointment` |
| 4 | `identify_caller` | `identify_caller` |
| 4 | `check_availability` / `book_appointment` / `modify_appointment` | wie Agent 2 |
| 4 | `system_lookup_1`, `system_lookup_2` | `system_query` mit `params.system` |
| 4 | `notify_emergency_dispatch` | `notify_dispatch` |

Zwei Dinge ändern sich dabei inhaltlich:

- **`find_appointment` entfällt.** Suchen und Ändern sind ein Vorgang — der
  Agent würde sonst eine Termin-ID durchs Gespräch tragen, die er nicht
  prüfen kann. `reschedule_appointment` sucht selbst, über Referenz,
  Telefonnummer oder Name.
- **`system_lookup_1/2` werden eine Action.** Welches System gemeint ist,
  steht in `params.system`; welche Systeme ein Kunde hat, in seiner Config.
  Ein zweiter Lookup braucht damit keinen neuen Workflow mehr.

Die Parameternamen der Agenten (`kunde_name`, `neue_uhrzeit`, `datum` +
`uhrzeit` getrennt …) müssen auf die Namen aus der Action-Tabelle oben
umgestellt werden. Vor allem: **Datum und Uhrzeit gehören zu einem
ISO-Zeitpunkt zusammengesetzt** (`start`, `neue_zeit`), getrennte Felder
akzeptiert der Handler nicht.

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
   verschieben oder stornieren. Fehlt diese Angabe in der Kalenderantwort,
   wird abgelehnt statt durchgelassen.
5. **Zielnummern-Allowlist.** SMS gehen nur an Nummern mit erlaubter Vorwahl
   (`sms_prefixe`, Standard `+49`). Sonst könnte ein manipuliertes Gespräch
   SMS an beliebige Auslandsnummern auslösen — auf Rechnung des Kunden.

### Wer darf einen fremden Termin ändern? Niemand.

`reschedule_appointment` und `cancel_appointment` finden einen Termin nur
über die **Bestätigungsnummer** oder die **Rufnummer des Anrufers** (aus der
Telefonie, nicht aus dem Gespräch). Ein genannter Name allein reicht nicht —
sonst könnte jeder anrufen und den Termin eines anderen absagen.

Praktische Folge für die Agent-Prompts: Wenn die Antwort
`zur sicherheit bitte die bestaetigungsnummer nennen` lautet, muss der Agent
danach fragen (typisch bei unterdrückter Nummer oder Anruf von einem anderen
Anschluss). Kommt `zu dieser nummer gibt es keinen termin`, war die genannte
Bestätigungsnummer falsch — dann nicht auf Namenssuche ausweichen, sondern
an einen Menschen übergeben.

## Betrieb

- **Health-Check:** `GET https://n8n.ak-assistance.de/webhook/ak-health` →
  `{"success":true,...}`. Für Uptime-Monitoring geeignet, ohne Auth und ohne
  Kundendaten.
- **Timeouts:** 8 s pro externem Call, dazu ein Gesamtdeckel von 20 s je
  Sub-Workflow und 25 s im Handler. Der Deckel ist der wichtigere Teil: ohne
  ihn könnte Retell den Function Call abbrechen, während n8n den Termin im
  Hintergrund trotzdem noch verschiebt.
- **Retries:** einmalig auf lesende Calls. **Kein Retry** auf `book`,
  `reschedule`, `cancel`, `send_sms` und `system_query` — ein zweiter Versuch
  würde doppelt buchen, doppelt senden oder beim Kundensystem etwas doppelt
  auslösen. Einzige Ausnahme ist die Alarm-SMS in `notify_dispatch`: eine
  doppelte Alarmierung ist besser als eine ausgefallene.
- **Logging:** `ak_agent_log`, eine Zeile pro Anfrage. Das Logging läuft
  *nach* der Antwort an Retell, kostet also keine Gesprächszeit und kann
  eine Antwort nicht kaputtmachen.
- **Fehlersuche:** In n8n unter *Executions* nach `ak-agent-handler`
  filtern; die `request_id` aus dem Log verbindet Handler und Sub-Workflow.
- **Nach jeder Änderung an einem Code-Node:** `node test-nodes.js` in diesem
  Verzeichnis. Das Skript führt die Node-Logik mit Beispieldaten aus —
  Auth-Umgehung, fremder Mandant, Prototyp-Trick bei SMS-Vorlagen,
  Zeitraum-Randfälle. 53 Prüfungen, läuft ohne n8n und ohne Netz.

## Grenzen (bewusst so)

- **Ein Cal.com-Konto für alle Kunden**, getrennt über `cal_event_type_id`.
  Braucht ein Kunde ein eigenes Cal.com-Konto, geht das nicht über die
  Config: n8n kann Credentials nicht dynamisch pro Datensatz wählen. Dann
  `ak-sub-book_appointment` kopieren, eigenes Credential setzen und den Klon
  im Handler-Router eintragen. Gleiches gilt für Twilio.
- **Cal.com kann nicht nach Telefonnummer filtern.** `reschedule` und
  `cancel` holen deshalb die kommenden Buchungen des Event-Types (`take=100`,
  ohne Pagination) und vergleichen im Code über die letzten neun Ziffern. Ein
  Betrieb mit mehr als 100 anstehenden Terminen findet die späteren nicht
  mehr — dann auf einen Zeitraumfilter (`afterStart`) umstellen.
- **`agent_typ` wird geloggt, aber nicht erzwungen.** Wer welche Action
  auslösen darf, steuert optional `erlaubte_actions` pro Kunde — nicht der
  Agenten-Typ.
- **`system_query` ist nur eine Weiche.** Kundenspezifische Logik gehört
  hinter den Endpunkt, nie in diesen Workflow.
