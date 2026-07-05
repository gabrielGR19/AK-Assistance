import { speichereDaten } from "@/lib/db";
import type { CockpitData, Dienst } from "@/lib/types";
import type { LiveProvider } from "./types";

export interface LiveInfo {
  ok: boolean;
  keinKey: boolean;
  fehler: string | null;
}

export type LiveAbrufErgebnis =
  | { typ: "voraussetzung_fehlt"; fehler: string }
  | { typ: "abgeschlossen"; daten: CockpitData; live: LiveInfo };

// Führt den Live-Abruf für einen Dienst über seinen Provider aus und schreibt das
// Ergebnis persistent zurück. Grundregel (wie zuvor in den Einzel-Routen): ein alter
// Live-Wert wird NIE als aktuell ausgegeben — kein Key → sauberer Fallback ohne
// Fehlerzustand, Fehler → abrufStatus="fehlgeschlagen", Erfolg → herkunft="live" +
// abrufStatus="ok" + Zeitstempel.
export async function fuehreLiveAbrufAus(
  daten: CockpitData,
  d: Dienst,
  provider: LiveProvider,
): Promise<LiveAbrufErgebnis> {
  const voraussetzung = provider.pruefeVoraussetzung?.(d);
  if (voraussetzung) {
    return { typ: "voraussetzung_fehlt", fehler: voraussetzung };
  }

  const ergebnis = await provider.holeVerbrauch(d);

  if (ergebnis.keinKey) {
    // Live nicht konfiguriert — kein Fehlerzustand am Datensatz, nur Info an die UI.
    return { typ: "abgeschlossen", daten, live: { ok: false, keinKey: true, fehler: ergebnis.fehler } };
  }

  if (!ergebnis.ok || ergebnis.verbrauchUsd == null) {
    // Abruf fehlgeschlagen: markieren, damit der alte Wert nicht als aktuell erscheint.
    d.abrufStatus = "fehlgeschlagen";
    await speichereDaten(daten);
    return { typ: "abgeschlossen", daten, live: { ok: false, keinKey: false, fehler: ergebnis.fehler } };
  }

  provider.wendeErgebnisAn(d, ergebnis);
  d.herkunft = "live";
  d.abrufStatus = "ok";
  d.letzterAbruf = new Date().toISOString();
  d.letzteAenderung = d.letzterAbruf;

  await speichereDaten(daten);
  return { typ: "abgeschlossen", daten, live: { ok: true, keinKey: false, fehler: null } };
}
