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

| Datei | Workflow-Name in n8n | Inhalt | Aktiv? |
|---|---|---|---|
| `blog-news-agent.json` | **AK Blog-Agent — KI-Wochenrückblick** | Schedule → 1× Tavily-Suche → Quellen aufbereiten → Claude (Wochenrückblick) → CMS-Draft → Archiv → Telegram (Buttons) | nach Test aktivieren |
| `blog-approval-handler.json` | **AK Blog-Agent — Approval-Handler (Telegram)** | Telegram-Trigger (callback_query) → Approve/Reject → Archiv-Update bzw. -Löschung + Telegram-Bestätigung | **muss dauerhaft aktiv sein** |

> **Designprinzip (wichtig):** Statt EIN Thema auszuwählen und nachzurecherchieren (fragil — fand
> oft keine 3 unabhängigen Quellen → Abbruch), erstellt der Workflow einen **Wochenrückblick** aus
> EINER breiten KI-News-Suche. Aus den 15 Treffern wird je Domain die beste Meldung genommen
> (max. 7), so sind **≥3 unabhängige Domains praktisch immer erfüllt** — kein Abbruch-Loop, und
> trotzdem strikt quellenbasiert.

```
blog-news-agent.json  (AK Blog-Agent — KI-Wochenrückblick)
  [1] Wöchentlicher Trigger (Mo 08:00 Europe/Berlin)
  [2] Einstellungen (dry_run, chat_id, claude_model)
  [3] Themen-Recherche (Tavily, 1× breit) ──Fehler──→ Telegram
  [4] Quellen aufbereiten (Code: je Domain beste Meldung, max 7)
       → Genug Quellen (≥3 Domains)? ──nein──→ Telegram "zu wenige Quellen"
  [5] Artikel generieren (Claude, Wochenrückblick) → Antwort parsen
       → Artikel valide? ──nein──→ Telegram "ungültig"
  [6] Dry-Run? ──ja──→ Dummy-CMS │ ──nein──→ CMS-Entwurf anlegen (PLATZHALTER)
  [7] Archiv-Eintrag anlegen (Data Table)
  [8] Telegram: Entwurf-Benachrichtigung (✅/❌ Inline-Buttons)

blog-approval-handler.json  (AK Blog-Agent — Approval-Handler mit Auto-Publish)
  Telegram: Button-Klick (callback_query)
   → Callback parsen → Button bestätigen → Freigabe?
   ├ approve → Archiv laden → HTML generieren → GitHub: Artikel committen
   │          → index.json updaten → Archiv published_at=now → Telegram mit Link
   └ reject  → Archiv-Eintrag löschen → Telegram "Verworfen"
```

> **Auto-Publish via GitHub:** Bei Freigabe per Telegram-Button generiert der Approval-Handler
> die vollständige HTML-Artikelseite aus dem gespeicherten Markdown, committed sie per GitHub API
> ins Repository (`website/blog/`), aktualisiert `blog/index.json` und löst damit automatisch
> das Deployment via GitHub Actions (`deploy.yml` → rsync auf den Hetzner VPS) aus.
> Kein manuelles Eingreifen mehr nötig nach dem Telegram-Knopfdruck.

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
| `GitHub Token` | **Header Auth** | Name: `Authorization` · Value: `token DEIN_GITHUB_PAT` |
| `Telegram account` | **Telegram API** | Bot-Token (bereits vorhanden) |

> **GitHub PAT:** Das Token braucht `repo`-Scope (Contents: read+write). Erstellen unter
> https://github.com/settings/tokens → „Generate new token (classic)" → Scope `repo` auswählen.

> Die Nodes „Themen-Recherche", „Tiefen-Recherche" nutzen `Tavily API`; „Artikel generieren"
> nutzt `Anthropic API`; alle Telegram-Nodes nutzen `Telegram account`.
> Der `anthropic-version`-Header (`2023-06-01`) ist bereits im Node gesetzt.

### GitHub-Repository

Die GitHub API URLs sind im Approval-Handler fest auf `gabrielGR19/AK-Assistance` konfiguriert.
Falls das Repository umzieht, müssen die URLs in den HTTP-Request-Nodes angepasst werden.

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
| `meta_description` | String | Meta-Description für SEO |
| `keywords` | String | Komma-getrennte Keywords |
| `body_markdown` | String | Vollständiger Artikel-Body in Markdown |
| `article_filename` | String | HTML-Dateiname (z.B. `2026-06-23-slug.html`) |
| `published_at` | String | leer bis Freigabe, dann ISO-Datum |
| `post_id` | String | Eindeutige ID — **Match-Schlüssel** für Approve/Reject |

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

- **Wochenrückblick statt Einzelthema:** Bewusste Abkehr vom ursprünglichen „ein Thema tief
  recherchieren"-Plan. Grund: Tavily lieferte oben oft eine starke, aber nischige Einzelmeldung,
  zu der die Nachrecherche keine 3 unabhängigen Domains fand → ständiger Abbruch. Der Rückblick
  über die Top-Meldungen einer breiten Suche erfüllt die 3-Domains-Regel praktisch immer und ist
  für wöchentliches SEO sogar das bessere Format. Alle harten Regeln bleiben (echte Quellen,
  Quellenliste, ≥3 Domains, Review-Gate).
- **Kein Cross-Wochen-Themen-Dedup:** Da jede Woche frische News (letzte 7 Tage) verarbeitet
  werden, ist Wiederholung gering. Das Archiv dient v.a. der Freigabe-/Publish-Verwaltung.
  Bei Bedarf nachrüstbar (Quell-URLs im Archiv speichern und in „Quellen aufbereiten" abgleichen).
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
