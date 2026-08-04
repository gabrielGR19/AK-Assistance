import { NextRequest } from "next/server";
import { aendereKalender, ladeKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { darfAendern, validiereTermin } from "@/lib/kalender-termine";
import { erlaubteLabels } from "@/lib/kalender-labels";

type Kontext = { params: Promise<{ id: string }> };

// PATCH /api/kalender/termine/[id] — ändert genau einen eigenen Termin.
export async function PATCH(request: NextRequest, { params }: Kontext) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const erlaubt = erlaubteLabels(await ladeKalender());
    const geprueft = validiereTermin(await request.json(), erlaubt);
    if (!geprueft.ok) return Response.json({ fehler: geprueft.fehler }, { status: 400 });

    const ergebnis = await aendereKalender((daten) => {
      const termin = daten.termine.find((t) => t.id === id);
      if (!termin) return { status: 404 as const, fehler: "Termin nicht gefunden." };
      // Rechteprüfung serverseitig, nicht nur im UI: ein ausgeblendeter Knopf schützt nichts.
      if (!darfAendern(termin, person)) {
        return { status: 403 as const, fehler: "Das ist der Termin des anderen — nur ansehen." };
      }
      Object.assign(termin, geprueft.wert);
      return { status: 200 as const, termin, aenderungszaehler: daten.aenderungszaehler + 1 };
    });

    if (ergebnis.status !== 200) {
      return Response.json({ fehler: ergebnis.fehler }, { status: ergebnis.status });
    }
    return Response.json({ termin: ergebnis.termin, aenderungszaehler: ergebnis.aenderungszaehler });
  } catch (err) {
    console.error("Fehler beim Ändern eines Termins:", err);
    return Response.json({ fehler: "Termin konnte nicht geändert werden." }, { status: 500 });
  }
}

// DELETE /api/kalender/termine/[id] — löscht genau einen eigenen Termin.
export async function DELETE(request: NextRequest, { params }: Kontext) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const { id } = await params;

    const ergebnis = await aendereKalender((daten) => {
      const termin = daten.termine.find((t) => t.id === id);
      if (!termin) return { status: 404 as const, fehler: "Termin nicht gefunden." };
      if (!darfAendern(termin, person)) {
        return { status: 403 as const, fehler: "Das ist der Termin des anderen — nur ansehen." };
      }
      daten.termine = daten.termine.filter((t) => t.id !== id);
      return { status: 200 as const, aenderungszaehler: daten.aenderungszaehler + 1 };
    });

    if (ergebnis.status !== 200) {
      return Response.json({ fehler: ergebnis.fehler }, { status: ergebnis.status });
    }
    return Response.json({ aenderungszaehler: ergebnis.aenderungszaehler });
  } catch (err) {
    console.error("Fehler beim Löschen eines Termins:", err);
    return Response.json({ fehler: "Termin konnte nicht gelöscht werden." }, { status: 500 });
  }
}
