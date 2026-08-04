import { NextRequest } from "next/server";
import { aendereKalender, ladeKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { baueVorlage, validiereVorlage } from "@/lib/kalender-vorlagen";
import { erlaubteLabels } from "@/lib/kalender-labels";

// POST /api/kalender/vorlagen — legt eine eigene Schnellvorlage an.
export async function POST(request: NextRequest) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const erlaubt = erlaubteLabels(await ladeKalender());
    const geprueft = validiereVorlage(await request.json(), erlaubt);
    if (!geprueft.ok) return Response.json({ fehler: geprueft.fehler }, { status: 400 });

    const vorlage = baueVorlage(geprueft.wert, person);
    const zaehler = await aendereKalender((daten) => {
      daten.vorlagen.push(vorlage);
      return daten.aenderungszaehler + 1;
    });

    return Response.json({ vorlage, aenderungszaehler: zaehler }, { status: 201 });
  } catch (err) {
    console.error("Fehler beim Anlegen einer Vorlage:", err);
    return Response.json({ fehler: "Vorlage konnte nicht angelegt werden." }, { status: 500 });
  }
}
