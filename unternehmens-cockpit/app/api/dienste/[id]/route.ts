import { NextRequest } from "next/server";
import { ladeDaten, speichereDaten } from "@/lib/db";
import { validiereEingabe, aktualisiereDienst, loescheDienst } from "@/lib/dienste";

// In Next 16 sind Route-Params asynchron (Promise), daher await auf ctx.params.
type Kontext = { params: Promise<{ id: string }> };

// PUT /api/dienste/[id] — aktualisiert einen bestehenden Dienst.
export async function PUT(request: NextRequest, ctx: Kontext) {
  try {
    const { id } = await ctx.params;
    const roh = await request.json();
    const geprueft = validiereEingabe(roh);
    if (!geprueft.ok) {
      return Response.json({ fehler: geprueft.fehler }, { status: 400 });
    }
    const daten = await ladeDaten();
    const aktualisiert = aktualisiereDienst(daten, id, geprueft.wert);
    if (!aktualisiert) {
      return Response.json({ fehler: "Dienst nicht gefunden." }, { status: 404 });
    }
    await speichereDaten(aktualisiert);
    return Response.json(aktualisiert);
  } catch (err) {
    console.error("Fehler beim Aktualisieren eines Dienstes:", err);
    return Response.json({ fehler: "Dienst konnte nicht aktualisiert werden." }, { status: 500 });
  }
}

// DELETE /api/dienste/[id] — löscht einen Dienst.
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/dienste/[id]">) {
  try {
    const { id } = await ctx.params;
    const daten = await ladeDaten();
    const aktualisiert = loescheDienst(daten, id);
    if (!aktualisiert) {
      return Response.json({ fehler: "Dienst nicht gefunden." }, { status: 404 });
    }
    await speichereDaten(aktualisiert);
    return Response.json(aktualisiert);
  } catch (err) {
    console.error("Fehler beim Löschen eines Dienstes:", err);
    return Response.json({ fehler: "Dienst konnte nicht gelöscht werden." }, { status: 500 });
  }
}
