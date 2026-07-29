// Validierung der Schnellvorlagen ("Cold Calls 75 min", "Gym 120 min").
// Reine Logik ohne HTTP, wie lib/kalender-termine.ts.
import type { PersonId, Vorlage } from "./kalender-typen.ts";
import { istLabel } from "./kalender-typen.ts";
import type { Pruefung } from "./kalender-termine.ts";

const MAX_TITEL = 100;
const MIN_DAUER = 5;
const MAX_DAUER = 12 * 60;

export interface VorlageEingabe {
  titel: string;
  label: Vorlage["label"];
  min: number;
}

export function validiereVorlage(roh: unknown): Pruefung<VorlageEingabe> {
  if (!roh || typeof roh !== "object") return { ok: false, fehler: "Keine Vorlagendaten empfangen." };
  const d = roh as Record<string, unknown>;

  if (typeof d.titel !== "string") return { ok: false, fehler: "Der Titel fehlt." };
  const titel = d.titel.trim();
  if (titel.length === 0) return { ok: false, fehler: "Eine Vorlage ohne Titel hilft niemandem." };
  if (titel.length > MAX_TITEL) return { ok: false, fehler: `Der Titel darf höchstens ${MAX_TITEL} Zeichen haben.` };

  if (!istLabel(d.label)) return { ok: false, fehler: "Unbekannter Kalender (Label)." };

  if (typeof d.min !== "number" || !Number.isInteger(d.min)) {
    return { ok: false, fehler: "Die Dauer muss eine ganze Zahl in Minuten sein." };
  }
  if (d.min < MIN_DAUER || d.min > MAX_DAUER) {
    return { ok: false, fehler: `Die Dauer muss zwischen ${MIN_DAUER} Minuten und ${MAX_DAUER / 60} Stunden liegen.` };
  }

  return { ok: true, wert: { titel, label: d.label, min: d.min } };
}

export function neueVorlagenId(): string {
  return "v" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function baueVorlage(eingabe: VorlageEingabe, besitzer: PersonId): Vorlage {
  return { id: neueVorlagenId(), besitzer, ...eingabe };
}

// Jeder pflegt nur seine eigenen Vorlagen — gleiche Regel wie bei Terminen.
export function darfVorlageAendern(vorlage: Vorlage, person: PersonId | null): boolean {
  return person !== null && vorlage.besitzer === person;
}
