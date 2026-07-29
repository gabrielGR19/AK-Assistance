import { NextRequest } from "next/server";
import { aendereKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { istLeer, validiereReflexion } from "@/lib/kalender-tagesstand";

// PUT /api/kalender/reflexion — Tagesabschluss eines einzelnen Tages setzen.
//
// Immer nur der eigene: die Person kommt aus der Anmeldung, nie aus der Anfrage. Der
// Tagesabschluss des anderen ist sichtbar, aber nicht änderbar (gleiche Regel wie bei
// Terminen).
export async function PUT(request: NextRequest) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const geprueft = validiereReflexion(await request.json());
    if (!geprueft.ok) return Response.json({ fehler: geprueft.fehler }, { status: 400 });

    const { datum, ab, notiz } = geprueft.wert;
    const zaehler = await aendereKalender((daten) => {
      if (istLeer({ ab, notiz })) delete daten.reflexionen[person][datum];
      else daten.reflexionen[person][datum] = { ab, notiz };
      return daten.aenderungszaehler + 1;
    });

    return Response.json({ datum, ab, notiz, aenderungszaehler: zaehler });
  } catch (err) {
    console.error("Fehler beim Speichern des Tagesabschlusses:", err);
    return Response.json({ fehler: "Tagesabschluss konnte nicht gespeichert werden." }, { status: 500 });
  }
}
