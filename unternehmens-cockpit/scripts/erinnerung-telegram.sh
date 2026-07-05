#!/usr/bin/env bash
# Prüft fällige manuelle Kosteneinträge und schickt bei Treffern eine Telegram-Nachricht.
# Für Crontab, z.B. täglich morgens: 0 8 * * * COCKPIT_URL=... COCKPIT_CRON_SECRET=... \
#   TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... /pfad/erinnerung-telegram.sh
# Braucht jq (apt install jq, falls noch nicht vorhanden).
set -euo pipefail

COCKPIT_URL="${COCKPIT_URL:?COCKPIT_URL nicht gesetzt}"
COCKPIT_CRON_SECRET="${COCKPIT_CRON_SECRET:?COCKPIT_CRON_SECRET nicht gesetzt}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN nicht gesetzt}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:?TELEGRAM_CHAT_ID nicht gesetzt}"

antwort=$(curl -sf -H "x-cockpit-cron-secret: ${COCKPIT_CRON_SECRET}" "${COCKPIT_URL}/api/reminders")
anzahl=$(echo "$antwort" | jq '.erinnerungen | length')

if [ "$anzahl" -eq 0 ]; then
  exit 0
fi

text=$(echo "$antwort" | jq -r '
  "Cockpit-Erinnerung: " + (.erinnerungen | length | tostring) + " Dienst(e) bitte prüfen:\n" +
  ([.erinnerungen[] | "- " + .dienstName + ": seit " + (.faelligSeitTagen | tostring) + " Tagen fällig (" + .abrechnungsmodell + ")"] | join("\n"))
')

curl -sf -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=${text}" > /dev/null
