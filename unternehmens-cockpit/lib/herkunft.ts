// Datenintegrität: leitet aus einem Dienst ab, WOHER sein Wert stammt und wie frisch er ist.
// Reine Funktion (kein HTTP/DOM) — dieselbe Logik ist später in Report/Cronjob wiederverwendbar.
// Grundregel: Ein alter Live-Wert wird NIE als aktuell ausgegeben; fehlgeschlagene Abrufe sind sichtbar.

import type { Dienst } from "./types";
import { formatDatum, relativeTage } from "./format";

// Ab wann ein manuell gepflegter Wert als "bitte prüfen" gilt.
export const PRUEF_TAGE = 90;

// Ton steuert die Farbe des Badges: manuell/live ruhig, veraltet grau-auffällig, geschätzt dezent.
export type HerkunftTon = "manuell" | "live" | "veraltet" | "geschaetzt";

export interface HerkunftAnzeige {
  text: string; // Kurztext im Badge, z.B. "live · aktualisiert vor 2 Tagen"
  ton: HerkunftTon;
  titel: string; // ausführlicher Tooltip
  pruefen: boolean; // true → zusätzlicher "bitte prüfen"-Hinweis (manueller Wert > 90 Tage)
}

// Anzahl ganzer Tage zwischen einem ISO-Zeitstempel und jetzt (positiv = Vergangenheit).
function tageHer(iso: string, jetzt: Date): number {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((jetzt.getTime() - d.getTime()) / 86_400_000);
}

// Bestimmt Herkunft und Frische eines Dienstwerts.
export function herkunftAnzeige(d: Dienst, jetzt: Date = new Date()): HerkunftAnzeige {
  if (d.herkunft === "live") {
    // Fehlgeschlagener Abruf: alten Wert nicht als aktuell ausgeben.
    if (d.abrufStatus === "fehlgeschlagen") {
      const stand = d.letzterAbruf ? ` (letzter Erfolg ${formatDatum(d.letzterAbruf)})` : "";
      return {
        text: "Abruf fehlgeschlagen",
        ton: "veraltet",
        titel: `Der letzte Live-Abruf ist fehlgeschlagen${stand}. Wert nicht bestätigt.`,
        pruefen: false,
      };
    }
    if (d.abrufStatus === "veraltet") {
      const stand = d.letzterAbruf ? ` von ${formatDatum(d.letzterAbruf)}` : "";
      return {
        text: "veraltet",
        ton: "veraltet",
        titel: `Live-Wert${stand} ist veraltet und wurde nicht erneuert.`,
        pruefen: false,
      };
    }
    if (d.abrufStatus === "ok" && d.letzterAbruf) {
      return {
        text: `live · aktualisiert ${relativeTage(d.letzterAbruf, jetzt)}`,
        ton: "live",
        titel: `Automatisch abgerufen am ${formatDatum(d.letzterAbruf)}.`,
        pruefen: false,
      };
    }
    // Live geflaggt, aber noch kein Abruf erfolgt.
    return {
      text: "live · noch kein Abruf",
      ton: "veraltet",
      titel: "Für diesen Dienst ist noch kein Live-Wert abgerufen worden.",
      pruefen: false,
    };
  }

  // Manuell gepflegt: Stand-Datum + 90-Tage-Prüfung.
  const alter = tageHer(d.letzteAenderung, jetzt);
  const pruefen = alter > PRUEF_TAGE;
  return {
    text: `manuell · Stand ${formatDatum(d.letzteAenderung)}`,
    ton: "manuell",
    titel: pruefen
      ? `Manuell gepflegt, zuletzt vor ${alter} Tagen — bitte prüfen, ob noch aktuell.`
      : `Manuell gepflegt am ${formatDatum(d.letzteAenderung)}.`,
    pruefen,
  };
}
