---
name: deploy
description: Pflicht-Ablauf für jedes Deployment auf einen Live-Server (rsync/ssh/scp auf Hetzner o.ä.) — Server-Stand prüfen, Backup, Diff zeigen, Bestätigung, Deploy, Post-Check. IMMER verwenden, wenn Code auf einen Produktionsserver soll — Auslöser wie "deploy", "auf den Server", "live schalten", "auf Hetzner spielen" — auch ohne dass der Skill namentlich genannt wird.
---

# Deploy auf Live-Server

Ziel: Kein Deployment überschreibt oder löscht jemals unbemerkt Server-Stand.
Hintergrund: Incident 2026-07-18 — rsync hat uncommitteten Server-Code von
Moritz überschrieben, weil der Server-Stand vorher nicht geprüft wurde.

Die 6 Schritte sind Pflicht und laufen in dieser Reihenfolge. Kein Schritt
wird übersprungen, auch nicht bei "kleinen" Deploys.

## Bekannte Ziele

| Projekt | Server | Pfad | Besonderheiten |
|---|---|---|---|
| unternehmens-cockpit | `root@46.224.146.30` (Key `~/.ssh/hetzner_deploy`) | `/root/unternehmens-cockpit/` | `data/` NIE anfassen (Live-Daten); Build/Neustart via `/root/redeploy-cockpit.sh` (pm2) |
| website | gleicher Server | siehe Memory `project_website_hetzner` | statisches HTML |

## Schritt 1 — Server-Stand prüfen (Pflicht, VOR allem anderen)

Zwei Prüfungen, beide read-only:

```bash
# a) Was würde der Deploy ändern? (Dry-Run, --delete NIE ohne Absprache)
rsync -avzn --itemize-changes -e "ssh -i <key>" --exclude data/ --exclude .git <lokal>/ <ziel>/

# b) Gibt es auf dem Server NEUERE/UNBEKANNTE Dateien? (umgekehrter Dry-Run)
rsync -avzn --itemize-changes -e "ssh -i <key>" --exclude data/ --exclude node_modules --exclude .next <ziel>/ <lokal>/
```

**Stopp-Kriterium:** Zeigt (b) Dateien, die lokal fehlen oder auf dem Server
neuer sind (z.B. von Moritz direkt auf dem Server bearbeitet), wird NICHT
deployed. Erst klären: Dateien sichern/ins Repo holen oder explizit von
Gabriel freigeben lassen, dass sie überschrieben werden dürfen.

## Schritt 2 — Server-Backup (Pflicht)

Vor jedem Überschreiben ein Zeitstempel-Backup des Zielordners:

```bash
ssh -i <key> <server> "mkdir -p /root/backups && tar czf /root/backups/<app>-\$(date +%Y%m%d-%H%M%S).tgz --exclude=node_modules --exclude=.next -C <parent> <ordner> && ls -lh /root/backups/ | tail -3"
```

Damit ist jeder Fehler ein 2-Minuten-Rollback statt eines Datenverlusts.
Alte Backups (>10) bei Gelegenheit aufräumen — nur nach Rückfrage.

## Schritt 3 — Diff zeigen

Gabriel bekommt die Dry-Run-Ausgabe aus Schritt 1a zusammengefasst:
welche Dateien neu, geändert, (bei --delete:) gelöscht würden — plus das
Ergebnis von Schritt 1b ("Server hat keine eigenen Änderungen" oder Liste).

## Schritt 4 — Explizite Bestätigung

Erst nach Gabriels klarem Ja weitermachen. Ein früheres Ja in derselben
Session gilt nicht für einen neuen/veränderten Deploy-Umfang. Auch
Nachzügler-Aktionen (z.B. "noch schnell eine Datei auf dem Server löschen")
brauchen ihre eigene Bestätigung — genau so ist der Incident passiert.

## Schritt 5 — Deploy ausführen

Denselben rsync-Befehl wie im Dry-Run, nur ohne `-n` — keine spontanen
Zusatz-Flags oder Extra-Befehle, die nicht im gezeigten Diff waren.
Danach Build/Neustart (z.B. `/root/redeploy-cockpit.sh`). Server-seitige
Skripte (redeploy, sync, cron) vor der ersten Ausführung in der Session
per `cat` lesen — sie können von anderen geändert worden sein und
Nebenwirkungen enthalten (Beinahe-Fehler 2026-07-19: redeploy-Skript
rief deaktivierte Git-Sync-Skripte wieder auf). Schlägt der
Build fehl: NICHT improvisieren — Fehler analysieren, Gabriel informieren,
ggf. Backup aus Schritt 2 zurückspielen.

## Schritt 6 — Post-Check

```bash
# Beispiel Cockpit: Prozess + Erreichbarkeit
ssh -i <key> <server> "pm2 describe <app> | grep -E 'status|uptime'"
curl -s -o /dev/null -w "%{http_code}" https://<domain>/
```

Erwartetes Verhalten kurz verifizieren (Statuscode, Login-Seite, ein
Kern-Endpoint). Ergebnis an Gabriel melden — auch wenn alles grün ist.

## Rollback

```bash
ssh -i <key> <server> "tar xzf /root/backups/<neuestes>.tgz -C <parent> && bash /root/redeploy-cockpit.sh"
```
