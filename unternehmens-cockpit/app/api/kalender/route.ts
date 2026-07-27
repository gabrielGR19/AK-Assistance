import { NextRequest } from "next/server";
import { ladeKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { expandiereSerien } from "@/lib/kalender-serien";
import { istEchtesDatum } from "@/lib/kalender-termine";

const DATUM = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/kalender?von=YYYY-MM-DD&bis=YYYY-MM-DD
//
// Liefert alles, was die Ansicht für diesen Zeitraum braucht — Termine BEIDER Personen,
// inklusive der aus Serienregeln aufgelösten Vorkommen. Wer was ändern darf, entscheidet
// weiterhin der Server bei jedem Schreibzugriff; hier geht es nur ums Anzeigen.
//
// `aenderungszaehler` ist der Wert, gegen den der Browser pollt: bleibt er gleich, hat sich
// nichts geändert und die Ansicht muss nicht neu aufgebaut werden.
export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const von = p.get("von") ?? "";
    const bis = p.get("bis") ?? "";

    if (!DATUM.test(von) || !DATUM.test(bis) || !istEchtesDatum(von) || !istEchtesDatum(bis)) {
      return Response.json({ fehler: "von und bis müssen gültige Daten im Format YYYY-MM-DD sein." }, { status: 400 });
    }
    if (bis < von) {
      return Response.json({ fehler: "bis darf nicht vor von liegen." }, { status: 400 });
    }

    const daten = await ladeKalender();

    // Gespeicherte Einzeltermine des Zeitraums …
    const einzeln = daten.termine.filter((t) => {
      const tag = t.start.slice(0, 10);
      return tag >= von && tag <= bis;
    });
    // … plus die für diesen Zeitraum berechneten Serien-Vorkommen.
    const ausSerien = expandiereSerien(daten.serien, von, bis);

    const termine = [...einzeln, ...ausSerien].sort((a, b) => a.start.localeCompare(b.start));

    const ganztags = daten.ganztags.filter((g) => g.bis >= von && g.von <= bis);

    return Response.json({
      // Wer bin ich? Der Client kann das nicht selbst wissen — die Identität steckt in der
      // Basic-Auth, nicht in einer Session, die JavaScript lesen könnte.
      ich: personAusHeadern(request.headers),
      aenderungszaehler: daten.aenderungszaehler,
      von,
      bis,
      termine,
      ganztags,
      serien: daten.serien,
      reflexionen: daten.reflexionen,
      pensumSoll: daten.pensumSoll,
      vorlagen: daten.vorlagen,
    });
  } catch (err) {
    console.error("Fehler beim Laden des Kalenders:", err);
    return Response.json({ fehler: "Kalender konnte nicht geladen werden." }, { status: 500 });
  }
}
