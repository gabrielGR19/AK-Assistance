// Holt den aktuellen EUR/USD-Kurs (EZB-Referenzkurs) über die kostenlose,
// unauthentifizierte API frankfurter.dev. Wirft nie — bei jedem Fehler wird
// null zurückgegeben, damit ein bestehender Kurs im Cockpit unangetastet bleibt.
const KURS_URL = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR";
const TIMEOUT_MS = 10_000;

export async function holeEurUsdKurs(): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(KURS_URL, { signal: controller.signal });
    if (!res.ok) return null;
    const daten = (await res.json()) as { rates?: { EUR?: number } };
    const kurs = daten?.rates?.EUR;
    return typeof kurs === "number" && Number.isFinite(kurs) && kurs > 0 ? kurs : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
