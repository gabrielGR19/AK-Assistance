import { NextRequest } from "next/server";
import { aendereKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { leseImport } from "@/lib/kalender-import";

// POST /api/kalender/import — Sicherung einspielen.
//
// Ersetzt ausschließlich die Einträge der importierenden Person. Die des anderen bleiben
// unangetastet — ein Import ist keine Wiederherstellung des ganzen Servers, dafür gibt es
// die nächtliche Sicherung.
export async function POST(request: NextRequest) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const geprueft = leseImport(await request.json(), person);
    if (!geprueft.ok) return Response.json({ fehler: geprueft.fehler }, { status: 400 });
    const neu = geprueft.wert;

    const bericht = await aendereKalender((daten) => {
      daten.termine = [...daten.termine.filter((t) => t.besitzer !== person), ...neu.termine];
      daten.serien = [...daten.serien.filter((s) => s.besitzer !== person), ...neu.serien];
      daten.ganztags = [...daten.ganztags.filter((g) => g.besitzer !== person), ...neu.ganztags];
      daten.vorlagen = [...daten.vorlagen.filter((v) => v.besitzer !== person), ...neu.vorlagen];
      daten.reflexionen[person] = neu.reflexionen;
      if (neu.pensumSoll !== null) daten.pensumSoll[person] = neu.pensumSoll;
      return {
        termine: neu.termine.length,
        serien: neu.serien.length,
        ganztags: neu.ganztags.length,
        vorlagen: neu.vorlagen.length,
        reflexionen: Object.keys(neu.reflexionen).length,
        uebersprungen: neu.uebersprungen,
        aenderungszaehler: daten.aenderungszaehler + 1,
      };
    });

    return Response.json(bericht);
  } catch (err) {
    console.error("Fehler beim Import des Kalenders:", err);
    return Response.json({ fehler: "Import nicht möglich — ist die Datei gültiges JSON?" }, { status: 500 });
  }
}
