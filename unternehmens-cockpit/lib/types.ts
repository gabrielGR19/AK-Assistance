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

// Verbrauch eines einzelnen Kunden (= ein Retell-Agent im Deployment-System) in einem Zeitraum.
export interface KundenVerbrauchEintrag {
  agentId: string;
  agentName: string;
  anzahlCalls: number;
  minuten: number;
  kostenUsd: number;
}

// Unveränderlicher Monats-Snapshot des Kunden-Verbrauchs — einmal erzeugt, nie mehr
// überschrieben. Dient als Beleg für die individuelle Kundenabrechnung, unabhängig davon,
// wie lange Retell die Rohdaten noch vorhält oder ob sich ein Agent-Name später ändert.
export interface KundenMonatSnapshot {
  monat: string; // "YYYY-MM"
  eingefrorenAm: string; // ISO-Zeitstempel des Einfrierens
  kunden: KundenVerbrauchEintrag[];
}

// Ein Alert aus der Voice-Agent-Überwachung (Retell-Calls + n8n-Executions).
export type AlertSchwere = "hoch" | "mittel" | "niedrig";
export type AlertStatus = "neu" | "gesehen" | "erledigt";

export interface Alert {
  id: string;
  // Fingerprint für die Bündelung gleichartiger Fehler: agentId|kategorie|ursache.
  fingerprint: string;
  zeitstempel: string; // ISO, erstes Auftreten
  letztesAuftreten: string; // ISO, jüngstes Auftreten (bei Bündelung aktualisiert)
  agentId: string;
  agentName: string;
  callId: string | null;
  n8nExecutionId: string | null;
  kategorie: string; // z.B. "tool-fehler", "n8n-fehler", "google-credentials", "log-fehlt", ...
  schwere: AlertSchwere;
  titel: string;
  detail: string;
  publicLogUrl: string | null; // Retell-Transcript/Log-Link
  n8nUrl: string | null; // Link zur fehlgeschlagenen Execution
  status: AlertStatus;
  anzahlGebuendelt: number; // wie oft derselbe Fehler innerhalb des Bündel-Fensters auftrat
}

// Scan-Zustand, damit jeder Lauf nur Neues auswertet (mit Überlappung gegen Lücken).
export interface AlertsScanZustand {
  letzterScanMs: number | null;
  letzterLaufIso: string | null;
  letzterFehler: string | null;
}

export interface CockpitData {
  meta: Meta;
  dienste: Dienst[];
  // Eingefrorene Kunden-Verbrauchs-Monate. Optional, damit Altbestände in cockpit.json ohne
  // dieses Feld kompatibel bleiben.
  kundenVerbrauch?: KundenMonatSnapshot[];
  // Voice-Agent-Alerts. Optional, damit Altbestände kompatibel bleiben.
  alerts?: Alert[];
  alertsScan?: AlertsScanZustand;
}
