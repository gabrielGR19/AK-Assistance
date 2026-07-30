import { holeLeadgenVerbrauch } from "@/lib/sheets";
import type { LiveProvider } from "./types";

// ak-leadgen (Google Places API): Live-Wert ist die Zahl der API-Calls im aktuellen
// Monat, gelesen aus dem Meta-Tab des Lead-Sheets - keine Kosten, da die Nutzung
// im Freikontingent (1.000 Calls/Monat) bleiben soll.
export const leadgenProvider: LiveProvider = {
  dienstId: "leadgen",
  holeVerbrauch: () => holeLeadgenVerbrauch(),
  wendeErgebnisAn(d, ergebnis) {
    if (!d.leadgen) d.leadgen = { callsMonat: null, monat: null };
    d.leadgen.callsMonat = ergebnis.verbrauchAnzahl ?? null;
    d.leadgen.monat = ergebnis.monat ?? null;
  },
};
