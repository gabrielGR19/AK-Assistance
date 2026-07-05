import { NextRequest } from "next/server";
import { ladeDaten } from "@/lib/db";
import { fuehreLiveAbrufAus } from "@/lib/live/runner";
import { findeProvider } from "@/lib/live/registry";

// In Next 16 sind Route-Params asynchron (Promise), daher await auf ctx.params.
type Kontext = { params: Promise<{ id: string }> };

// POST /api/live/[id] — generischer Live-Abruf für jeden Dienst mit registriertem
// Live-Provider (lib/live/registry.ts). Ersetzt die früheren dienst-spezifischen
// Routen als gemeinsamen Einstiegspunkt für Button-Klicks und n8n-Scheduling.
export async function POST(_request: NextRequest, ctx: Kontext) {
  try {
    const { id } = await ctx.params;
    const provider = findeProvider(id);
    if (!provider) {
      return Response.json({ fehler: "Kein Live-Provider für diesen Dienst registriert." }, { status: 404 });
    }

    const daten = await ladeDaten();
    const d = daten.dienste.find((x) => x.id === id);
    if (!d) {
      return Response.json({ fehler: "Dienst nicht gefunden." }, { status: 404 });
    }

    const ergebnis = await fuehreLiveAbrufAus(daten, d, provider);
    if (ergebnis.typ === "voraussetzung_fehlt") {
      return Response.json({ fehler: ergebnis.fehler }, { status: 400 });
    }

    return Response.json({ daten: ergebnis.daten, live: ergebnis.live });
  } catch (err) {
    console.error("Fehler beim generischen Live-Abruf:", err);
    return Response.json({ fehler: "Live-Abruf fehlgeschlagen." }, { status: 500 });
  }
}
