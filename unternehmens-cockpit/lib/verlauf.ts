import type { Dienst } from "./types";

// Deckelt die Verlaufslänge, damit cockpit.json nicht unbegrenzt wächst (bei monatlichen
// Änderungen entspricht das ~2 Jahren Historie).
const MAX_EINTRAEGE = 24;

// Hängt einen Verlaufspunkt (heutiges Datum + aktueller Betrag) an, egal ob der Betrag
// manuell oder live gesetzt wurde. Mehrere Änderungen am selben Tag ersetzen den Tagespunkt,
// statt Duplikate anzuhäufen.
export function fuegeVerlaufspunktHinzu(d: Dienst, jetzt: Date = new Date()): void {
  if (d.betrag == null) return;
  const heute = jetzt.toISOString().slice(0, 10);
  const ohneHeute = (d.verlauf ?? []).filter((p) => p.datum !== heute);
  d.verlauf = [...ohneHeute, { datum: heute, betrag: d.betrag }].slice(-MAX_EINTRAEGE);
}
