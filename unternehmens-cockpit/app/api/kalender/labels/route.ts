import { NextRequest } from "next/server";
import { aendereKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { baueLabel, validiereLabel } from "@/lib/kalender-labels";

// POST /api/kalender/labels — legt ein neues Label an.
//
// Anders als bei Vorlagen gibt es hier keine Besitzerprüfung: die Label-Liste ist geteilt,
// jeder mit Kalender-Zugang darf sie pflegen.
export async function POST(request: NextRequest) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const geprueft = validiereLabel(await request.json());
    if (!geprueft.ok) return Response.json({ fehler: geprueft.fehler }, { status: 400 });

    const label = baueLabel(geprueft.wert);
    const zaehler = await aendereKalender((daten) => {
      daten.labels.push(label);
      return daten.aenderungszaehler + 1;
    });

    return Response.json({ label, aenderungszaehler: zaehler }, { status: 201 });
  } catch (err) {
    console.error("Fehler beim Anlegen eines Labels:", err);
    return Response.json({ fehler: "Label konnte nicht angelegt werden." }, { status: 500 });
  }
}
