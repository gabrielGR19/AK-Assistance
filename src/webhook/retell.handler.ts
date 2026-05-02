import type { RetellCallEndedEvent, RetellCallStartedEvent } from "./retell.types";
import { sendWhatsAppSummary } from "../whatsapp/whatsapp.service";
import { triggerN8nWorkflow } from "../n8n/n8n.service";
import { extractCallData } from "../utils/call-parser";

export async function handleCallStarted(event: RetellCallStartedEvent): Promise<void> {
  console.log(`📞 Anruf gestartet: ${event.call_id} von ${event.from_number}`);

  await triggerN8nWorkflow("call-started", {
    callId: event.call_id,
    fromNumber: event.from_number,
    toNumber: event.to_number,
    timestamp: event.start_timestamp,
  });
}

export async function handleCallEnded(event: RetellCallEndedEvent): Promise<void> {
  console.log(`📴 Anruf beendet: ${event.call_id} (${event.duration_ms}ms)`);

  const callData = extractCallData(event);

  // WhatsApp-Zusammenfassung an den Handwerker senden
  await sendWhatsAppSummary(callData);

  // n8n-Workflow für Nachbearbeitung starten (CRM, Kalender, etc.)
  await triggerN8nWorkflow("call-ended", {
    callId: event.call_id,
    fromNumber: event.from_number,
    duration: event.duration_ms,
    transcript: event.transcript,
    summary: event.call_summary,
    customerName: callData.customerName,
    appointmentRequested: callData.appointmentRequested,
    appointmentDate: callData.appointmentDate,
    recordingUrl: event.recording_url,
  });
}
