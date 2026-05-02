import type { RetellCallEndedEvent } from "../webhook/retell.types";
import type { CallSummaryData } from "../whatsapp/whatsapp.types";

const NAME_PATTERNS = [
  /(?:mein name ist|ich heiße|hier ist|hier spricht)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)/i,
];

const DATE_PATTERNS = [
  /(?:am|den|für den|nächsten?)\s+(\d{1,2}\.\s*(?:januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|\d{1,2})(?:\s*\d{4})?)/i,
  /(\d{1,2}\.\d{1,2}\.(?:\d{4})?)/,
];

export function extractCallData(event: RetellCallEndedEvent): CallSummaryData {
  const transcript = event.transcript ?? "";

  const customerName = extractName(transcript);
  const appointmentDate = extractDate(transcript);
  const appointmentRequested = Boolean(appointmentDate) || /termin/i.test(transcript);

  return {
    customerName,
    customerPhone: event.from_number,
    summary: event.call_summary ?? "Keine Zusammenfassung verfügbar.",
    appointmentRequested,
    appointmentDate,
    craftworkerPhone: event.to_number,
  };
}

function extractName(transcript: string): string | undefined {
  for (const pattern of NAME_PATTERNS) {
    const match = transcript.match(pattern);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

function extractDate(transcript: string): string | undefined {
  for (const pattern of DATE_PATTERNS) {
    const match = transcript.match(pattern);
    if (match?.[1]) return match[1];
  }
  return undefined;
}
