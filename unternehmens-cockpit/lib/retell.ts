// Client für die Retell.ai-API (POST /v3/list-calls), um die Call-Kosten des laufenden
// Monats zu summieren. Retell rechnet verbrauchsbasiert ab; einen Kontostand-Endpoint gibt
// es nicht — daher: alle Calls seit Monatsanfang holen und ihre Kosten aufaddieren.
//
// Sicherheit: Der API-Key wird AUSSCHLIESSLICH serverseitig aus process.env gelesen,
// niemals geloggt, niemals ins Frontend serialisiert. Diese Datei läuft nur serverseitig.

const LIST_URL = "https://api.retellai.com/v3/list-calls";
const SEITEN_LIMIT = 1000; // max. Calls pro Seite (API-Maximum)
const MAX_SEITEN = 20; // Paginierung defensiv begrenzen
const TIMEOUT_MS = 15_000;

export interface RetellErgebnis {
  ok: boolean;
  verbrauchUsd: number | null; // Summe der Call-Kosten des Monats in USD (Cent/100), null bei Fehler
  keinKey: boolean; // true, wenn RETELL_API_KEY fehlt → sauberer Fallback auf manuelle Eingabe
  fehler: string | null; // kurze, key-freie Fehlerbeschreibung
}

// Summiert die combined_cost (Cent) aller Calls einer Antwortseite.
function summiereSeite(calls: unknown): number {
  let cent = 0;
  if (!Array.isArray(calls)) return 0;
  for (const c of calls) {
    const wert = (c as { call_cost?: { combined_cost?: number } })?.call_cost?.combined_cost;
    if (typeof wert === "number" && Number.isFinite(wert)) cent += wert;
  }
  return cent;
}

// Ruft die Gesamtkosten aller Calls ab, deren Startzeit ≥ `startEpochMs` liegt (bis jetzt).
// Defensive Fehlerbehandlung: fehlender Key, Timeout, HTTP-Fehler und kaputtes JSON werden
// abgefangen und gemeldet, nie wird der Key preisgegeben.
export async function holeVerbrauchMonat(startEpochMs: number): Promise<RetellErgebnis> {
  const key = process.env.RETELL_API_KEY;
  if (!key) {
    return { ok: false, verbrauchUsd: null, keinKey: true, fehler: "Kein Retell-API-Key in .env.local." };
  }

  const jetzt = Date.now();
  let paginationKey: string | null = null;
  let centSumme = 0;

  try {
    for (let i = 0; i < MAX_SEITEN; i++) {
      const body: Record<string, unknown> = {
        limit: SEITEN_LIMIT,
        sort_order: "descending",
        filter_criteria: {
          start_timestamp: { type: "range", op: "bt", value: [startEpochMs, jetzt] },
        },
      };
      if (paginationKey) body.pagination_key = paginationKey;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(LIST_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
          fehler: `Retell-API antwortete mit HTTP ${res.status}.`,
        };
      }

      const json: unknown = await res.json();
      const calls = (json as { items?: unknown })?.items;
      centSumme += summiereSeite(calls);

      const hasMore = (json as { has_more?: boolean })?.has_more === true;
      const next = (json as { pagination_key?: string })?.pagination_key;
      if (!hasMore || !next) break;
      paginationKey = next;
    }

    return { ok: true, verbrauchUsd: centSumme / 100, keinKey: false, fehler: null };
  } catch (err) {
    const grund = err instanceof Error && err.name === "AbortError" ? "Zeitüberschreitung" : "Netzwerkfehler";
    return { ok: false, verbrauchUsd: null, keinKey: false, fehler: `Retell-API nicht erreichbar (${grund}).` };
  }
}
