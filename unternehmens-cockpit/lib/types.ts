// Zentrale Datentypen des Cockpits.
// Bewusst schlank gehalten: ein Entwickler soll das Modell auf einen Blick verstehen.

export type Abrechnungsmodell = "monatlich" | "jaehrlich" | "verbrauch";
export type Waehrung = "EUR" | "USD";
export type StatusAmpel = "ok" | "beobachten" | "handlung";
export type Herkunft = "manuell" | "live";
export type AbrufStatus = "ok" | "fehlgeschlagen" | "veraltet";

// Sonderfelder nur für den Dienst "Anthropic / Claude API".
// Restguthaben ist immer eine Schätzung (Basis minus Verbrauch), nie ein exakter Kontostand.
export interface ClaudeMonitoring {
  guthabenBasisUsd: number | null; // manuell eingetragenes aufgeladenes Guthaben (USD)
  guthabenBasisDatum: string | null; // Aufladedatum (ISO, YYYY-MM-DD)
  schwelleUsd: number | null; // Warnschwelle (USD), von Gabriel einstellbar
  verbrauchSeitBasisUsd: number | null; // via Cost-API abgerufen (USD)
  restguthabenGeschaetztUsd: number | null; // Basis - Verbrauch (geschätzt)
}

export interface Dienst {
  id: string;
  name: string;
  kategorie: string;
  inhaber: string; // Inhaber / Account
  abrechnungsmodell: Abrechnungsmodell;
  betrag: number | null; // leer beim Start — Gabriel befüllt selbst
  waehrung: Waehrung;
  statusAmpel: StatusAmpel;
  naechsteFaelligkeit: string | null; // ISO-Datum (YYYY-MM-DD) oder null
  notiz: string; // Notiz / Token-Stand
  herkunft: Herkunft; // "manuell" oder "live"
  letzteAenderung: string; // ISO-Zeitstempel der letzten Änderung (für "Stand:" + 90-Tage-Prüfung)
  letzterAbruf: string | null; // ISO-Zeitstempel des letzten erfolgreichen Live-Abrufs
  abrufStatus: AbrufStatus | null; // Status des letzten Live-Abrufs
  claude?: ClaudeMonitoring; // nur beim Claude-API-Dienst gesetzt
}

export interface Meta {
  version: number;
  eurUsdKurs: number | null; // manuell gepflegter Wechselkurs, z.B. 0.92 (1 USD = 0,92 EUR)
  kursStand: string | null; // ISO-Datum der letzten Kurs-Pflege
}

export interface CockpitData {
  meta: Meta;
  dienste: Dienst[];
}

// Die von Gabriel editierbaren Felder eines Dienstes (Rest wird vom System gesetzt).
export interface DienstEingabe {
  name: string;
  kategorie: string;
  inhaber: string;
  abrechnungsmodell: Abrechnungsmodell;
  betrag: number | null;
  waehrung: Waehrung;
  statusAmpel: StatusAmpel;
  naechsteFaelligkeit: string | null;
  notiz: string;
}
