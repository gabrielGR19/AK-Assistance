import { NextRequest } from "next/server";
import { aendereKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { validiereSerie } from "@/lib/kalender-serien";

type Kontext = { params: Promise<{ id: string }> };

const FREMD = "Das ist die Serie des anderen — nur ansehen.";

// PATCH /api/kalender/serien/[id] — ändert eine eigene Serienregel (wirkt auf alle Vorkommen).
export async function PATCH(request: NextRequest, { params }: Kontext) {
  const person = personAusHeadern(request.headers);
  if (!person) return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });

  try {
    const { id } = await params;
    const roh = (await request.json()) as Record<string, unknown>;

    const ergebnis = await aendereKalender((daten) => {
      const index = daten.serien.findIndex((s) => s.id === id);
      if (index === -1) return { status: 404 as const, fehler: "Serie nicht gefunden." };
      const alt = daten.serien[index];
      if (alt.besitzer !== person) return { status: 403 as const, fehler: FREMD };

      // id, Besitzer und bestehende Ausnahmen bleiben serverseitig bestimmt.
      const geprueft = validiereSerie({ ...roh, id: alt.id, besitzer: alt.besitzer, ausnahmen: alt.ausnahmen });
      if (!geprueft.ok) return { status: 400 as const, fehler: geprueft.fehler };

      daten.serien[index] = geprueft.wert;
      return { status: 200 as const, serie: geprueft.wert, aenderungszaehler: daten.aenderungszaehler + 1 };
    });

    if (ergebnis.status !== 200) return Response.json({ fehler: ergebnis.fehler }, { status: ergebnis.status });
    return Response.json({ serie: ergebnis.serie, aenderungszaehler: ergebnis.aenderungszaehler });
  } catch (err) {
    console.error("Fehler beim Ändern einer Serie:", err);
    return Response.json({ fehler: "Serie konnte nicht geändert werden." }, { status: 500 });
  }
}

// DELETE /api/kalender/serien/[id] — löscht die ganze Serie.
//
// Einzeltermine, die per "nur diesen Termin" aus der Serie herausgelöst wurden, bleiben
// bestehen: sie sind eigenständige Einträge, die der Nutzer bewusst angefasst hat.
export async function DELETE(request: NextRequest, { params }: Kontext) {
  const person = personAusHeadern(request.headers);
  if (!person) return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });

  try {
    const { id } = await params;

    const ergebnis = await aendereKalender((daten) => {
      const serie = daten.serien.find((s) => s.id === id);
      if (!serie) return { status: 404 as const, fehler: "Serie nicht gefunden." };
      if (serie.besitzer !== person) return { status: 403 as const, fehler: FREMD };

      daten.serien = daten.serien.filter((s) => s.id !== id);
      return { status: 200 as const, aenderungszaehler: daten.aenderungszaehler + 1 };
    });

    if (ergebnis.status !== 200) return Response.json({ fehler: ergebnis.fehler }, { status: ergebnis.status });
    return Response.json({ aenderungszaehler: ergebnis.aenderungszaehler });
  } catch (err) {
    console.error("Fehler beim Löschen einer Serie:", err);
    return Response.json({ fehler: "Serie konnte nicht gelöscht werden." }, { status: 500 });
  }
}
