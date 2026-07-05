import { ladeDaten } from "@/lib/db";
import { berechneFaelligeErinnerungen } from "@/lib/reminders";

// GET /api/reminders — liefert alle fälligen manuellen Dienste, kanal-agnostisch
// (kein E-Mail/Telegram-Text eingebaut). Ein externer Scheduler (n8n) entscheidet,
// wie/wohin er das Ergebnis meldet.
export async function GET() {
  try {
    const daten = await ladeDaten();
    const erinnerungen = berechneFaelligeErinnerungen(daten);
    return Response.json({ erinnerungen });
  } catch (err) {
    console.error("Fehler beim Ermitteln fälliger Erinnerungen:", err);
    return Response.json({ fehler: "Erinnerungen konnten nicht ermittelt werden." }, { status: 500 });
  }
}
