import { NextRequest } from "next/server";
import { ladeDaten, speichereDaten } from "@/lib/db";
import { validiereEingabe, fuegeDienstHinzu } from "@/lib/dienste";

// GET /api/dienste — liefert Meta + alle Dienste.
export async function GET() {
  try {
    const daten = await ladeDaten();
    return Response.json(daten);
  } catch (err) {
    console.error("Fehler beim Laden der Dienste:", err);
    return Response.json({ fehler: "Daten konnten nicht geladen werden." }, { status: 500 });
  }
}

// POST /api/dienste — legt einen neuen Dienst an (nach Validierung).
export async function POST(request: NextRequest) {
  try {
    const roh = await request.json();
    const geprueft = validiereEingabe(roh);
    if (!geprueft.ok) {
      return Response.json({ fehler: geprueft.fehler }, { status: 400 });
    }
    const daten = await ladeDaten();
    const aktualisiert = fuegeDienstHinzu(daten, geprueft.wert);
    await speichereDaten(aktualisiert);
    return Response.json(aktualisiert, { status: 201 });
  } catch (err) {
    console.error("Fehler beim Anlegen eines Dienstes:", err);
    return Response.json({ fehler: "Dienst konnte nicht angelegt werden." }, { status: 500 });
  }
}
