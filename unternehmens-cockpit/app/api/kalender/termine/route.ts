import { NextRequest } from "next/server";
import { aendereKalender, ladeKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { baueTermin, validiereTermin } from "@/lib/kalender-termine";
import { erlaubteLabels } from "@/lib/kalender-labels";

// POST /api/kalender/termine — legt genau einen Termin an.
//
// Bewusst ein Termin pro Anfrage statt "ganzen Kalender speichern": nur so können Gabriel und
// Moritz gleichzeitig eintragen, ohne sich gegenseitig zu überschreiben.
export async function POST(request: NextRequest) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    // Gegen den aktuellen Label-Stand prüfen, bevor die Schreibsperre überhaupt anläuft.
    const erlaubt = erlaubteLabels(await ladeKalender());
    const geprueft = validiereTermin(await request.json(), erlaubt);
    if (!geprueft.ok) return Response.json({ fehler: geprueft.fehler }, { status: 400 });

    // Der Besitzer kommt aus der Anmeldung, nie aus der Anfrage — sonst könnte man
    // Termine im Namen des anderen anlegen.
    const termin = baueTermin(geprueft.wert, person);
    const zaehler = await aendereKalender((daten) => {
      daten.termine.push(termin);
      return daten.aenderungszaehler + 1;
    });

    return Response.json({ termin, aenderungszaehler: zaehler }, { status: 201 });
  } catch (err) {
    console.error("Fehler beim Anlegen eines Termins:", err);
    return Response.json({ fehler: "Termin konnte nicht angelegt werden." }, { status: 500 });
  }
}
