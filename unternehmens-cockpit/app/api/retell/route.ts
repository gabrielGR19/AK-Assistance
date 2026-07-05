import { ladeDaten } from "@/lib/db";
import { fuehreLiveAbrufAus } from "@/lib/live/runner";
import { retellProvider } from "@/lib/live/retell-provider";
import type { CockpitData, Dienst } from "@/lib/types";

// Findet den Retell-Dienst über seine feste Seed-ID.
function findeRetell(daten: CockpitData): Dienst | undefined {
  return daten.dienste.find((d) => d.id === "retell");
}

// POST /api/retell — Live-Abruf der Call-Kosten des laufenden Monats über die Retell-API.
export async function POST() {
  try {
    const daten = await ladeDaten();
    const d = findeRetell(daten);
    if (!d) {
      return Response.json({ fehler: "Retell-Dienst nicht gefunden." }, { status: 404 });
    }

    const ergebnis = await fuehreLiveAbrufAus(daten, d, retellProvider);
    if (ergebnis.typ === "voraussetzung_fehlt") {
      return Response.json({ fehler: ergebnis.fehler }, { status: 400 });
    }

    return Response.json({ daten: ergebnis.daten, live: ergebnis.live });
  } catch (err) {
    console.error("Fehler beim Live-Abruf der Retell-Kosten:", err);
    return Response.json({ fehler: "Live-Abruf fehlgeschlagen." }, { status: 500 });
  }
}
