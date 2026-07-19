import { ladeDaten, speichereDaten } from "./db";
import { holeKundenVerbrauch } from "./retell-kunden";
import type { KundenMonatSnapshot, KundenVerbrauchEintrag } from "./types";

// Deckelt die Anzahl gespeicherter Monate (~2 Jahre), analog zu Dienst.verlauf.
const MAX_MONATE = 24;

export function findeGefrorenenMonat(
  monate: KundenMonatSnapshot[] | undefined,
  monat: string,
): KundenMonatSnapshot | undefined {
  return monate?.find((s) => s.monat === monat);
}

// Hängt einen neuen Monats-Snapshot an bzw. ersetzt einen gleichnamigen (sollte nicht
// vorkommen, da abgeschlossene Monate nie neu eingefroren werden — Absicherung trotzdem).
function fuegeGefrorenenMonatHinzu(
  bestehende: KundenMonatSnapshot[] | undefined,
  snapshot: KundenMonatSnapshot,
): KundenMonatSnapshot[] {
  const ohneMonat = (bestehende ?? []).filter((s) => s.monat !== snapshot.monat);
  return [...ohneMonat, snapshot].sort((a, b) => a.monat.localeCompare(b.monat)).slice(-MAX_MONATE);
}

export interface MonatVerbrauchErgebnis {
  ok: boolean;
  kunden: KundenVerbrauchEintrag[];
  eingefrorenAm: string | null;
  neuEingefroren: boolean;
  keinKey: boolean;
  fehler: string | null;
}

// Liefert den Kunden-Verbrauch eines ABGESCHLOSSENEN Monats: aus dem eingefrorenen Snapshot,
// falls vorhanden — sonst einmalig live von Retell abrufen und dauerhaft einfrieren.
// Nur für vergangene Monate gedacht; der laufende Monat wird nie eingefroren (siehe
// holeKundenVerbrauch direkt in app/api/retell/kunden/route.ts).
export async function holeOderFriereMonatEin(
  monat: string,
  vonMs: number,
  bisMs: number,
): Promise<MonatVerbrauchErgebnis> {
  const daten = await ladeDaten();
  const bestehend = findeGefrorenenMonat(daten.kundenVerbrauch, monat);
  if (bestehend) {
    return {
      ok: true,
      kunden: bestehend.kunden,
      eingefrorenAm: bestehend.eingefrorenAm,
      neuEingefroren: false,
      keinKey: false,
      fehler: null,
    };
  }

  const ergebnis = await holeKundenVerbrauch(vonMs, bisMs);
  if (!ergebnis.ok) {
    return {
      ok: false,
      kunden: [],
      eingefrorenAm: null,
      neuEingefroren: false,
      keinKey: ergebnis.keinKey,
      fehler: ergebnis.fehler,
    };
  }

  const snapshot: KundenMonatSnapshot = { monat, eingefrorenAm: new Date().toISOString(), kunden: ergebnis.kunden };
  daten.kundenVerbrauch = fuegeGefrorenenMonatHinzu(daten.kundenVerbrauch, snapshot);
  await speichereDaten(daten);

  return {
    ok: true,
    kunden: snapshot.kunden,
    eingefrorenAm: snapshot.eingefrorenAm,
    neuEingefroren: true,
    keinKey: false,
    fehler: null,
  };
}
