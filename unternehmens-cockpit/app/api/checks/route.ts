import { ladeDaten } from "@/lib/db";
import { berechneWarnungen } from "@/lib/checks";
import { sendeTelegramFuerWarnungen } from "@/lib/checks-telegram";
import { cronSecretGueltig } from "@/lib/cron-auth";

// GET /api/checks — liefert die aktuellen Warnungen für den Warnbereich.
// Kapselt die Schwellen-/Check-Logik hinter einer eigenen Route, damit später
// ein Cronjob (E-Mail/Telegram) dieselbe Funktion serverseitig aufrufen kann.
export async function GET() {
  try {
    const daten = await ladeDaten();
    return Response.json({ warnungen: berechneWarnungen(daten) });
  } catch (err) {
    console.error("Fehler beim Berechnen der Warnungen:", err);
    return Response.json({ fehler: "Warnungen konnten nicht berechnet werden." }, { status: 500 });
  }
}

// POST /api/checks — berechnet die Warnungen und stößt zusätzlich den Telegram-Push für
// "hoch"-Warnungen an. Wird per Crontab aufgerufen (Cron-Secret-Auth wie /api/alerts/scan).
export async function POST(request: Request) {
  const passwortAktiv = !!process.env.COCKPIT_PASSWORT;
  const perCron = cronSecretGueltig(request.headers.get("x-cockpit-cron-secret"));
  const perBrowser = request.headers.get("authorization")?.startsWith("Basic ") ?? false;
  if (passwortAktiv && !perCron && !perBrowser) {
    return Response.json({ fehler: "Nicht autorisiert." }, { status: 401 });
  }
  try {
    const daten = await ladeDaten();
    const warnungen = berechneWarnungen(daten);
    await sendeTelegramFuerWarnungen(warnungen);
    return Response.json({ warnungen });
  } catch (err) {
    console.error("Fehler beim Check-Telegram-Push:", err);
    return Response.json({ fehler: "Check fehlgeschlagen." }, { status: 500 });
  }
}
