// Client für die Retell.ai-API (POST /v3/list-calls), um Call-Kosten zusammenzufassen.
// Retell rechnet verbrauchsbasiert ab; einen Kontostand-Endpoint gibt es nicht — daher:
// alle Calls im gewünschten Zeitraum holen und ihre Kosten/Dauer aufaddieren.
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

// Rohes Ergebnis eines Zeitraum-Abrufs: alle Call-Objekte, unverarbeitet, für Aufrufer,
// die mehr als nur die Gesamtsumme brauchen (z.B. Aufschlüsselung pro Kunde/Agent).
export interface RetellCallsErgebnis {
  ok: boolean;
  calls: unknown[];
  keinKey: boolean;
  fehler: string | null;
}

// Summiert die combined_cost (Cent) einer Liste von Calls.
function summiereCent(calls: unknown[]): number {
  let cent = 0;
  for (const c of calls) {
    const wert = (c as { call_cost?: { combined_cost?: number } })?.call_cost?.combined_cost;
    if (typeof wert === "number" && Number.isFinite(wert)) cent += wert;
  }
  return cent;
}

// Holt ALLE Calls, deren Startzeit im Bereich [vonMs, bisMs) liegt, über alle Seiten hinweg.
// Gemeinsame Grundlage für die Gesamtkosten-Summe (holeVerbrauchMonat) und die
// Pro-Kunde-Aufschlüsselung (siehe lib/retell-kunden.ts) — Netzwerk-, Timeout- und
// Paginierungslogik soll es nur an einer Stelle geben.
export async function holeAlleCallsImZeitraum(vonMs: number, bisMs: number): Promise<RetellCallsErgebnis> {
  const key = process.env.RETELL_API_KEY;
  if (!key) {
    return { ok: false, calls: [], keinKey: true, fehler: "Kein Retell-API-Key in .env.local." };
  }

  let paginationKey: string | null = null;
  const alleCalls: unknown[] = [];

  try {
    for (let i = 0; i < MAX_SEITEN; i++) {
      const body: Record<string, unknown> = {
        limit: SEITEN_LIMIT,
        sort_order: "descending",
        filter_criteria: {
          start_timestamp: { type: "range", op: "bt", value: [vonMs, bisMs] },
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
          calls: alleCalls,
          keinKey: false,
          fehler: `Retell-API antwortete mit HTTP ${res.status}.`,
        };
      }

      const json: unknown = await res.json();
      const items = (json as { items?: unknown })?.items;
      if (Array.isArray(items)) alleCalls.push(...items);

      const hasMore = (json as { has_more?: boolean })?.has_more === true;
      const next = (json as { pagination_key?: string })?.pagination_key;
      if (!hasMore || !next) break;
      paginationKey = next;
    }

    return { ok: true, calls: alleCalls, keinKey: false, fehler: null };
  } catch (err) {
    const grund = err instanceof Error && err.name === "AbortError" ? "Zeitüberschreitung" : "Netzwerkfehler";
    return { ok: false, calls: alleCalls, keinKey: false, fehler: `Retell-API nicht erreichbar (${grund}).` };
  }
}

// Ruft die Gesamtkosten aller Calls ab, deren Startzeit ≥ `startEpochMs` liegt (bis jetzt).
export async function holeVerbrauchMonat(startEpochMs: number): Promise<RetellErgebnis> {
  const ergebnis = await holeAlleCallsImZeitraum(startEpochMs, Date.now());
  if (!ergebnis.ok) {
    return { ok: false, verbrauchUsd: null, keinKey: ergebnis.keinKey, fehler: ergebnis.fehler };
  }
  return { ok: true, verbrauchUsd: summiereCent(ergebnis.calls) / 100, keinKey: false, fehler: null };
}
