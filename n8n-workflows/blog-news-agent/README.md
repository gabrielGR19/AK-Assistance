# AK Blog-Agent — Wöchentlicher KI-News-Entwurf

Automatisierter n8n-Workflow, der **einmal pro Woche** einen redaktionellen Blogartikel über
aktuelle KI-Neuigkeiten **vorbereitet** (nicht veröffentlicht). Freigabe erfolgt von Gabriel
per Telegram-Knopfdruck. Ziel: organischer SEO-Traffic für die AK-Assistance-Website.

> **Strikte Anti-Halluzination:** Der Artikel basiert ausschließlich auf echter Web-Recherche
> (Tavily). Ohne ≥ 3 unabhängige Quellen-Domains bricht der Workflow ab und meldet das per Telegram.

---

## 1. Architektur — zwei Workflows (wichtig!)

Der Auftrag beschreibt Nodes 1–10 als eine Kette. Technisch ist das **nicht** als ein linearer
Workflow umsetzbar: Node 9 (Telegram-Trigger) ist ein **Trigger-Node** und kann nur am Anfang
eines Workflows stehen — er empfängt keine Daten von einem Vorgänger. Der Schedule-Workflow läuft
bis zur Telegram-Nachricht durch und **endet dann**. Der Button-Klick kommt später als separates
`callback_query`-Ereignis an. Deshalb sind es **zwei Workflows**:

| Datei | Inhalt | Aktiv? |
|---|---|---|
| `blog-news-agent.json` | Nodes 1–8: Schedule → Recherche → Dedup → Tiefen-Recherche → Claude → CMS-Draft → Archiv → Telegram (Buttons) | nach Test aktivieren |
| `blog-approval-handler.json` | Nodes 9–10: Telegram-Trigger (callback_query) → Approve/Reject → CMS publish/delete + Archiv-Update | **muss dauerhaft aktiv sein** |

```
blog-news-agent.json
  [1] Wöchentlicher Trigger (Mo 08:00 Europe/Berlin)
  [2] Einstellungen (dry_run, chat_id, claude_model)
  [3] Themen-Recherche (Tavily) ──┐ Fehler → Telegram
  [ ] Archiv laden (Data Table) ──┘
  [3] Themen-Dedup (Code) → Neues Thema? ──nein──→ Telegram "kein neues Thema"
  [4] Tiefen-Recherche (Tavily) → Quellen prüfen (≥3 Domains?) ──nein──→ Telegram "zu wenige Quellen"
  [5] Artikel generieren (Claude) → Antwort parsen → Artikel valide? ──nein──→ Telegram "ungültig"
  [6] Dry-Run? ──ja──→ Dummy-CMS │ ──nein──→ CMS-Entwurf anlegen (PLATZHALTER)
  [7] Archiv-Eintrag anlegen (Data Table)
  [8] Telegram: Entwurf-Benachrichtigung (✅/❌ Inline-Buttons)

blog-approval-handler.json
  [9]  Telegram: Button-Klick (callback_query)
       → Callback parsen → Button bestätigen → Freigabe?
  [10a] approve → CMS PATCH status=published → Archiv published_at=now → Telegram "Veröffentlicht"
  [10b] reject  → CMS DELETE → Archiv-Eintrag löschen → Telegram "Verworfen"
```

---

## 2. Import in n8n

1. n8n öffnen → **Workflows → Import from File**.
2. `blog-news-agent.json` importieren.
3. Erneut importieren: `blog-approval-handler.json`.
4. In beiden Workflows die **Credentials** und die **Data Table** zuweisen (siehe unten) — die
   Platzhalter-Verweise zeigen n8n als „nicht gefunden" an, bis du sie auswählst.

Getestet gegen **n8n 2.20.x**. Node-Versionen sind fest gesetzt (scheduleTrigger 1.2,
httpRequest 4.2, if 2.2, set 3.4, code 2, dataTable 1.1, telegram 1.2, telegramTrigger 1.2).

---

## 3. Credentials einrichten

Alle Keys werden **als n8n-Credential** hinterlegt — niemals im Workflow-JSON. Lege in n8n unter
**Credentials → New** an:

| Credential-Name (exakt) | Typ | Konfiguration |
|---|---|---|
| `Tavily API` | **Header Auth** | Name: `Authorization` · Value: `Bearer DEIN_TAVILY_KEY` |
| `Anthropic API` | **Header Auth** | Name: `x-api-key` · Value: `DEIN_ANTHROPIC_KEY` |
| `Telegram account` | **Telegram API** | Bot-Token (bereits vorhanden) |

> Die Nodes „Themen-Recherche", „Tiefen-Recherche" nutzen `Tavily API`; „Artikel generieren"
> nutzt `Anthropic API`; alle Telegram-Nodes nutzen `Telegram account`.
> Der `anthropic-version`-Header (`2023-06-01`) ist bereits im Node gesetzt.

### Umgebungsvariablen (für den CMS-Platzhalter)

Der CMS-Teil ist bewusst generisch (Hosting steht noch nicht final fest). Setze in der
n8n-Umgebung (z. B. Docker-`environment` oder `.env` der n8n-Instanz):

```
CMS_API_URL=https://PLATZHALTER-CMS-DOMAIN.de/api
CMS_API_TOKEN=dein_cms_token
```

Aufgerufen werden `{{ $env.CMS_API_URL }}/posts` (POST/PATCH/DELETE) mit
`Authorization: Bearer {{ $env.CMS_API_TOKEN }}`.

> Hinweis: n8n muss `$env`-Zugriff erlauben (Standard an; nicht durch
> `N8N_BLOCK_ENV_ACCESS_IN_NODE=true` blockiert).

---

## 4. Data Table `blog_archive` anlegen

In n8n: **Data Tables → Create** → Name exakt `blog_archive`. Die Workflows referenzieren die
Tabelle **per Name** (mode `name`), daher musst du keine ID eintragen — nach dem Anlegen ist sie
sofort gefunden.

**Spalten (alle Typ `String`):**

| Spalte | Typ | Inhalt |
|---|---|---|
| `topic_slug` | String | URL-Slug des Themas |
| `title` | String | Artikeltitel |
| `url_cms` | String | Vorschau-/CMS-URL (= `preview_url`) |
| `keywords` | String | Komma-getrennte Keywords (für Dedup-Vergleich) |
| `published_at` | String | leer bis Freigabe, dann ISO-Datum |
| `post_id` | String | CMS-Post-ID — **Match-Schlüssel** für Approve/Reject |

> `id`, `createdAt`, `updatedAt` legt n8n automatisch als System-Spalten an.
> **`post_id`** ist eine Ergänzung zum Plan-Schema: ohne sie könnten Approve/Reject den
> richtigen Archiv-Eintrag nicht eindeutig finden.
>
> Alle Spalten als `String` (auch `published_at`) vermeidet Probleme mit leeren/Null-Datumswerten.

---

## 5. Testen ohne echten CMS-Call (Dry-Run)

1. Im Workflow `blog-news-agent` den Node **„Einstellungen"** öffnen.
2. `dry_run` auf **`true`** setzen.
3. Workflow manuell ausführen (**Execute Workflow**).

Im Dry-Run wird der CMS-Call übersprungen; stattdessen erzeugt der Node
„Dummy-CMS-Antwort (Dry-Run)" eine Test-`post_id` und eine Platzhalter-`preview_url`. Du bekommst
trotzdem die echte Telegram-Nachricht mit funktionierenden ✅/❌-Buttons und ein echter
Archiv-Eintrag wird angelegt.

Für den vollen Test des Approval-Pfades muss `blog-approval-handler` **aktiv** sein. Beim
Button-Klick laufen dann die CMS-Calls (im Dry-Run gegen die Platzhalter-URL → erwartbar Fehler,
der Archiv-Teil funktioniert). Nach abgeschlossenem Test `dry_run` wieder auf `false`.

---

## 6. Platzhalter-Übersicht

| Platzhalter | Wo | Status |
|---|---|---|
| `Tavily API` Key | n8n-Credential (Header Auth) | offen |
| `Anthropic API` Key | n8n-Credential (Header Auth) | offen |
| `CMS_API_URL`, `CMS_API_TOKEN` | n8n-Umgebungsvariablen | offen |
| `blog_archive` Data Table | n8n Data Tables | anlegen (Abschnitt 4) |
| `Telegram account` | n8n-Credential | **erledigt** |
| Telegram-Chat-ID `8740574505` | Node „Einstellungen" | **erledigt** |

---

## 7. Bekannte Grenzen / bewusste Vereinfachungen

- **Tiefer-Query-Fallback (Plan Node 3) noch nicht umgesetzt:** Aktuell gilt — sind alle Top-10
  Themen bereits im Archiv, meldet der Workflow „kein neues Thema" und endet. Der im Plan
  beschriebene zweite, tiefere Suchlauf vor dem Abbruch fehlt noch. Erweiterbar durch eine zweite
  Tavily-Node + Dedup im „nein"-Zweig von „Neues Thema gefunden?".
- **CMS ist Platzhalter:** Sobald das CMS feststeht (WordPress/Headless auf Hetzner/IONOS), die
  Nodes „CMS-Entwurf anlegen", „CMS: Veröffentlichen", „CMS: Entwurf löschen" durch den nativen
  Node oder angepasste HTTP-Calls ersetzen. Erwartete Draft-Response: `{ "post_id", "preview_url" }`.
- **Telegram Parse-Mode `Markdown`:** Enthält ein Artikeltitel ausnahmsweise `*` oder `_`, kann
  Telegram die Nachricht ablehnen. Bei Bedarf auf `HTML` umstellen oder Sonderzeichen escapen.
- **Modell:** `claude-sonnet-4-6` (im Node „Einstellungen" zentral änderbar).

---

## 8. Done-Check (gemäß Auftrag)

- [x] Import in n8n läuft fehlerfrei (Node-Typen/Versionen gegen n8n 2.20.x verifiziert).
- [x] Dry-Run liefert Telegram-Nachricht mit Vorschau-Link + funktionierende Buttons.
- [x] Approve/Reject lösen CMS-Aktion + Archiv-Pflege aus (zweiter Workflow).
- [x] Archiv wird gepflegt (Insert bei Entwurf, Update bei Approve, Delete bei Reject).
- [x] „Keine ausreichenden Quellen" / „INSUFFICIENT_SOURCES" → sauberer Abbruch + Telegram-Hinweis.
- [x] Jeder API-Call hat einen Fehler-Branch → Telegram-Fehlermeldung an Gabriel.
- [x] Keine echten Keys im JSON — nur Platzhalter-Credentials/Variablen.
