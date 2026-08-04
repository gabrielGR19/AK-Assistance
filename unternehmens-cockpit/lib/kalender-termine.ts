// Import mit .ts-Endung, damit der Node-Test-Runner die Datei ohne Bundler auflösen kann
// (tsconfig: allowImportingTsExtensions). Gilt für alle kalender-* Module.
import type { PersonId, Termin } from "./kalender-typen.ts";

// Validierung aller Termin-Eingaben, bevor etwas gespeichert wird. Reine Logik ohne HTTP,
// damit sie testbar bleibt (Muster wie lib/dienste.ts und lib/checks.ts).

export type Pruefung<T> = { ok: true; wert: T } | { ok: false; fehler: string };

// Stunde 00–23, Minute 00–59. Mit \d{2}:\d{2} wären "30:00" oder "12:99" durchgegangen —
// über die Oberfläche nicht erzeugbar, über eine Importdatei oder einen gebastelten Request
// schon, und der Block landete dann an einer absurden Position im Raster.
const ZEITPUNKT = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
const MAX_TITEL = 200;
const MAX_NOTIZ = 2000;

// Prüft, ob ein Datum wirklich existiert. Die Regex allein lässt "2026-02-31" durch.
export function istEchtesDatum(datum: string): boolean {
  const [j, m, t] = datum.split("-").map(Number);
  if (!j || !m || !t) return false;
  const d = new Date(j, m - 1, t);
  return d.getFullYear() === j && d.getMonth() === m - 1 && d.getDate() === t;
}

export function istZeitpunkt(wert: unknown): wert is string {
  return typeof wert === "string" && ZEITPUNKT.test(wert) && istEchtesDatum(wert.slice(0, 10));
}

function text(wert: unknown, max: number): string | null {
  if (typeof wert !== "string") return null;
  const t = wert.trim();
  return t.length > max ? null : t;
}

// Prüft Start und Ende gemeinsam: gleicher Tag, Ende echt nach Start.
// Übernacht-Termine gibt es bewusst nicht — das Raster stellt einen Tag dar, und ein Block,
// der über Mitternacht läuft, hätte im Layout keinen sinnvollen Platz.
function pruefeZeitraum(start: unknown, ende: unknown): Pruefung<{ start: string; ende: string }> {
  if (!istZeitpunkt(start)) return { ok: false, fehler: "Startzeit fehlt oder hat ein ungültiges Format." };
  if (!istZeitpunkt(ende)) return { ok: false, fehler: "Endzeit fehlt oder hat ein ungültiges Format." };
  if (start.slice(0, 10) !== ende.slice(0, 10)) {
    return { ok: false, fehler: "Start und Ende müssen am selben Tag liegen." };
  }
  if (ende <= start) return { ok: false, fehler: "Das Ende muss nach dem Start liegen." };
  return { ok: true, wert: { start, ende } };
}

// Felder, die ein Client schicken darf. Besitzer und id kommen NIE aus der Anfrage —
// der Besitzer stammt aus der Basic-Auth, die id vergibt der Server.
interface TerminEingabe {
  titel: string;
  label: Termin["label"];
  notiz: string;
  start: string;
  ende: string;
}

export function validiereTermin(roh: unknown, erlaubteLabels: ReadonlySet<string>): Pruefung<TerminEingabe> {
  if (!roh || typeof roh !== "object") return { ok: false, fehler: "Keine Termindaten empfangen." };
  const d = roh as Record<string, unknown>;

  const titel = text(d.titel, MAX_TITEL);
  if (titel === null) return { ok: false, fehler: `Der Titel darf höchstens ${MAX_TITEL} Zeichen haben.` };

  if (typeof d.label !== "string" || !erlaubteLabels.has(d.label)) {
    return { ok: false, fehler: "Unbekannter Kalender (Label)." };
  }

  const notiz = text(d.notiz ?? "", MAX_NOTIZ);
  if (notiz === null) return { ok: false, fehler: `Die Notiz darf höchstens ${MAX_NOTIZ} Zeichen haben.` };

  const zeit = pruefeZeitraum(d.start, d.ende);
  if (!zeit.ok) return zeit;

  return {
    ok: true,
    // Leerer Titel ist kein Fehler wert — der Kalender zeigt dann "Ohne Titel", wie im Prototyp.
    wert: { titel: titel || "Ohne Titel", label: d.label, notiz, start: zeit.wert.start, ende: zeit.wert.ende },
  };
}

export function neueTerminId(): string {
  return "t" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function baueTermin(eingabe: TerminEingabe, besitzer: PersonId): Termin {
  return { id: neueTerminId(), besitzer, ...eingabe };
}

// Darf `person` diesen Termin ändern oder löschen? Einzige Regel: nur eigene.
// Bewusst als eigene Funktion, damit jede Route dieselbe Prüfung benutzt.
export function darfAendern(termin: Termin, person: PersonId | null): boolean {
  return person !== null && termin.besitzer === person;
}
