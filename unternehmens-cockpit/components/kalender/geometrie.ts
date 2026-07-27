// Umrechnung Mausposition <-> Uhrzeit für das Zeitraster.
//
// Hintergrund (der Fehler, den es hier zu vermeiden gilt):
// Der Vorgänger-Prototyp hat mitten im Ziehen das Raster neu aufgebaut und danach die
// Position aus einem gemerkten DOM-Element gelesen. Dieses Element war zu dem Zeitpunkt
// nicht mehr im Dokument, sein getBoundingClientRect() lieferte lauter Nullen — und damit
// rechnete jede weitere Bewegung mit 06:00 statt der echten Zeit. Ein Termin um 10:00, in
// der Mitte angeklickt, sprang so auf 05:30 und verschwand über der Rasterkante.
//
// Konsequenz für diesen Code: Es wird NICHTS gemessen, was sich zwischendurch ändern kann.
// Der Aufrufer misst die Rasterfläche EINMAL beim Drücken der Maustaste und reicht die
// Werte hier hinein. Alle Funktionen sind rein und ohne DOM-Zugriff.

import { STUNDE_BIS, STUNDE_VON, SPUR } from "./datum.ts";

// Kleinste Schrittweite beim Ziehen (Minuten).
export const RASTER_MIN = 5;

export function runde(minuten: number): number {
  return Math.round(minuten / RASTER_MIN) * RASTER_MIN;
}

// Absolute Dokument-Position der Rasteroberkante, einmalig beim Drücken gemessen.
// Bewusst pageY-basiert (Dokumentkoordinaten): so bleibt die Rechnung auch dann richtig,
// wenn der Nutzer während des Ziehens scrollt.
export interface RasterMass {
  obenAbsolut: number; // rect.top + window.scrollY
  hoehe: number; // Pixel-Höhe der Rasterfläche
}

// Uhrzeit (Minuten ab Mitternacht) an einer Mausposition.
export function minuteAusPosition(pageY: number, mass: RasterMass): number {
  const y = Math.min(Math.max(0, pageY - mass.obenAbsolut), mass.hoehe);
  return runde(STUNDE_VON * 60 + (y / SPUR) * 60);
}

// Waagrechte Grenzen der Tagesspalten, ebenfalls einmalig gemessen (Dokumentkoordinaten).
export interface SpaltenMass {
  datum: string; // "YYYY-MM-DD"
  linksAbsolut: number;
  rechtsAbsolut: number;
}

// Über welchem Tag steht die Maus? Ausserhalb aller Spalten gewinnt die nächstgelegene,
// damit ein Ziehen am Rand nicht ins Leere läuft.
export function spalteAusPosition(pageX: number, spalten: SpaltenMass[]): string | null {
  if (spalten.length === 0) return null;
  const treffer = spalten.find((s) => pageX >= s.linksAbsolut && pageX < s.rechtsAbsolut);
  if (treffer) return treffer.datum;
  return pageX < spalten[0].linksAbsolut ? spalten[0].datum : spalten[spalten.length - 1].datum;
}

const TAG_MIN = 24 * 60;

// Neue Startminute beim Verschieben. `griffMin` ist die Uhrzeit, an der angefasst wurde,
// `zeigerMin` die aktuelle — die Differenz ist der Versatz.
//
// Ohne Bewegung sind beide gleich, der Versatz ist 0 und der Termin bleibt exakt liegen.
// Genau das ist beim Vorgänger schiefgegangen.
export function neueStartMinute(urVon: number, urBis: number, griffMin: number, zeigerMin: number): number {
  const dauer = urBis - urVon;
  return Math.max(0, Math.min(TAG_MIN - dauer, urVon + (zeigerMin - griffMin)));
}

// Neues Ende beim Ziehen am unteren Griff. Mindestens eine Rasterstufe nach dem Start,
// höchstens Mitternacht.
export function neueEndMinute(urVon: number, urBis: number, griffMin: number, zeigerMin: number): number {
  return Math.max(urVon + RASTER_MIN, Math.min(TAG_MIN, urBis + (zeigerMin - griffMin)));
}

// Aufziehen eines neuen Termins: die beiden Enden können in beliebiger Reihenfolge kommen.
export function neuerZeitraum(startMin: number, zeigerMin: number): { von: number; bis: number } {
  const von = Math.min(startMin, zeigerMin);
  const bis = Math.max(startMin, zeigerMin);
  // Reiner Klick ohne Aufziehen ergibt eine Stunde, wie im Prototyp.
  if (bis - von < RASTER_MIN) return { von, bis: Math.min(TAG_MIN, von + 60) };
  return { von, bis };
}

// Minuten -> "HH:MM" für die Zeitstrings der API.
export function alsUhrzeit(minuten: number): string {
  const m = Math.max(0, Math.min(TAG_MIN, minuten));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Pixel-Position eines Zeitpunkts im Raster (für die Vorschau beim Ziehen).
export function obenAus(minuten: number): number {
  return ((minuten - STUNDE_VON * 60) / 60) * SPUR;
}

export function hoeheAus(vonMin: number, bisMin: number): number {
  return Math.max(15, ((bisMin - vonMin) / 60) * SPUR);
}

export const RASTER_HOEHE = (STUNDE_BIS - STUNDE_VON) * SPUR;
