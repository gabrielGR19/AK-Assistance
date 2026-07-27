"use client";

import type { LabelSchluessel, Serie, Termin, Wochentag } from "@/lib/kalender-typen";

// Schreibzugriffe auf den Kalender. Jeder betrifft genau einen Eintrag — nur so können
// beide gleichzeitig arbeiten, ohne sich zu überschreiben.

export interface TerminEingabe {
  titel: string;
  label: LabelSchluessel;
  notiz: string;
  start: string;
  ende: string;
}

export interface SerienEingabe {
  titel: string;
  label: LabelSchluessel;
  notiz: string;
  startDatum: string;
  endDatum: string | null;
  startZeit: string;
  endeZeit: string;
  wiederholung: { art: "taeglich" } | { art: "wochentage"; tage: Wochentag[] };
}

async function schicke<T>(pfad: string, art: string, koerper?: unknown): Promise<T> {
  const antwort = await fetch(pfad, {
    method: art,
    headers: koerper === undefined ? undefined : { "Content-Type": "application/json" },
    body: koerper === undefined ? undefined : JSON.stringify(koerper),
  });
  const daten = await antwort.json().catch(() => ({}));
  if (!antwort.ok) {
    throw new Error((daten as { fehler?: string }).fehler ?? "Der Server hat die Änderung abgelehnt.");
  }
  return daten as T;
}

export function legeTerminAn(eingabe: TerminEingabe) {
  return schicke<{ termin: Termin }>("/api/kalender/termine", "POST", eingabe);
}

export function aendereTermin(id: string, eingabe: TerminEingabe) {
  return schicke<{ termin: Termin }>(`/api/kalender/termine/${encodeURIComponent(id)}`, "PATCH", eingabe);
}

export function loescheTermin(id: string) {
  return schicke<unknown>(`/api/kalender/termine/${encodeURIComponent(id)}`, "DELETE");
}

export function legeSerieAn(eingabe: SerienEingabe) {
  return schicke<{ serie: Serie }>("/api/kalender/serien", "POST", eingabe);
}

export function aendereSerie(id: string, eingabe: SerienEingabe) {
  return schicke<{ serie: Serie }>(`/api/kalender/serien/${encodeURIComponent(id)}`, "PATCH", eingabe);
}

export function loescheSerie(id: string) {
  return schicke<unknown>(`/api/kalender/serien/${encodeURIComponent(id)}`, "DELETE");
}

// Ein einzelnes Serien-Vorkommen: ohne `ersatz` wird es gelöscht, mit `ersatz` durch einen
// eigenständigen Termin ersetzt. Beides in einem Schreibvorgang, damit nichts verlorengeht.
export function aendereVorkommen(serieId: string, datum: string, ersatz?: TerminEingabe) {
  return schicke<{ termin: Termin | null }>(
    `/api/kalender/serien/${encodeURIComponent(serieId)}/ausnahme`,
    "POST",
    ersatz ? { datum, ersatz } : { datum },
  );
}
