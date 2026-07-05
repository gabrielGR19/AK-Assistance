#!/usr/bin/env bash
# Stößt den gesammelten Live-Abruf aller registrierten Dienste an (Claude, Retell, künftige).
# Für Crontab, z.B. alle 6h: 0 */6 * * * COCKPIT_URL=... COCKPIT_CRON_SECRET=... /pfad/live-refresh.sh
set -euo pipefail

COCKPIT_URL="${COCKPIT_URL:?COCKPIT_URL nicht gesetzt}"
COCKPIT_CRON_SECRET="${COCKPIT_CRON_SECRET:?COCKPIT_CRON_SECRET nicht gesetzt}"

curl -sf -X POST \
  -H "x-cockpit-cron-secret: ${COCKPIT_CRON_SECRET}" \
  "${COCKPIT_URL}/api/live/refresh" > /dev/null
