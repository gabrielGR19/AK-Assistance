import { NextRequest } from "next/server";
import { aendereKalender } from "@/lib/kalender-db";
import { personAusHeadern } from "@/lib/benutzer";
import { baueTermin, istEchtesDatum, validiereTermin } from "@/lib/kalender-termine";

type Kontext = { params: Promise<{ id: string }> };

const DATUM = /^\d{4}-\d{2}-\d{2}$/;

// POST /api/kalender/serien/[id]/ausnahme
// Body: { datum: "YYYY-MM-DD", ersatz?: { titel, label, notiz, start, ende } }
//
// Deckt beide Fälle ab, die beim Antippen eines Serien-Vorkommens entstehen:
//   ohne `ersatz` → "nur dieses Vorkommen löschen"
//   mit  `ersatz` → "nur diesen Termin ändern": Vorkommen wird ausgeblendet und durch einen
//                   eigenständigen Einzeltermin ersetzt.
//
// Beides passiert in EINEM aendereKalender-Aufruf. Getrennt (erst Ausnahme, dann Termin)
// würde ein Abbruch dazwischen das Vorkommen ersatzlos verschwinden lassen.
export async function POST(request: NextRequest, { params }: Kontext) {
  const person = personAusHeadern(request.headers);
  if (!person) return Response.json({ fehler: "Kein Kalender-Zugang für diesen Benutzer." }, { status: 403 });

  try {
    const { id } = await params;
    const body = (await request.json()) as { datum?: unknown; ersatz?: unknown };
    const datum = body.datum;

    if (typeof datum !== "string" || !DATUM.test(datum) || !istEchtesDatum(datum)) {
      return Response.json({ fehler: "Es fehlt ein gültiges Datum (JJJJ-MM-TT)." }, { status: 400 });
    }

    // Ersatztermin außerhalb der Sperre prüfen — Validierung braucht keinen Dateizugriff.
    //
    // Der Ersatztermin darf bewusst an einem ANDEREN Tag liegen als das Vorkommen: wer ein
    // Serien-Vorkommen von Montag auf Dienstag zieht, erzeugt eine Ausnahme am Montag und
    // einen eigenständigen Termin am Dienstag. Eine Gleichheitsprüfung an dieser Stelle hat
    // genau diesen Zug abgelehnt, während derselbe Zug bei einem Einzeltermin funktionierte.
    let ersatzEingabe: ReturnType<typeof validiereTermin> | null = null;
    if (body.ersatz !== undefined && body.ersatz !== null) {
      ersatzEingabe = validiereTermin(body.ersatz);
      if (!ersatzEingabe.ok) return Response.json({ fehler: ersatzEingabe.fehler }, { status: 400 });
    }

    const ergebnis = await aendereKalender((daten) => {
      const serie = daten.serien.find((s) => s.id === id);
      if (!serie) return { status: 404 as const, fehler: "Serie nicht gefunden." };
      if (serie.besitzer !== person) {
        return { status: 403 as const, fehler: "Das ist die Serie des anderen — nur ansehen." };
      }

      if (!serie.ausnahmen.includes(datum)) serie.ausnahmen.push(datum);

      let termin = null;
      if (ersatzEingabe?.ok) {
        termin = { ...baueTermin(ersatzEingabe.wert, person), ausSerie: { serieId: serie.id, datum } };
        daten.termine.push(termin);
      }

      return { status: 200 as const, termin, aenderungszaehler: daten.aenderungszaehler + 1 };
    });

    if (ergebnis.status !== 200) return Response.json({ fehler: ergebnis.fehler }, { status: ergebnis.status });
    return Response.json({ termin: ergebnis.termin, aenderungszaehler: ergebnis.aenderungszaehler });
  } catch (err) {
    console.error("Fehler beim Setzen einer Serien-Ausnahme:", err);
    return Response.json({ fehler: "Das Vorkommen konnte nicht geändert werden." }, { status: 500 });
  }
}
