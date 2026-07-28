import { NextRequest } from "next/server";
import { ladeKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";

// GET /api/kalender/export — der komplette Kalender als JSON zum Herunterladen.
//
// Bewusst der ganze Datensatz beider Personen: das ist eine Sicherung, keine Ansicht. Wer
// im Cockpit angemeldet ist, sieht ohnehin beide Kalender.
export async function GET(request: NextRequest) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const daten = await ladeKalender();
    return new Response(JSON.stringify(daten, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="arbeitskalender_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    console.error("Fehler beim Export des Kalenders:", err);
    return Response.json({ fehler: "Export nicht möglich." }, { status: 500 });
  }
}
