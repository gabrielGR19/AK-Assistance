import { randomUUID } from "crypto";
import { CockpitData, Dienst, DienstEingabe } from "./types";

const ABRECHNUNGSMODELLE = ["monatlich", "jaehrlich", "verbrauch"] as const;
const WAEHRUNGEN = ["EUR", "USD"] as const;
const STATUS = ["ok", "beobachten", "handlung"] as const;

type ValidierungsErgebnis =
  | { ok: true; wert: DienstEingabe }
  | { ok: false; fehler: string };

// Validiert und normalisiert die von außen kommende Eingabe, BEVOR sie gespeichert wird.
// Gibt bei Fehlern eine klare deutsche Meldung zurück, statt ungültige Daten durchzulassen.
export function validiereEingabe(roh: unknown): ValidierungsErgebnis {
  if (typeof roh !== "object" || roh === null) {
    return { ok: false, fehler: "Ungültige Daten: Objekt erwartet." };
  }
  const e = roh as Record<string, unknown>;

  const name = typeof e.name === "string" ? e.name.trim() : "";
  if (!name) return { ok: false, fehler: "Name darf nicht leer sein." };

  const kategorie = typeof e.kategorie === "string" ? e.kategorie.trim() : "";
  if (!kategorie) return { ok: false, fehler: "Kategorie darf nicht leer sein." };

  if (!ABRECHNUNGSMODELLE.includes(e.abrechnungsmodell as never)) {
    return { ok: false, fehler: "Abrechnungsmodell muss monatlich, jaehrlich oder verbrauch sein." };
  }
  if (!WAEHRUNGEN.includes(e.waehrung as never)) {
    return { ok: false, fehler: "Währung muss EUR oder USD sein." };
  }
  if (!STATUS.includes(e.statusAmpel as never)) {
    return { ok: false, fehler: "Status muss ok, beobachten oder handlung sein." };
  }

  // Betrag: leer (null) erlaubt, sonst eine Zahl >= 0.
  let betrag: number | null = null;
  if (e.betrag !== null && e.betrag !== undefined && e.betrag !== "") {
    const zahl = Number(e.betrag);
    if (!Number.isFinite(zahl) || zahl < 0) {
      return { ok: false, fehler: "Betrag muss eine Zahl >= 0 oder leer sein." };
    }
    betrag = zahl;
  }

  // Fälligkeit: leer (null) erlaubt, sonst ein gültiges Datum im Format YYYY-MM-DD.
  let faelligkeit: string | null = null;
  if (e.naechsteFaelligkeit) {
    const s = String(e.naechsteFaelligkeit);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) {
      return { ok: false, fehler: "Fälligkeit muss ein gültiges Datum (YYYY-MM-DD) oder leer sein." };
    }
    faelligkeit = s;
  }

  return {
    ok: true,
    wert: {
      name,
      kategorie,
      inhaber: typeof e.inhaber === "string" ? e.inhaber.trim() : "",
      abrechnungsmodell: e.abrechnungsmodell as DienstEingabe["abrechnungsmodell"],
      betrag,
      waehrung: e.waehrung as DienstEingabe["waehrung"],
      statusAmpel: e.statusAmpel as DienstEingabe["statusAmpel"],
      naechsteFaelligkeit: faelligkeit,
      notiz: typeof e.notiz === "string" ? e.notiz.trim() : "",
    },
  };
}

// Fügt einen neuen Dienst hinzu und gibt die aktualisierten Daten zurück.
export function fuegeDienstHinzu(daten: CockpitData, eingabe: DienstEingabe): CockpitData {
  const neu: Dienst = {
    id: randomUUID(),
    ...eingabe,
    herkunft: "manuell",
    letzteAenderung: new Date().toISOString(),
    letzterAbruf: null,
    abrufStatus: null,
  };
  return { ...daten, dienste: [...daten.dienste, neu] };
}

// Aktualisiert einen bestehenden Dienst. Gibt null zurück, wenn die ID nicht existiert.
export function aktualisiereDienst(
  daten: CockpitData,
  id: string,
  eingabe: DienstEingabe,
): CockpitData | null {
  const index = daten.dienste.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const alt = daten.dienste[index];
  const aktualisiert: Dienst = {
    ...alt,
    ...eingabe,
    letzteAenderung: new Date().toISOString(),
  };
  const dienste = [...daten.dienste];
  dienste[index] = aktualisiert;
  return { ...daten, dienste };
}

// Löscht einen Dienst. Gibt null zurück, wenn die ID nicht existiert.
export function loescheDienst(daten: CockpitData, id: string): CockpitData | null {
  const vorhanden = daten.dienste.some((d) => d.id === id);
  if (!vorhanden) return null;
  return { ...daten, dienste: daten.dienste.filter((d) => d.id !== id) };
}
