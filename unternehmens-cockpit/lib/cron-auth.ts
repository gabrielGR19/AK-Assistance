// Prüft den Server-zu-Server-Header für automatisierte Aufrufe (Crontab-Skripte statt n8n),
// die keine Basic-Auth-Session haben. Genutzt sowohl in middleware.ts (Bypass-Entscheidung für
// /api/live/refresh und /api/reminders) als auch direkt in app/api/live/refresh/route.ts
// (Verteidigung in der Tiefe, falls die Middleware-Bedingung sich mal ändert).
export function cronSecretGueltig(header: string | null): boolean {
  const secret = process.env.COCKPIT_CRON_SECRET;
  return !!secret && header === secret;
}
