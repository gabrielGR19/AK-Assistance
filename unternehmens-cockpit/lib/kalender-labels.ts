// Verwaltung der geteilten Label-Liste ("Vertrieb", "Programmieren", …).
// Reine Logik ohne HTTP, wie lib/kalender-vorlagen.ts.
//
// Labels waren bis 04.08.2026 eine hartcodierte Konstante in kalender-typen.ts. Jetzt sind
// sie Daten in data/kalender.json (Feld `labels`), geteilt von Gabriel und Moritz — anders
// als Vorlagen gibt es hier keinen Besitzer.
import type { KalenderDaten, Label } from "./kalender-typen.ts";
import type { Pruefung } from "./kalender-termine.ts";

const MAX_NAME = 40;
const RE_FARBE = /^#[0-9a-fA-F]{6}$/;

// Mindestens ein Label muss übrig bleiben, sonst lässt sich kein Termin mehr anlegen.
export const MIN_LABELS = 1;

// Die sieben bisherigen Labels aus der alten LABELS-Konstante, unverändert in Name, Farbe
// und Gruppe — Umstieg auf Daten darf am Aussehen nichts ändern. Gruppierung wie in der
// bisherigen Seitenleiste: die drei Firmenlabel oben, der Rest darunter.
export const STANDARD_LABELS: Label[] = [
  { id: "vertrieb", name: "Vertrieb (Cold Calls)", farbe: "#5AC8FA", text: "#5AC8FA", arbeit: true, gruppe: "firma" },
  { id: "programmieren", name: "Programmieren", farbe: "#0A63D6", text: "#6FA8FF", arbeit: true, gruppe: "firma" },
  { id: "gruendung", name: "Gründung & To-Dos", farbe: "#30B0C7", text: "#40C8DF", arbeit: true, gruppe: "firma" },
  { id: "claude", name: "Claude lernen (Setup)", farbe: "#AF52DE", text: "#C77DEB", arbeit: true, gruppe: "uebrige" },
  { id: "lesen", name: "Lesen & Lernen", farbe: "#E8A33D", text: "#E8A33D", arbeit: false, gruppe: "uebrige" },
  { id: "sport", name: "Sport", farbe: "#34C759", text: "#34C759", arbeit: false, gruppe: "uebrige" },
  { id: "arzt", name: "Arzttermin", farbe: "#FF453A", text: "#FF6961", arbeit: false, gruppe: "uebrige" },
];

export const STANDARD_LABEL_IDS: ReadonlySet<string> = new Set(STANDARD_LABELS.map((l) => l.id));

// Welche Label-Schlüssel gerade gültig sind — Grundlage für die Validierung von Terminen,
// Serien und Vorlagen. Immer aus dem frisch geladenen Stand bilden, nie zwischenspeichern:
// sonst zählt ein gerade gelöschtes Label noch als gültig.
export function erlaubteLabels(daten: KalenderDaten): ReadonlySet<string> {
  return new Set(daten.labels.map((l) => l.id));
}

export interface LabelEingabe {
  name: string;
  farbe: string;
  arbeit: boolean;
  gruppe: Label["gruppe"];
}

export function validiereLabel(roh: unknown): Pruefung<LabelEingabe> {
  if (!roh || typeof roh !== "object") return { ok: false, fehler: "Keine Labeldaten empfangen." };
  const d = roh as Record<string, unknown>;

  if (typeof d.name !== "string") return { ok: false, fehler: "Der Name fehlt." };
  const name = d.name.trim();
  if (name.length === 0) return { ok: false, fehler: "Ein Label ohne Namen hilft niemandem." };
  if (name.length > MAX_NAME) return { ok: false, fehler: `Der Name darf höchstens ${MAX_NAME} Zeichen haben.` };

  if (typeof d.farbe !== "string" || !RE_FARBE.test(d.farbe)) {
    return { ok: false, fehler: "Die Farbe muss ein Hex-Code wie #5AC8FA sein." };
  }

  if (typeof d.arbeit !== "boolean") {
    return { ok: false, fehler: "arbeit muss true oder false sein." };
  }

  if (d.gruppe !== "firma" && d.gruppe !== "uebrige") {
    return { ok: false, fehler: "Die Gruppe muss 'firma' oder 'uebrige' sein." };
  }

  return { ok: true, wert: { name, farbe: d.farbe, arbeit: d.arbeit, gruppe: d.gruppe } };
}

export function neueLabelId(): string {
  return "l" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// Hellt eine dunkle Farbe für die Schrift auf dunklem Grund auf — wie im Prototyp bei
// "Programmieren" (#0A63D6 Rand, #6FA8FF Schrift). Helle Farben (z.B. "Sport" #34C759)
// bleiben unverändert, die sind auf dunklem Grund schon gut lesbar.
const AUFHELL_SCHWELLE = 150;
const AUFHELL_ANTEIL = 0.45;

export function textfarbeZu(farbe: string): string {
  const r = parseInt(farbe.slice(1, 3), 16);
  const g = parseInt(farbe.slice(3, 5), 16);
  const b = parseInt(farbe.slice(5, 7), 16);
  // Wahrgenommene Helligkeit, keine physikalische Luminanz — reicht für diese Abschätzung.
  const helligkeit = 0.299 * r + 0.587 * g + 0.114 * b;
  if (helligkeit >= AUFHELL_SCHWELLE) return farbe;

  const hell = (kanal: number) => Math.round(kanal + (255 - kanal) * AUFHELL_ANTEIL);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(hell(r))}${hex(hell(g))}${hex(hell(b))}`;
}

export function baueLabel(eingabe: LabelEingabe): Label {
  return {
    id: neueLabelId(),
    name: eingabe.name,
    farbe: eingabe.farbe,
    text: textfarbeZu(eingabe.farbe),
    arbeit: eingabe.arbeit,
    gruppe: eingabe.gruppe,
  };
}

export interface LabelNutzung {
  termine: number;
  serien: number;
  vorlagen: number;
}

// Wie viele Termine, Serien und Vorlagen ein Label noch benutzen — Grundlage für den
// Löschschutz. Zählt über BEIDE Personen, die Liste ist geteilt.
export function labelNutzung(daten: KalenderDaten, id: string): LabelNutzung {
  return {
    termine: daten.termine.filter((t) => t.label === id).length,
    serien: daten.serien.filter((s) => s.label === id).length,
    vorlagen: daten.vorlagen.filter((v) => v.label === id).length,
  };
}

// Neutrale Anzeige für einen Label-Schlüssel, den es (mehr) nicht gibt — z.B. weil ein Termin
// aus dem Import einer alten Sicherung stammt, deren Label inzwischen gelöscht wurde. Grau statt
// Absturz.
const ERSATZ_LABEL: Label = { id: "", name: "Unbekannt", farbe: "#8E8E93", text: "#8E8E93", arbeit: false, gruppe: "uebrige" };

export function labelKarte(labels: Label[]): Map<string, Label> {
  return new Map(labels.map((l) => [l.id, l]));
}

export function labelAus(karte: Map<string, Label>, id: string): Label {
  return karte.get(id) ?? ERSATZ_LABEL;
}

export function nutzungText(n: LabelNutzung): string {
  const teile: string[] = [];
  if (n.termine > 0) teile.push(`${n.termine} Termin${n.termine === 1 ? "" : "en"}`);
  if (n.serien > 0) teile.push(`${n.serien} Serie${n.serien === 1 ? "" : "n"}`);
  if (n.vorlagen > 0) teile.push(`${n.vorlagen} Vorlage${n.vorlagen === 1 ? "" : "n"}`);
  return teile.join(", ");
}
