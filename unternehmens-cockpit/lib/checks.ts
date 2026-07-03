import { CockpitData } from "./types";

// Eine Warnung für den Warnbereich. Bewusst datenklassen-rein (kein HTTP/DOM),
// damit sowohl die API-Route als auch später ein Cronjob (E-Mail/Telegram)
// exakt dieselbe Logik nutzen können — ohne Umbau.
export interface Warnung {
  dienstId: string | null;
  dienstName: string;
  schwere: "hoch" | "mittel"; // hoch = rot, mittel = gelb
  titel: string;
  detail: string;
}

// Tage zwischen heute und einem ISO-Datum (positiv = in der Zukunft, negativ = überfällig).
function tageBis(isoDatum: string, heute: Date): number {
  const ziel = new Date(isoDatum + "T00:00:00");
  const start = new Date(heute.toISOString().slice(0, 10) + "T00:00:00");
  return Math.round((ziel.getTime() - start.getTime()) / 86_400_000);
}

// Ermittelt alle aktuellen Warnungen: Status "Handlung nötig", Fälligkeit < 30 Tage,
// und Claude-Restguthaben unter Schwelle. `heute` ist injizierbar (Tests / Cronjob).
export function berechneWarnungen(daten: CockpitData, heute: Date = new Date()): Warnung[] {
  const warnungen: Warnung[] = [];

  for (const d of daten.dienste) {
    // 1) Status "Handlung nötig"
    if (d.statusAmpel === "handlung") {
      warnungen.push({
        dienstId: d.id,
        dienstName: d.name,
        schwere: "hoch",
        titel: `${d.name}: Handlung nötig`,
        detail: d.notiz || "Als handlungsbedürftig markiert.",
      });
    }

    // 2) Fälligkeit < 30 Tage (oder bereits überfällig)
    if (d.naechsteFaelligkeit) {
      const tage = tageBis(d.naechsteFaelligkeit, heute);
      if (tage < 0) {
        warnungen.push({
          dienstId: d.id,
          dienstName: d.name,
          schwere: "hoch",
          titel: `${d.name}: Fälligkeit überschritten`,
          detail: `Fällig war ${d.naechsteFaelligkeit} (vor ${Math.abs(tage)} Tagen).`,
        });
      } else if (tage < 30) {
        warnungen.push({
          dienstId: d.id,
          dienstName: d.name,
          schwere: "mittel",
          titel: `${d.name}: Fälligkeit in ${tage} Tag(en)`,
          detail: `Nächste Fälligkeit am ${d.naechsteFaelligkeit}.`,
        });
      }
    }

    // 3) Claude-API: geschätztes Restguthaben unter Schwelle
    const c = d.claude;
    if (c && c.schwelleUsd != null && c.restguthabenGeschaetztUsd != null) {
      if (c.restguthabenGeschaetztUsd < c.schwelleUsd) {
        warnungen.push({
          dienstId: d.id,
          dienstName: d.name,
          schwere: "hoch",
          titel: `${d.name}: geschätztes Restguthaben unter Schwelle`,
          detail:
            `Geschätzt ~${c.restguthabenGeschaetztUsd.toFixed(2)} USD, Schwelle ${c.schwelleUsd.toFixed(2)} USD. ` +
            `In der Anthropic Console nachladen, sonst stoppen die wöchentlichen Blogposts.`,
        });
      }
    }
  }

  return warnungen;
}
