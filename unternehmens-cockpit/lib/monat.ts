// Hilfsfunktion für Monats-basierte Auswertungen (z.B. Kunden-Verbrauch).

export interface Monatsbereich {
  vonMs: number;
  bisMs: number;
  monat: string; // "YYYY-MM"
  istLaufenderMonat: boolean;
}

// Liefert den Zeitbereich für einen Monat als UTC-Millisekunden.
// Ohne Angabe: laufender Monat, bis jetzt (nicht bis Monatsende, da noch nicht vorbei).
// Mit Angabe ("YYYY-MM"): kompletter Monat, außer es ist zufällig der laufende Monat.
export function monatsBereichMs(monat?: string | null): Monatsbereich {
  const jetzt = new Date();
  let jahr = jetzt.getUTCFullYear();
  let monatIndex = jetzt.getUTCMonth(); // 0-basiert

  const passt = monat?.match(/^(\d{4})-(\d{2})$/);
  if (passt) {
    jahr = Number(passt[1]);
    monatIndex = Number(passt[2]) - 1;
  }

  const istLaufenderMonat = jahr === jetzt.getUTCFullYear() && monatIndex === jetzt.getUTCMonth();
  const vonMs = Date.UTC(jahr, monatIndex, 1);
  const bisMs = istLaufenderMonat ? Date.now() : Date.UTC(jahr, monatIndex + 1, 1);
  const monatStr = `${jahr}-${String(monatIndex + 1).padStart(2, "0")}`;

  return { vonMs, bisMs, monat: monatStr, istLaufenderMonat };
}
