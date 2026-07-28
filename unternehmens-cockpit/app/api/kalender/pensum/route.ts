import { NextRequest } from "next/server";
import { aendereKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { validierePensum } from "@/lib/kalender-tagesstand";

// PUT /api/kalender/pensum — eigenes Tagespensum-Soll in Minuten setzen.
// Jeder ändert nur sein eigenes; das Soll des anderen bleibt unberührt.
export async function PUT(request: NextRequest) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const geprueft = validierePensum(await request.json());
    if (!geprueft.ok) return Response.json({ fehler: geprueft.fehler }, { status: 400 });

    const minuten = geprueft.wert;
    const zaehler = await aendereKalender((daten) => {
      daten.pensumSoll[person] = minuten;
      return daten.aenderungszaehler + 1;
    });

    return Response.json({ minuten, aenderungszaehler: zaehler });
  } catch (err) {
    console.error("Fehler beim Speichern des Tagespensums:", err);
    return Response.json({ fehler: "Tagespensum konnte nicht gespeichert werden." }, { status: 500 });
  }
}
