// Zentrale Datentypen für das Unternehmens-Cockpit.

export type Abrechnungsmodell = "monatlich" | "jaehrlich" | "verbrauch";
export type Waehrung = "EUR" | "USD";
export type StatusAmpel = "ok" | "beobachten" | "handlung";
export type Herkunft = "manuell" | "live";
export type AbrufStatus = "ok" | "fehlgeschlagen" | "veraltet" | null;

// Manuelle Pflege- und Live-Abruf-Felder für den Claude-API-Dienst (Blog-Agent-Guthaben).
export interface ClaudeInfo {
  guthabenBasisUsd: number | null;
  guthabenBasisDatum: string | null;
  schwelleUsd: number | null;
  verbrauchSeitBasisUsd: number | null;
  restguthabenGeschaetztUsd: number | null;
}

export interface Dienst {
  id: string;
  name: string;
  kategorie: string;
  abrechnungsmodell: Abrechnungsmodell;
  waehrung: Waehrung;
  inhaber: string;
  betrag: number | null;
  statusAmpel: StatusAmpel;
  naechsteFaelligkeit: string | null;
  notiz: string;
  herkunft: Herkunft;
  letzteAenderung: string;
  letzterAbruf: string | null;
  abrufStatus: AbrufStatus;
  claude?: ClaudeInfo;
  // Snapshots des betrag-Felds über Zeit (ein Eintrag pro Tag mit Änderung), für Trendanzeige.
  // Optional, damit Altbestände in cockpit.json ohne dieses Feld kompatibel bleiben.
  verlauf?: { datum: string; betrag: number }[];
}

// Vom Nutzer erfassbare Felder eines Dienstes (ohne die vom System verwalteten).
export type DienstEingabe = Pick<
  Dienst,
  | "name"
  | "kategorie"
  | "inhaber"
  | "abrechnungsmodell"
  | "betrag"
  | "waehrung"
  | "statusAmpel"
  | "naechsteFaelligkeit"
  | "notiz"
>;

export interface Meta {
  version: number;
  eurUsdKurs: number | null;
  kursStand: string | null;
}

export interface CockpitData {
  meta: Meta;
  dienste: Dienst[];
}
