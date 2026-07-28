// Validierung für Tagesabschluss (Reflexion) und Tagespensum-Soll.
// Reine Logik ohne HTTP, wie lib/kalender-termine.ts — damit sie testbar bleibt.
import type { Pruefung } from "./kalender-termine.ts";
import { istEchtesDatum } from "./kalender-termine.ts";

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NOTIZ = 500;

// Ein Arbeitstag ist nie länger als 24 Stunden — mehr wäre ein Tippfehler, kein Ziel.
const MAX_PENSUM = 24 * 60;

export interface ReflexionEingabe {
  datum: string;
  ab: boolean;
  notiz: string;
}

export function validiereReflexion(roh: unknown): Pruefung<ReflexionEingabe> {
  if (!roh || typeof roh !== "object") return { ok: false, fehler: "Keine Daten empfangen." };
  const d = roh as Record<string, unknown>;

  if (typeof d.datum !== "string" || !DATUM.test(d.datum) || !istEchtesDatum(d.datum)) {
    return { ok: false, fehler: "Das Datum fehlt oder hat ein ungültiges Format." };
  }
  if (typeof d.ab !== "boolean") {
    return { ok: false, fehler: "Der Haken muss true oder false sein." };
  }

  const roheNotiz = d.notiz ?? "";
  if (typeof roheNotiz !== "string") return { ok: false, fehler: "Die Notiz muss Text sein." };
  const notiz = roheNotiz.trim();
  if (notiz.length > MAX_NOTIZ) {
    return { ok: false, fehler: `Die Notiz darf höchstens ${MAX_NOTIZ} Zeichen haben.` };
  }

  return { ok: true, wert: { datum: d.datum, ab: d.ab, notiz } };
}

export function validierePensum(roh: unknown): Pruefung<number> {
  if (!roh || typeof roh !== "object") return { ok: false, fehler: "Keine Daten empfangen." };
  const d = roh as Record<string, unknown>;

  if (typeof d.minuten !== "number" || !Number.isInteger(d.minuten)) {
    return { ok: false, fehler: "Das Pensum muss eine ganze Zahl in Minuten sein." };
  }
  if (d.minuten < 0 || d.minuten > MAX_PENSUM) {
    return { ok: false, fehler: "Das Pensum muss zwischen 0 und 24 Stunden liegen." };
  }

  return { ok: true, wert: d.minuten };
}

// Ein Eintrag ohne Haken und ohne Notiz ist kein Eintrag — sonst wächst die Datei mit
// leeren Tagen, sobald jemand nur ins Notizfeld klickt.
export function istLeer(eintrag: { ab: boolean; notiz: string }): boolean {
  return !eintrag.ab && eintrag.notiz === "";
}
