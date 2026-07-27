// Datums-Helfer für den Kalender. Alles lokale Wandzeit, nie UTC — siehe die Erklärung
// oben in lib/kalender-typen.ts. Nie new Date(string) auf gespeicherte Zeitstrings anwenden
// und nie mit +86400000 rechnen, sondern über setDate.

const zwei = (n: number) => String(n).padStart(2, "0");

export function iso(d: Date): string {
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

// Parst "YYYY-MM-DD" oder "YYYY-MM-DDTHH:MM" zu einem lokalen Date.
export function ausIso(s: string): Date {
  const [t, z] = s.split("T");
  const [j, m, g] = t.split("-").map(Number);
  const [h, i] = (z ?? "00:00").split(":").map(Number);
  return new Date(j, m - 1, g, h, i, 0, 0);
}

export function plusTage(d: Date, n: number): Date {
  const k = new Date(d);
  k.setDate(k.getDate() + n);
  return k;
}

export function montagVon(d: Date): Date {
  const k = new Date(d);
  const wochentag = (k.getDay() + 6) % 7; // 0 = Montag
  k.setDate(k.getDate() - wochentag);
  k.setHours(0, 0, 0, 0);
  return k;
}

export function minutenAmTag(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function uhr(d: Date): string {
  return `${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
}

export const WOCHENTAG = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

// Raster-Konstanten: 06:00–24:00, 84px pro Stunde (muss zu den CSS-Berechnungen passen).
export const STUNDE_VON = 6;
export const STUNDE_BIS = 24;
export const SPUR = 84;
