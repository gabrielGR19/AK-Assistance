import { holeKundenVerbrauch } from "@/lib/retell-kunden";
import { holeOderFriereMonatEin } from "@/lib/kunden-verlauf";
import { monatsBereichMs } from "@/lib/monat";
import type { KundenVerbrauchEintrag } from "@/lib/types";

// GET /api/retell/kunden?monat=YYYY-MM&format=csv
// Call-Minuten und -Kosten pro Kunde (Retell-Agent) für einen Monat — Standard: laufender
// Monat bis jetzt. Dient als Beleg für die individuelle monatliche Kundenabrechnung.
//
// Laufender Monat: immer live von Retell (läuft ja noch, kein fester Wert möglich).
// Vergangener Monat: aus dem eingefrorenen Snapshot, oder beim ersten Abruf einmalig
// eingefroren — damit die Abrechnungsgrundlage sich später nicht mehr ändert.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { vonMs, bisMs, monat, istLaufenderMonat } = monatsBereichMs(searchParams.get("monat"));

  let kunden: KundenVerbrauchEintrag[];
  let eingefrorenAm: string | null = null;

  if (istLaufenderMonat) {
    const ergebnis = await holeKundenVerbrauch(vonMs, bisMs);
    if (!ergebnis.ok) {
      return Response.json(
        { fehler: ergebnis.fehler ?? "Abruf fehlgeschlagen.", keinKey: ergebnis.keinKey },
        { status: ergebnis.keinKey ? 400 : 502 },
      );
    }
    kunden = ergebnis.kunden;
  } else {
    const ergebnis = await holeOderFriereMonatEin(monat, vonMs, bisMs);
    if (!ergebnis.ok) {
      return Response.json(
        { fehler: ergebnis.fehler ?? "Abruf fehlgeschlagen.", keinKey: ergebnis.keinKey },
        { status: ergebnis.keinKey ? 400 : 502 },
      );
    }
    kunden = ergebnis.kunden;
    eingefrorenAm = ergebnis.eingefrorenAm;
  }

  if (searchParams.get("format") === "csv") {
    return new Response(zuCsv(monat, kunden), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="retell-kunden-${monat}.csv"`,
      },
    });
  }

  return Response.json({ monat, kunden, eingefrorenAm });
}

function zuCsv(monat: string, kunden: KundenVerbrauchEintrag[]): string {
  const kopf = "Kunde;Anzahl Calls;Minuten;Kosten USD;Monat";
  const zeilen = kunden.map(
    (k) =>
      `${k.agentName.replace(/;/g, ",")};${k.anzahlCalls};${k.minuten.toFixed(2).replace(".", ",")};${k.kostenUsd
        .toFixed(2)
        .replace(".", ",")};${monat}`,
  );
  return [kopf, ...zeilen].join("\n");
}
