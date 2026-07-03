import { ladeDaten, speichereDaten } from "@/lib/db";
import { holeVerbrauchMonat } from "@/lib/retell";
import type { CockpitData, Dienst } from "@/lib/types";

// Findet den Retell-Dienst über seine feste Seed-ID.
function findeRetell(daten: CockpitData): Dienst | undefined {
  return daten.dienste.find((d) => d.id === "retell");
}

// Erster Tag des laufenden Monats um 00:00 UTC als Millisekunden-Epoch.
function monatsanfangMs(): number {
  const jetzt = new Date();
  return Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth(), 1);
}

// POST /api/retell — Live-Abruf der Call-Kosten des laufenden Monats über die Retell-API.
// Kein Key oder Fehler → sauberer, sichtbarer Fallback; alter Wert wird nie als aktuell ausgegeben.
export async function POST() {
  try {
    const daten = await ladeDaten();
    const d = findeRetell(daten);
    if (!d) {
      return Response.json({ fehler: "Retell-Dienst nicht gefunden." }, { status: 404 });
    }

    const ergebnis = await holeVerbrauchMonat(monatsanfangMs());

    if (ergebnis.keinKey) {
      // Live nicht konfiguriert — kein Fehlerzustand am Datensatz, nur Info an die UI.
      return Response.json({ daten, live: { ok: false, keinKey: true, fehler: ergebnis.fehler } });
    }

    if (!ergebnis.ok || ergebnis.verbrauchUsd == null) {
      // Abruf fehlgeschlagen: markieren, damit der alte Wert nicht als aktuell erscheint.
      d.abrufStatus = "fehlgeschlagen";
      await speichereDaten(daten);
      return Response.json({ daten, live: { ok: false, keinKey: false, fehler: ergebnis.fehler } });
    }

    d.betrag = ergebnis.verbrauchUsd;
    d.waehrung = "USD";
    d.herkunft = "live";
    d.abrufStatus = "ok";
    d.letzterAbruf = new Date().toISOString();
    d.letzteAenderung = d.letzterAbruf;

    await speichereDaten(daten);
    return Response.json({ daten, live: { ok: true, keinKey: false, fehler: null } });
  } catch (err) {
    console.error("Fehler beim Live-Abruf der Retell-Kosten:", err);
    return Response.json({ fehler: "Live-Abruf fehlgeschlagen." }, { status: 500 });
  }
}
