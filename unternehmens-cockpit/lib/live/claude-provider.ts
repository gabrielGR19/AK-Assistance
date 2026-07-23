import { holeVerbrauchSeit } from "@/lib/claude";
import type { Dienst } from "@/lib/types";
import type { LiveProvider } from "./types";

// Restguthaben = Basis − Verbrauch. Immer eine Schätzung; null, wenn eine Größe fehlt.
// Exportiert, da app/api/claude/route.ts (PUT, manuelle Pflege) dieselbe Neuberechnung braucht.
export function berechneRest(d: Dienst): void {
  const c = d.claude;
  if (!c) return;
  c.restguthabenGeschaetztUsd =
    c.guthabenBasisUsd != null && c.verbrauchSeitBasisUsd != null
      ? c.guthabenBasisUsd - c.verbrauchSeitBasisUsd
      : null;
}

// Claude-API: Verbrauch seit einem gepflegten Basis-Datum über die Cost-API.
export const claudeProvider: LiveProvider = {
  dienstId: "claude-api",
  pruefeVoraussetzung(d) {
    if (!d.claude?.guthabenBasisDatum) {
      return "Bitte zuerst das Basis-Datum setzen, ab dem der Verbrauch zählt.";
    }
    return null;
  },
  holeVerbrauch(d) {
    return holeVerbrauchSeit(d.claude!.guthabenBasisDatum!);
  },
  wendeErgebnisAn(d, ergebnis) {
    if (!d.claude) return;
    d.claude.verbrauchSeitBasisUsd = ergebnis.verbrauchUsd;
    berechneRest(d);
    d.betrag = ergebnis.verbrauchUsd;
    d.waehrung = "USD";
  },
};
