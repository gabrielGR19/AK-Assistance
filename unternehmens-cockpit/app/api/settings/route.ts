import { NextRequest } from "next/server";
import { ladeDaten, speichereDaten } from "@/lib/db";

// PUT /api/settings — pflegt den EUR/USD-Wechselkurs (mit Datum der Pflege).
// Erwartet { eurUsdKurs: number > 0 }.
export async function PUT(request: NextRequest) {
  try {
    const roh = await request.json();
    const kurs = Number(roh?.eurUsdKurs);
    if (!Number.isFinite(kurs) || kurs <= 0) {
      return Response.json({ fehler: "Wechselkurs muss eine Zahl > 0 sein." }, { status: 400 });
    }
    const daten = await ladeDaten();
    daten.meta.eurUsdKurs = kurs;
    daten.meta.kursStand = new Date().toISOString();
    await speichereDaten(daten);
    return Response.json(daten);
  } catch (err) {
    console.error("Fehler beim Speichern des Wechselkurses:", err);
    return Response.json({ fehler: "Wechselkurs konnte nicht gespeichert werden." }, { status: 500 });
  }
}
