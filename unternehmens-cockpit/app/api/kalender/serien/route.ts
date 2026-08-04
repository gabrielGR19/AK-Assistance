import { NextRequest } from "next/server";
import { aendereKalender, ladeKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { validiereSerie } from "@/lib/kalender-serien";
import { erlaubteLabels } from "@/lib/kalender-labels";

// POST /api/kalender/serien — legt eine Serienregel an ("jeden Tag 11:00", "Di+Mi 09:00").
//
// Gespeichert wird die Regel, nicht 365 Einzeltermine. Die Vorkommen berechnet
// lib/kalender-serien.ts beim Anzeigen.
export async function POST(request: NextRequest) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const roh = (await request.json()) as Record<string, unknown>;
    const erlaubt = erlaubteLabels(await ladeKalender());

    // id und Besitzer setzt der Server. Käme der Besitzer aus der Anfrage, könnte man
    // Serien im Namen des anderen anlegen.
    const geprueft = validiereSerie(
      {
        ...roh,
        id: "s" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
        besitzer: person,
        notiz: typeof roh.notiz === "string" ? roh.notiz : "",
        ausnahmen: [],
      },
      erlaubt,
    );
    if (!geprueft.ok) return Response.json({ fehler: geprueft.fehler }, { status: 400 });

    const zaehler = await aendereKalender((daten) => {
      daten.serien.push(geprueft.wert);
      return daten.aenderungszaehler + 1;
    });

    return Response.json({ serie: geprueft.wert, aenderungszaehler: zaehler }, { status: 201 });
  } catch (err) {
    console.error("Fehler beim Anlegen einer Serie:", err);
    return Response.json({ fehler: "Serie konnte nicht angelegt werden." }, { status: 500 });
  }
}
