// Client für die Anthropic Cost-API (Admin-API), um den Claude-Verbrauch seit einem Startdatum
// zu summieren. Nur so lässt sich das geschätzte Restguthaben des Blog-Agenten überwachen
// (kein Auto-Reload: bei 0 stoppen die wöchentlichen Blogposts).
//
// Sicherheit: Der Admin-Key wird AUSSCHLIESSLICH serverseitig aus process.env gelesen,
// niemals geloggt, niemals ins Frontend serialisiert. Diese Datei läuft nur serverseitig.

const COST_URL = "https://api.anthropic.com/v1/organizations/cost_report";
const VERSION = "2023-06-01";
const MAX_SEITEN = 12; // Paginierung defensiv begrenzen
const TIMEOUT_MS = 15_000;

export interface VerbrauchErgebnis {
  ok: boolean;
  verbrauchUsd: number | null; // Summe seit Startdatum in USD (Cent/100), null bei Fehler
  keinKey: boolean; // true, wenn ANTHROPIC_ADMIN_KEY fehlt → sauberer Fallback auf manuelle Eingabe
  fehler: string | null; // kurze, key-freie Fehlerbeschreibung
}

// Summiert alle Kostenpositionen aus einer Cost-API-Antwortseite (amount ist in Cent).
function summiereSeite(daten: unknown): number {
  let cent = 0;
  const buckets = (daten as { data?: unknown[] })?.data;
  if (!Array.isArray(buckets)) return 0;
  for (const b of buckets) {
    const results = (b as { results?: unknown[] })?.results;
    if (!Array.isArray(results)) continue;
    for (const r of results) {
      const amount = (r as { amount?: string })?.amount;
      const wert = typeof amount === "string" ? Number.parseFloat(amount) : NaN;
      if (Number.isFinite(wert)) cent += wert;
    }
  }
  return cent;
}

// Ruft den Gesamtverbrauch seit `startDatum` (YYYY-MM-DD) ab. Defensive Fehlerbehandlung:
// fehlender Key, Timeout, HTTP-Fehler und kaputtes JSON werden abgefangen und gemeldet,
// nie wird der Key preisgegeben.
export async function holeVerbrauchSeit(startDatum: string): Promise<VerbrauchErgebnis> {
  const key = process.env.ANTHROPIC_ADMIN_KEY;
  if (!key) {
    return { ok: false, verbrauchUsd: null, keinKey: true, fehler: "Kein Admin-Key in .env.local." };
  }

  const startIso = `${startDatum}T00:00:00Z`;
  let seite: string | null = null;
  let centSumme = 0;

  try {
    for (let i = 0; i < MAX_SEITEN; i++) {
      const url = new URL(COST_URL);
      url.searchParams.set("starting_at", startIso);
      url.searchParams.set("bucket_width", "1d");
      url.searchParams.set("limit", "31");
      if (seite) url.searchParams.set("page", seite);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(url, {
          headers: { "x-api-key": key, "anthropic-version": VERSION },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        // Statuscode ist unkritisch, der Key steht nicht in der Meldung.
        return {
          ok: false,
          verbrauchUsd: null,
          keinKey: false,
          fehler: `Cost-API antwortete mit HTTP ${res.status}.`,
        };
      }

      const json: unknown = await res.json();
      centSumme += summiereSeite(json);

      const hasMore = (json as { has_more?: boolean })?.has_more === true;
      const next = (json as { next_page?: string })?.next_page;
      if (!hasMore || !next) break;
      seite = next;
    }

    return { ok: true, verbrauchUsd: centSumme / 100, keinKey: false, fehler: null };
  } catch (err) {
    const grund = err instanceof Error && err.name === "AbortError" ? "Zeitüberschreitung" : "Netzwerkfehler";
    return { ok: false, verbrauchUsd: null, keinKey: false, fehler: `Cost-API nicht erreichbar (${grund}).` };
  }
}
