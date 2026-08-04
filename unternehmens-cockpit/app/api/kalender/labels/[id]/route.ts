import { NextRequest } from "next/server";
import { aendereKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { MIN_LABELS, labelNutzung, nutzungText, textfarbeZu, validiereLabel } from "@/lib/kalender-labels";

type Kontext = { params: Promise<{ id: string }> };

// PATCH /api/kalender/labels/[id] — ändert Name, Farbe, Gruppe oder Arbeitsflag.
export async function PATCH(request: NextRequest, { params }: Kontext) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const geprueft = validiereLabel(await request.json());
    if (!geprueft.ok) return Response.json({ fehler: geprueft.fehler }, { status: 400 });

    const ergebnis = await aendereKalender((daten) => {
      const label = daten.labels.find((l) => l.id === id);
      if (!label) return { status: 404 as const, fehler: "Label nicht gefunden." };

      // Schriftfarbe nur neu berechnen, wenn sich die Farbe tatsächlich geändert hat — sonst
      // würde ein reines Umbenennen die von Hand austarierte Schriftfarbe überschreiben.
      const text = geprueft.wert.farbe === label.farbe ? label.text : textfarbeZu(geprueft.wert.farbe);
      Object.assign(label, geprueft.wert, { text });
      return { status: 200 as const, label, aenderungszaehler: daten.aenderungszaehler + 1 };
    });

    if (ergebnis.status !== 200) {
      return Response.json({ fehler: ergebnis.fehler }, { status: ergebnis.status });
    }
    return Response.json({ label: ergebnis.label, aenderungszaehler: ergebnis.aenderungszaehler });
  } catch (err) {
    console.error("Fehler beim Ändern eines Labels:", err);
    return Response.json({ fehler: "Label konnte nicht geändert werden." }, { status: 500 });
  }
}

// DELETE /api/kalender/labels/[id] — löscht ein Label, wenn es niemand mehr benutzt.
export async function DELETE(request: NextRequest, { params }: Kontext) {
  const person = personAusHeadern(request.headers);
  if (!person) {
    return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });
  }

  try {
    const { id } = await params;

    const ergebnis = await aendereKalender((daten) => {
      const label = daten.labels.find((l) => l.id === id);
      if (!label) return { status: 404 as const, fehler: "Label nicht gefunden." };

      if (daten.labels.length <= MIN_LABELS) {
        return { status: 409 as const, fehler: "Das letzte Label lässt sich nicht löschen." };
      }

      const nutzung = labelNutzung(daten, id);
      if (nutzung.termine > 0 || nutzung.serien > 0 || nutzung.vorlagen > 0) {
        return {
          status: 409 as const,
          fehler: `Wird noch von ${nutzungText(nutzung)} benutzt.`,
        };
      }

      daten.labels = daten.labels.filter((l) => l.id !== id);
      return { status: 200 as const, aenderungszaehler: daten.aenderungszaehler + 1 };
    });

    if (ergebnis.status !== 200) {
      return Response.json({ fehler: ergebnis.fehler }, { status: ergebnis.status });
    }
    return Response.json({ aenderungszaehler: ergebnis.aenderungszaehler });
  } catch (err) {
    console.error("Fehler beim Löschen eines Labels:", err);
    return Response.json({ fehler: "Label konnte nicht gelöscht werden." }, { status: 500 });
  }
}
