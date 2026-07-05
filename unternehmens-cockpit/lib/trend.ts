import type { Dienst } from "./types";

export type TrendRichtung = "steigend" | "fallend" | "stabil";

export interface Trend {
  richtung: TrendRichtung;
  deltaProzent: number | null; // null, wenn der vorherige Wert 0 war (Prozent nicht sinnvoll)
}

// Vergleicht die letzten zwei Verlaufspunkte. Bei monatlichen Datenpunkten reicht ein
// einfacher Punkt-zu-Punkt-Vergleich — eine Regression wäre für dieses Cockpit Overkill.
export function berechneTrend(verlauf: Dienst["verlauf"]): Trend | null {
  if (!verlauf || verlauf.length < 2) return null;
  const [vorher, aktuell] = verlauf.slice(-2);
  if (vorher.betrag === aktuell.betrag) return { richtung: "stabil", deltaProzent: 0 };
  const deltaProzent = vorher.betrag !== 0 ? ((aktuell.betrag - vorher.betrag) / vorher.betrag) * 100 : null;
  return { richtung: aktuell.betrag > vorher.betrag ? "steigend" : "fallend", deltaProzent };
}
