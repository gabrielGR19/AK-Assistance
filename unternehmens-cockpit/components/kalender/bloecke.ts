import type { Termin } from "@/lib/kalender-typen";
import { ausIso } from "./datum";

export interface BlockPosition {
  termin: Termin;
  spur: number;
  anzahl: number;
}

// Überlappende Termine eines Tages nebeneinander legen — Gruppen bilden (Termine mit
// gemeinsamer Überschneidung), dann pro Gruppe Spuren zuweisen. Portiert aus
// zeichneBloecke/blockEl der Vorlage (planung/arbeitskalender.html), nur ohne DOM-Zugriff.
export function ordneBloecke(termine: Termin[]): BlockPosition[] {
  interface Gruppe {
    bis: number;
    eintraege: Termin[];
  }
  const gruppen: Gruppe[] = [];
  termine.forEach((t) => {
    const von = ausIso(t.start).getTime();
    const bis = ausIso(t.ende).getTime();
    let g = gruppen.find((gr) => gr.bis > von);
    if (!g) {
      g = { bis, eintraege: [] };
      gruppen.push(g);
    }
    g.bis = Math.max(g.bis, bis);
    g.eintraege.push(t);
  });

  const ergebnis: BlockPosition[] = [];
  gruppen.forEach((g) => {
    const spuren: number[] = []; // je Spur der letzte Endzeitpunkt
    const zuweisung = new Map<Termin, number>();
    g.eintraege.forEach((t) => {
      const von = ausIso(t.start).getTime();
      const bis = ausIso(t.ende).getTime();
      let idx = spuren.findIndex((ende) => ende <= von);
      if (idx === -1) {
        spuren.push(bis);
        idx = spuren.length - 1;
      } else {
        spuren[idx] = bis;
      }
      zuweisung.set(t, idx);
    });
    const anzahl = spuren.length;
    g.eintraege.forEach((t) => ergebnis.push({ termin: t, spur: zuweisung.get(t) ?? 0, anzahl }));
  });
  return ergebnis;
}
