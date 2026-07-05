import { holeVerbrauchMonat } from "@/lib/retell";
import type { LiveProvider } from "./types";

// Erster Tag des laufenden Monats um 00:00 UTC als Millisekunden-Epoch.
function monatsanfangMs(): number {
  const jetzt = new Date();
  return Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth(), 1);
}

// Retell rechnet verbrauchsbasiert ab: Live-Wert = Call-Kosten des laufenden Monats.
export const retellProvider: LiveProvider = {
  dienstId: "retell",
  holeVerbrauch: () => holeVerbrauchMonat(monatsanfangMs()),
  wendeErgebnisAn(d, ergebnis) {
    d.betrag = ergebnis.verbrauchUsd;
    d.waehrung = "USD";
  },
};
