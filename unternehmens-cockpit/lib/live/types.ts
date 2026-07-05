import type { Dienst } from "@/lib/types";

// Einheitliches Ergebnis eines Live-Abrufs, wie es die bestehenden Clients (lib/claude.ts,
// lib/retell.ts) bereits zurückgeben.
export interface VerbrauchErgebnis {
  ok: boolean;
  verbrauchUsd: number | null;
  keinKey: boolean;
  fehler: string | null;
}

// Kapselt Live-Abruf + dienst-spezifisches Zurückschreiben für GENAU einen Dienst.
// Ein neuer Live-Dienst braucht nur eine neue Implementierung dieses Interfaces plus
// einen Eintrag in lib/live/registry.ts — keine weiteren Codeänderungen nötig.
export interface LiveProvider {
  // Muss exakt der Dienst-ID entsprechen (ersetzt frühere Sonderfälle wie d.id === "retell").
  dienstId: string;
  // Prüft Voraussetzungen vor dem Abruf (z.B. Claude braucht ein gesetztes Basis-Datum).
  // null = Voraussetzung erfüllt.
  pruefeVoraussetzung?(d: Dienst): string | null;
  holeVerbrauch(d: Dienst): Promise<VerbrauchErgebnis>;
  // Schreibt ein erfolgreiches Ergebnis dienst-spezifisch in den Datensatz
  // (z.B. d.betrag bei Retell, d.claude.verbrauchSeitBasisUsd bei Claude).
  wendeErgebnisAn(d: Dienst, ergebnis: VerbrauchErgebnis): void;
}
