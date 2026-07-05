import type { Abrechnungsmodell, CockpitData } from "./types";

// Reine Funktion (kein HTTP/DOM) — dieselbe Logik nutzt sowohl die API-Route als auch
// künftig ein n8n-Cronjob, ohne Umbau (Muster wie lib/checks.ts).
export interface Erinnerung {
  dienstId: string;
  dienstName: string;
  faelligSeitTagen: number;
  abrechnungsmodell: Abrechnungsmodell;
}

// Ab wie vielen Tagen seit `letzteAenderung` ein manuell gepflegter Dienst als fällig gilt —
// gestaffelt nach Abrechnungsmodell statt eines pauschalen Werts für alle.
const SCHWELLE_TAGE: Record<Abrechnungsmodell, number> = {
  monatlich: 35,
  jaehrlich: 370,
  verbrauch: 14,
};

// Tage seit einem ISO-Zeitstempel bis jetzt.
function tageHer(iso: string, jetzt: Date): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((jetzt.getTime() - d.getTime()) / 86_400_000);
}

// Ermittelt alle manuell gepflegten Dienste, deren letzte Änderung die für ihr
// Abrechnungsmodell geltende Schwelle überschritten hat. Live-Dienste haben ihre eigene
// Frische-Logik über abrufStatus und sind hier nicht relevant.
export function berechneFaelligeErinnerungen(daten: CockpitData, heute: Date = new Date()): Erinnerung[] {
  const erinnerungen: Erinnerung[] = [];

  for (const d of daten.dienste) {
    if (d.herkunft !== "manuell") continue;
    const schwelle = SCHWELLE_TAGE[d.abrechnungsmodell];
    const tage = tageHer(d.letzteAenderung, heute);
    if (tage > schwelle) {
      erinnerungen.push({
        dienstId: d.id,
        dienstName: d.name,
        faelligSeitTagen: tage,
        abrechnungsmodell: d.abrechnungsmodell,
      });
    }
  }

  return erinnerungen;
}
