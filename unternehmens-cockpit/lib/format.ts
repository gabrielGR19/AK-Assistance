// Formatierungs-Helfer, durchgängig deutsch (de-DE) mit tabellarischen Ziffern in der UI via CSS.

const EUR = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const USD = new Intl.NumberFormat("de-DE", { style: "currency", currency: "USD" });
const ZAHL2 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Formatiert einen EUR-Betrag, z.B. 1.234,56 €.
export function formatEur(betrag: number): string {
  return EUR.format(betrag);
}

// Formatiert einen Betrag in seiner eigenen Währung (EUR oder USD).
export function formatBetrag(betrag: number, waehrung: "EUR" | "USD"): string {
  return waehrung === "USD" ? USD.format(betrag) : EUR.format(betrag);
}

// Reine Zahl mit zwei Nachkommastellen (ohne Währungssymbol).
export function formatZahl(betrag: number): string {
  return ZAHL2.format(betrag);
}

// Formatiert ein ISO-Datum (YYYY-MM-DD oder voller Zeitstempel) als TT.MM.JJJJ.
export function formatDatum(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Relative Angabe „vor X Tagen" / „heute" / „in X Tagen" für Zeitstempel und Fälligkeiten.
export function relativeTage(iso: string, jetzt: Date = new Date()): string {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return "—";
  const tage = Math.round((d.getTime() - jetzt.getTime()) / 86_400_000);
  if (tage === 0) return "heute";
  if (tage > 0) return `in ${tage} Tag${tage === 1 ? "" : "en"}`;
  const abs = Math.abs(tage);
  return `vor ${abs} Tag${abs === 1 ? "" : "en"}`;
}
