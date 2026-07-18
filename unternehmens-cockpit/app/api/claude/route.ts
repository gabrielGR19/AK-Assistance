import { NextRequest } from "next/server";
import { ladeDaten, speichereDaten } from "@/lib/db";
import { berechneRest } from "@/lib/live/claude-provider";
import type { CockpitData, Dienst } from "@/lib/types";

// Findet den Claude-API-Dienst (der einzige mit gesetztem `claude`-Objekt).
function findeClaude(daten: CockpitData): Dienst | undefined {
  return daten.dienste.find((d) => d.claude);
}

// Validiert eine optionale, nicht-negative Zahl. undefined = Feld nicht mitgeschickt.
function zahlOderNull(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

// PUT /api/claude — manuelle Pflege: Guthaben-Basis (USD + Datum), Warnschwelle
// und als Fallback der Verbrauch von Hand. Recomputet das geschätzte Restguthaben.
export async function PUT(request: NextRequest) {
  try {
    const roh = await request.json();
    const daten = await ladeDaten();
    const d = findeClaude(daten);
    if (!d || !d.claude) {
      return Response.json({ fehler: "Claude-Dienst nicht gefunden." }, { status: 404 });
    }

    const basis = zahlOderNull(roh?.guthabenBasisUsd);
    const schwelle = zahlOderNull(roh?.schwelleUsd);
    const verbrauch = zahlOderNull(roh?.verbrauchManuellUsd);
    if (Number.isNaN(basis) || Number.isNaN(schwelle) || Number.isNaN(verbrauch)) {
      return Response.json({ fehler: "Beträge müssen Zahlen ≥ 0 oder leer sein." }, { status: 400 });
    }

    const datum = roh?.guthabenBasisDatum;
    if (datum !== undefined && datum !== null && datum !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
      return Response.json({ fehler: "Basis-Datum muss im Format JJJJ-MM-TT sein." }, { status: 400 });
    }

    if (basis !== undefined) d.claude.guthabenBasisUsd = basis;
    if (schwelle !== undefined) d.claude.schwelleUsd = schwelle;
    if (datum !== undefined) d.claude.guthabenBasisDatum = datum === "" ? null : datum;
    if (verbrauch !== undefined) {
      // Manueller Verbrauch ist der Fallback → Dienst gilt wieder als "manuell" gepflegt.
      d.claude.verbrauchSeitBasisUsd = verbrauch;
      d.herkunft = "manuell";
      d.abrufStatus = null;
      d.letzterAbruf = null;
    }
    d.letzteAenderung = new Date().toISOString();
    berechneRest(d);

    await speichereDaten(daten);
    return Response.json({ daten });
  } catch (err) {
    console.error("Fehler beim Speichern der Claude-Einstellungen:", err);
    return Response.json({ fehler: "Einstellungen konnten nicht gespeichert werden." }, { status: 500 });
  }
}
