import { NextRequest } from "next/server";
import { aendereKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { darfVorlageAendern, validiereVorlage } from "@/lib/kalender-vorlagen";
import { erlaubteLabels } from "@/lib/kalender-labels";

type Kontext = { params: Promise<{ id: string }> };

// PATCH /api/kalender/vorlagen/[id] — ändert eine eigene Vorlage.
export async function PATCH(request: NextRequest, { params }: Kontext) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const roh = await request.json();

    const ergebnis = await aendereKalender((daten) => {
      // Gegen den Stand IN dieser Sperre prüfen, nicht gegen einen separat geladenen — sonst
      // könnte ein Label zwischen Prüfung und Schreiben verschwinden.
      const geprueft = validiereVorlage(roh, erlaubteLabels(daten));
      if (!geprueft.ok) return { status: 400 as const, fehler: geprueft.fehler };

      const vorlage = daten.vorlagen.find((v) => v.id === id);
      if (!vorlage) return { status: 404 as const, fehler: "Vorlage nicht gefunden." };
      // Rechteprüfung serverseitig, nicht nur im UI.
      if (!darfVorlageAendern(vorlage, person)) {
        return { status: 403 as const, fehler: "Das ist die Vorlage des anderen." };
      }
      Object.assign(vorlage, geprueft.wert);
      return { status: 200 as const, vorlage, aenderungszaehler: daten.aenderungszaehler + 1 };
    });

    if (ergebnis.status !== 200) {
      return Response.json({ fehler: ergebnis.fehler }, { status: ergebnis.status });
    }
    return Response.json({ vorlage: ergebnis.vorlage, aenderungszaehler: ergebnis.aenderungszaehler });
  } catch (err) {
    console.error("Fehler beim Ändern einer Vorlage:", err);
    return Response.json({ fehler: "Vorlage konnte nicht geändert werden." }, { status: 500 });
  }
}

// DELETE /api/kalender/vorlagen/[id] — löscht eine eigene Vorlage.
export async function DELETE(request: NextRequest, { params }: Kontext) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const { id } = await params;

    const ergebnis = await aendereKalender((daten) => {
      const vorlage = daten.vorlagen.find((v) => v.id === id);
      if (!vorlage) return { status: 404 as const, fehler: "Vorlage nicht gefunden." };
      if (!darfVorlageAendern(vorlage, person)) {
        return { status: 403 as const, fehler: "Das ist die Vorlage des anderen." };
      }
      daten.vorlagen = daten.vorlagen.filter((v) => v.id !== id);
      return { status: 200 as const, aenderungszaehler: daten.aenderungszaehler + 1 };
    });

    if (ergebnis.status !== 200) {
      return Response.json({ fehler: ergebnis.fehler }, { status: ergebnis.status });
    }
    return Response.json({ aenderungszaehler: ergebnis.aenderungszaehler });
  } catch (err) {
    console.error("Fehler beim Löschen einer Vorlage:", err);
    return Response.json({ fehler: "Vorlage konnte nicht gelöscht werden." }, { status: 500 });
  }
}
