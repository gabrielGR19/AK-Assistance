#!/usr/bin/env bash
# Stößt den Kosten-/Fälligkeits-Check an (löst Telegram-Push für "hoch"-Warnungen aus).
# Für Crontab, 1x täglich kurz nach dem Live-Refresh: 10 9 * * * COCKPIT_URL=... COCKPIT_CRON_SECRET=... /pfad/checks-telegram.sh
set -euo pipefail

COCKPIT_URL="${COCKPIT_URL:?COCKPIT_URL nicht gesetzt}"
COCKPIT_CRON_SECRET="${COCKPIT_CRON_SECRET:?COCKPIT_CRON_SECRET nicht gesetzt}"

curl -sf -X POST \
  -H "x-cockpit-cron-secret: ${COCKPIT_CRON_SECRET}" \
  "${COCKPIT_URL}/api/checks" > /dev/null
