// Tagespensum: wie viel Arbeitszeit an einem Tag schon im Kalender steht.
//
// Gezählt werden nur eigene Termine mit einem Arbeitslabel (LABELS[...].arbeit) — Sport,
// Lesen und Arzttermine zahlen bewusst nicht ein, sonst wäre der Balken jeden Tag voll,
// ohne dass gearbeitet wurde. Ausgeblendete Label sind hier gar nicht erst enthalten: die
// Ansicht filtert sie heraus, bevor sie die Termine weiterreicht.
// Relative Imports mit .ts-Endung, damit der Node-Test-Runner die Datei ohne Bundler
// auflösen kann — gleiches Vorgehen wie in geometrie.ts.
import type { PersonId, Termin } from "../../lib/kalender-typen.ts";
import { LABELS } from "../../lib/kalender-typen.ts";
import { ausIso } from "./datum.ts";

export function pensumAm(termine: Termin[], person: PersonId, tagIso: string): number {
  return termine.reduce((summe, t) => {
    if (t.start.slice(0, 10) !== tagIso) return summe;
    if (t.besitzer !== person) return summe;
    if (!LABELS[t.label]?.arbeit) return summe;
    const dauer = (ausIso(t.ende).getTime() - ausIso(t.start).getTime()) / 60000;
    return summe + Math.max(0, dauer);
  }, 0);
}

// Minuten als Stundenzahl mit deutschem Komma: 240 → "4,0".
export function stundenText(minuten: number): string {
  return (minuten / 60).toFixed(1).replace(".", ",");
}
