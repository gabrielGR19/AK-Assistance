#!/usr/bin/env bash
# Friert den Vormonat des Kunden-Verbrauchs (Retell) ein, falls noch nicht geschehen.
# Idempotent — tägliche Ausführung ist unkritisch. Für Crontab:
# 0 10 * * * COCKPIT_URL=... COCKPIT_CRON_SECRET=... /pfad/kunden-freeze.sh
set -euo pipefail

COCKPIT_URL="${COCKPIT_URL:?COCKPIT_URL nicht gesetzt}"
COCKPIT_CRON_SECRET="${COCKPIT_CRON_SECRET:?COCKPIT_CRON_SECRET nicht gesetzt}"

curl -sf -X POST \
  -H "x-cockpit-cron-secret: ${COCKPIT_CRON_SECRET}" \
  "${COCKPIT_URL}/api/retell/kunden/freeze" > /dev/null
