// Konfiguration der Voice-Agent-Überwachung. Neue Retell-Agenten werden automatisch
// über die Call-Liste erfasst — hier muss nur ergänzt werden, was sich nicht aus den
// Call-Daten ableiten lässt: die Zuordnung n8n-Workflow → Agent und Sonderregeln.

// n8n-Workflow-IDs der Voice-Booking-Workflows, zugeordnet zum jeweiligen Retell-Agenten.
// Bei einem neuen Kunden-Deployment: eine Zeile ergänzen, fertig.
export const WORKFLOW_ZU_AGENT: Record<string, { agentId: string; agentName: string }> = {
  MQ6NzCiQDwuVhcxi: { agentId: "agent_9d7f0b6be7741018456f2ac836", agentName: "AK-assistance Voice Agent V2" },
  jDEfEv5KBTJuAua7: { agentId: "agent_a22e3be0927bcf9b5d6daa49c4", agentName: "Adam Gebäudeservice — KI-Assistent" },
  fNlrWIDnraQ0GN9I: { agentId: "agent_26bd49df2b39def84dce26439d", agentName: "Reinigungsservice Müller GmbH Voice Agent" },
};

// Agenten, deren Flow ein Pflicht-log_call am Gesprächsende hat. Nur bei diesen wird
// "Call ohne log_call" als Fehler gemeldet (Kunden-Agenten loggen über den Booking-Workflow).
export const LOG_PFLICHT_AGENT_IDS = new Set(["agent_9d7f0b6be7741018456f2ac836"]);

// Erlaubte Buchungszeiten pro Agent (lokale Zeit Europe/Berlin). Fallback: Mo–Sa 10–17 Uhr.
// tage: 0=So … 6=Sa.
export interface Buchungsfenster {
  tage: Set<number>;
  vonStunde: number;
  bisStunde: number; // exklusiv: 17 bedeutet "letzter Start 16:xx" ist ok, 17:00 selbst noch erlaubt
}
const STANDARD_FENSTER: Buchungsfenster = { tage: new Set([1, 2, 3, 4, 5, 6]), vonStunde: 10, bisStunde: 17 };
export const BUCHUNGSFENSTER: Record<string, Buchungsfenster> = {};
export function buchungsfensterFuer(agentId: string): Buchungsfenster {
  return BUCHUNGSFENSTER[agentId] ?? STANDARD_FENSTER;
}

// Calls kürzer als diese Dauer gelten als "sehr kurz" (Abbruch nach Begrüßung).
export const KURZ_CALL_MS = 15_000;
// Unter dieser Dauer wird fehlendes log_call nicht bemängelt (Anrufer sofort aufgelegt).
export const LOG_MIN_DAUER_MS = 10_000;
// Gleichartige Fehler innerhalb dieses Fensters werden gebündelt statt neu angelegt.
export const BUENDEL_FENSTER_MS = 24 * 60 * 60 * 1000;
// Überlappung beim Scan, damit zwischen zwei Läufen nichts verloren geht.
export const SCAN_UEBERLAPPUNG_MS = 2 * 60 * 60 * 1000;
