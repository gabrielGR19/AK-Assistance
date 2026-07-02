import { ladeDaten } from "@/lib/db";
import { berechneWarnungen } from "@/lib/checks";

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
