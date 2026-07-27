// Datentypen des geteilten Arbeitskalenders (Gabriel + Moritz).
//
// Alle Zeitangaben sind lokale Wandzeit als String, nie UTC und nie Date-Objekte:
//   Zeitpunkt  "YYYY-MM-DDTHH:MM"
//   Datum      "YYYY-MM-DD"
//   Uhrzeit    "HH:MM"
// Das ist Absicht. Ein Serientermin um 11:00 soll auch nach der Zeitumstellung um
// 11:00 stehen — mit UTC-Zeitstempeln würde er um eine Stunde wandern.

export type PersonId = "gabriel" | "moritz";

export const PERSONEN: Record<PersonId, { name: string }> = {
  gabriel: { name: "Gabriel" },
  moritz: { name: "Moritz" },
};

export type LabelSchluessel =
  | "vertrieb"
  | "programmieren"
  | "gruendung"
  | "claude"
  | "lesen"
  | "sport"
  | "arzt";

// Gemeinsame Label-Definition für beide Personen. `arbeit` steuert, ob ein Termin
// aufs Tagespensum einzahlt.
export const LABELS: Record<LabelSchluessel, { name: string; farbe: string; arbeit: boolean }> = {
  vertrieb: { name: "Vertrieb (Cold Calls)", farbe: "#0ea5e9", arbeit: true },
  programmieren: { name: "Programmieren", farbe: "#2563eb", arbeit: true },
  gruendung: { name: "Gründung & To-Dos", farbe: "#0891b2", arbeit: true },
  claude: { name: "Claude lernen (Setup)", farbe: "#9333ea", arbeit: true },
  lesen: { name: "Lesen & Lernen", farbe: "#d97706", arbeit: false },
  sport: { name: "Sport", farbe: "#16a34a", arbeit: false },
  arzt: { name: "Arzttermin", farbe: "#dc2626", arbeit: false },
};

export function istLabel(wert: unknown): wert is LabelSchluessel {
  return typeof wert === "string" && wert in LABELS;
}

export function istPerson(wert: unknown): wert is PersonId {
  return wert === "gabriel" || wert === "moritz";
}

// Ein einzelner Termin. `ausSerie` ist gesetzt, wenn der Termin ursprünglich aus einer
// Serie stammt und über "nur diesen Termin" herausgelöst wurde — die Serie trägt dann
// für dasselbe Datum eine Ausnahme, damit das Vorkommen nicht doppelt erscheint.
export interface Termin {
  id: string;
  besitzer: PersonId;
  titel: string;
  label: LabelSchluessel;
  notiz: string;
  start: string; // "YYYY-MM-DDTHH:MM"
  ende: string; // "YYYY-MM-DDTHH:MM"
  ausSerie?: { serieId: string; datum: string };
}

// Wiederholungsmuster einer Serie. Bewusst nur diese zwei Fälle — mehr braucht
// niemand, der "jeden Tag 11:00" oder "Di+Mi 09:00" eintragen will.
export type Wiederholung =
  | { art: "taeglich" }
  | { art: "wochentage"; tage: Wochentag[] };

// ISO-Wochentage: 1 = Montag … 7 = Sonntag.
export type Wochentag = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Eine Serienregel. Wird NICHT als 365 Einzeltermine gespeichert, sondern beim Anzeigen
// für den sichtbaren Zeitraum zu Vorkommen aufgelöst (siehe lib/kalender-serien.ts).
export interface Serie {
  id: string;
  besitzer: PersonId;
  titel: string;
  label: LabelSchluessel;
  notiz: string;
  wiederholung: Wiederholung;
  startDatum: string; // "YYYY-MM-DD", erster möglicher Tag
  endDatum: string | null; // "YYYY-MM-DD" einschließlich, null = unbefristet
  startZeit: string; // "HH:MM"
  endeZeit: string; // "HH:MM", muss nach startZeit liegen (kein Übernacht-Termin)
  ausnahmen: string[]; // Daten "YYYY-MM-DD", an denen kein Vorkommen erscheint
}

// Mehrtägiger ganztägiger Eintrag (z.B. Urlaub).
export interface Ganztags {
  id: string;
  besitzer: PersonId;
  titel: string;
  notiz: string;
  von: string; // "YYYY-MM-DD"
  bis: string; // "YYYY-MM-DD", einschließlich
}

export interface Reflexion {
  ab: boolean;
  notiz: string;
}

// Persönliche Schnellvorlage für die Seitenleiste.
export interface Vorlage {
  id: string;
  besitzer: PersonId;
  titel: string;
  label: LabelSchluessel;
  min: number;
}

export interface KalenderDaten {
  version: number;
  // Zählt jede Änderung hoch. Der Browser pollt damit, ohne jedes Mal alle Termine
  // vergleichen zu müssen.
  aenderungszaehler: number;
  termine: Termin[];
  serien: Serie[];
  ganztags: Ganztags[];
  // Pro Person und Datum: { gabriel: { "2026-07-27": { ab: true, notiz: "" } } }
  reflexionen: Record<PersonId, Record<string, Reflexion>>;
  // Tagespensum-Soll in Minuten, pro Person.
  pensumSoll: Record<PersonId, number>;
  vorlagen: Vorlage[];
}

// Ein aufgelöstes Serien-Vorkommen sieht für die Anzeige aus wie ein Termin, existiert
// aber nicht als gespeicherter Datensatz. Die id ist synthetisch und stabil, damit React
// sie als key nutzen kann.
export type VorkommenId = `serie:${string}:${string}`;

export function vorkommenId(serieId: string, datum: string): VorkommenId {
  return `serie:${serieId}:${datum}`;
}

export function istVorkommenId(id: string): boolean {
  return id.startsWith("serie:");
}
