import { CockpitData, Dienst } from "./types";

// Ergebnis der Kostenberechnung. Alle Beträge in EUR (Basiswährung).
export interface KostenErgebnis {
  monatEur: number; // Summe der bekannten Monatskosten in EUR
  jahrEur: number; // Summe der bekannten Jahreskosten in EUR
  kursFehlt: boolean; // true, wenn USD-Posten existieren, aber kein Wechselkurs gepflegt ist
  unvollstaendig: boolean; // true, wenn Dienste ohne Betrag in die Summe einfließen würden
  proDienst: DienstKosten[];
}

export interface DienstKosten {
  id: string;
  monatEur: number | null; // null = nicht berechenbar (Betrag fehlt oder USD ohne Kurs)
  jahrEur: number | null;
  umgerechnet: boolean; // true, wenn der Wert aus USD umgerechnet wurde (für Transparenz-Label)
}

// Rechnet einen Betrag in EUR um. Gibt null zurück, wenn USD ohne gepflegten Kurs vorliegt.
function nachEur(betrag: number, waehrung: "EUR" | "USD", kurs: number | null): number | null {
  if (waehrung === "EUR") return betrag;
  if (kurs == null) return null; // USD nicht umrechenbar ohne Kurs
  return betrag * kurs;
}

// Monatlicher Rohbetrag eines Dienstes in SEINER Währung (vor Umrechnung).
// jährlich wird auf den Monat heruntergerechnet; Verbrauch gilt als monatlicher Schätz-/Ist-Wert.
function monatsBetrag(d: Dienst): number | null {
  if (d.betrag == null) return null;
  switch (d.abrechnungsmodell) {
    case "monatlich":
      return d.betrag;
    case "jaehrlich":
      return d.betrag / 12;
    case "verbrauch":
      return d.betrag; // manuell eingetragener monatlicher Schätz-/Ist-Wert
  }
}

// Jährlicher Rohbetrag eines Dienstes in SEINER Währung (vor Umrechnung).
function jahresBetrag(d: Dienst): number | null {
  if (d.betrag == null) return null;
  switch (d.abrechnungsmodell) {
    case "monatlich":
      return d.betrag * 12;
    case "jaehrlich":
      return d.betrag;
    case "verbrauch":
      return d.betrag * 12; // monatlicher Schätzwert × 12
  }
}

// Berechnet Monats- und Jahressumme in EUR sowie die Werte pro Dienst.
// USD-Posten werden über meta.eurUsdKurs umgerechnet und als "umgerechnet" markiert.
export function berechneKosten(daten: CockpitData): KostenErgebnis {
  const kurs = daten.meta.eurUsdKurs;
  let monatEur = 0;
  let jahrEur = 0;
  let kursFehlt = false;
  let unvollstaendig = false;

  const proDienst: DienstKosten[] = daten.dienste.map((d) => {
    const mRoh = monatsBetrag(d);
    const jRoh = jahresBetrag(d);

    if (mRoh == null) {
      // Kein Betrag gepflegt — dieser Dienst fehlt in der Summe.
      unvollstaendig = true;
      return { id: d.id, monatEur: null, jahrEur: null, umgerechnet: false };
    }

    const mEur = nachEur(mRoh, d.waehrung, kurs);
    const jEur = jRoh == null ? null : nachEur(jRoh, d.waehrung, kurs);

    if (mEur == null) {
      // USD-Betrag vorhanden, aber kein Kurs → nicht in EUR summierbar.
      kursFehlt = true;
      return { id: d.id, monatEur: null, jahrEur: null, umgerechnet: false };
    }

    monatEur += mEur;
    if (jEur != null) jahrEur += jEur;

    return {
      id: d.id,
      monatEur: mEur,
      jahrEur: jEur,
      umgerechnet: d.waehrung === "USD",
    };
  });

  return { monatEur, jahrEur, kursFehlt, unvollstaendig, proDienst };
}
