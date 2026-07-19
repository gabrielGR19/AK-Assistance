#!/usr/bin/env bash
# Stößt den Voice-Agent-Alert-Scan an (Retell-Calls + n8n-Fehler auswerten).
# Für Crontab, alle 15 Minuten: */15 * * * * COCKPIT_URL=... COCKPIT_CRON_SECRET=... /pfad/alerts-scan.sh
set -euo pipefail

COCKPIT_URL="${COCKPIT_URL:?COCKPIT_URL nicht gesetzt}"
COCKPIT_CRON_SECRET="${COCKPIT_CRON_SECRET:?COCKPIT_CRON_SECRET nicht gesetzt}"

curl -sf -X POST \
  -H "x-cockpit-cron-secret: ${COCKPIT_CRON_SECRET}" \
  "${COCKPIT_URL}/api/alerts/scan"
echo
