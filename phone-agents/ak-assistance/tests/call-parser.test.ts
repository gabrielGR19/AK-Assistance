import { describe, expect, it } from "vitest";
import { extractCallData } from "../src/utils/call-parser";
import type { RetellCallEndedEvent } from "../src/webhook/retell.types";

// Hilfsfunktion: minimales call_ended-Event mit überschreibbaren Feldern
function ereignis(overrides: Partial<RetellCallEndedEvent> = {}): RetellCallEndedEvent {
  return {
    event: "call_ended",
    call_id: "call-123",
    agent_id: "agent-1",
    from_number: "+491701234567",
    to_number: "+49911987654",
    start_timestamp: 1_700_000_000,
    end_timestamp: 1_700_000_300,
    duration_ms: 300_000,
    ...overrides,
  };
}

describe("extractCallData", () => {
  it("extrahiert Name und numerisches Datum aus einem typischen Transkript", () => {
    const daten = extractCallData(
      ereignis({
        transcript:
          "Guten Tag, mein Name ist Max Mustermann. Ich hätte gern einen Termin am 12.05.2026 für eine Reparatur.",
        call_summary: "Kunde wünscht Reparaturtermin.",
      })
    );

    expect(daten.customerName).toBe("Max Mustermann");
    // BEFUND (src nicht geändert, Guardrail): Das erste DATE_PATTERN greift
    // vor dem zweiten und schneidet bei "am 12.05.2026" das Jahr ab, weil
    // (?:\s*\d{4})? den Punkt vor der Jahreszahl nicht matcht.
    // Erwartet wäre "12.05.2026" — Ist-Verhalten: "12.05".
    expect(daten.appointmentDate).toBe("12.05");
    expect(daten.appointmentRequested).toBe(true);
    expect(daten.summary).toBe("Kunde wünscht Reparaturtermin.");
    expect(daten.customerPhone).toBe("+491701234567");
    expect(daten.craftworkerPhone).toBe("+49911987654");
  });

  it("erkennt 'hier spricht' und Monatsnamen-Datum", () => {
    const daten = extractCallData(
      ereignis({
        transcript: "Hallo, hier spricht Anna Schmidt, es geht um den 3. Juli.",
      })
    );

    expect(daten.customerName).toBe("Anna Schmidt");
    expect(daten.appointmentDate).toBe("3. Juli");
  });

  it("setzt appointmentRequested auch ohne Datum, wenn 'Termin' fällt", () => {
    const daten = extractCallData(
      ereignis({ transcript: "Ich brauche dringend einen Termin, bitte um Rückruf." })
    );

    expect(daten.customerName).toBeUndefined();
    expect(daten.appointmentDate).toBeUndefined();
    expect(daten.appointmentRequested).toBe(true);
  });

  it("liefert Defaults bei leerem Transkript ohne Zusammenfassung", () => {
    const daten = extractCallData(ereignis({ transcript: "" }));

    expect(daten.customerName).toBeUndefined();
    expect(daten.appointmentDate).toBeUndefined();
    expect(daten.appointmentRequested).toBe(false);
    expect(daten.summary).toBe("Keine Zusammenfassung verfügbar.");
  });

  it("verkraftet fehlendes Transkript (undefined)", () => {
    const daten = extractCallData(ereignis());

    expect(daten.customerName).toBeUndefined();
    expect(daten.appointmentRequested).toBe(false);
  });

  it("erkennt einteilige Namen ('ich heiße Petra')", () => {
    const daten = extractCallData(ereignis({ transcript: "Ja hallo, ich heiße Petra." }));

    expect(daten.customerName).toBe("Petra");
  });
});
