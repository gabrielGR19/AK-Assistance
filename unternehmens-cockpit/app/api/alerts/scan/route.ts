import { ladeDaten, speichereDaten } from "@/lib/db";
import { scanAlerts, sendeTelegramFuerHoch } from "@/lib/alerts";
import { cronSecretGueltig } from "@/lib/cron-auth";

// POST /api/alerts/scan — ein Überwachungs-Lauf (Retell-Calls + n8n-Fehler auswerten).
// Wird alle 15 Minuten per Crontab aufgerufen; Cron-Secret wie bei /api/live/refresh
// zusätzlich hier geprüft (Verteidigung in der Tiefe neben der Middleware).
export async function POST(request: Request) {
  const passwortAktiv = !!process.env.COCKPIT_PASSWORT;
  const perCron = cronSecretGueltig(request.headers.get("x-cockpit-cron-secret"));
  const perBrowser = request.headers.get("authorization")?.startsWith("Basic ") ?? false;
  if (passwortAktiv && !perCron && !perBrowser) {
    return Response.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  }

  try {
    const daten = await ladeDaten();
    const ergebnis = await scanAlerts(daten);
    await speichereDaten(daten);
    await sendeTelegramFuerHoch(ergebnis.neueHoch);
    return Response.json({
      ok: ergebnis.ok,
      geprüfteCalls: ergebnis.geprüfteCalls,
      neueKritische: ergebnis.neueHoch.length,
      hinweise: ergebnis.hinweise,
    });
  } catch (err) {
    console.error("Alert-Scan fehlgeschlagen:", err);
    return Response.json({ fehler: "Scan fehlgeschlagen." }, { status: 500 });
  }
}
