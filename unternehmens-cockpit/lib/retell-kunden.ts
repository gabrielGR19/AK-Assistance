import { holeAlleCallsImZeitraum } from "./retell";
import type { KundenVerbrauchEintrag } from "./types";

export interface KundenVerbrauchErgebnis {
  ok: boolean;
  kunden: KundenVerbrauchEintrag[];
  keinKey: boolean;
  fehler: string | null;
}

// Gruppiert alle Calls im Zeitraum nach Retell-Agent und summiert Dauer + Kosten pro Kunde.
// Grundlage für die monatliche Kundenabrechnung: legitimiert, wie viele Minuten/Kosten
// ein einzelner Kunden-Agent im Zeitraum verursacht hat.
export async function holeKundenVerbrauch(vonMs: number, bisMs: number): Promise<KundenVerbrauchErgebnis> {
  const ergebnis = await holeAlleCallsImZeitraum(vonMs, bisMs);
  if (!ergebnis.ok) {
    return { ok: false, kunden: [], keinKey: ergebnis.keinKey, fehler: ergebnis.fehler };
  }

  const proAgent = new Map<string, KundenVerbrauchEintrag>();

  // Calls kommen absteigend sortiert (neueste zuerst) aus holeAlleCallsImZeitraum, daher
  // liefert der erste Treffer pro Agent bereits den aktuellsten agent_name (falls umbenannt).
  for (const roh of ergebnis.calls) {
    const c = roh as {
      agent_id?: string;
      agent_name?: string;
      duration_ms?: number;
      call_cost?: { combined_cost?: number };
    };
    if (!c.agent_id) continue;

    const dauerMin = typeof c.duration_ms === "number" ? c.duration_ms / 60_000 : 0;
    const kostenUsd = typeof c.call_cost?.combined_cost === "number" ? c.call_cost.combined_cost / 100 : 0;

    const bestehend = proAgent.get(c.agent_id);
    if (bestehend) {
      bestehend.anzahlCalls += 1;
      bestehend.minuten += dauerMin;
      bestehend.kostenUsd += kostenUsd;
    } else {
      proAgent.set(c.agent_id, {
        agentId: c.agent_id,
        agentName: c.agent_name || c.agent_id,
        anzahlCalls: 1,
        minuten: dauerMin,
        kostenUsd,
      });
    }
  }

  const kunden = Array.from(proAgent.values()).sort((a, b) => b.kostenUsd - a.kostenUsd);
  return { ok: true, kunden, keinKey: false, fehler: null };
}
