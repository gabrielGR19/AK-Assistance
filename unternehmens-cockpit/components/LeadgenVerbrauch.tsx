"use client";

import { useState } from "react";
import type { Dienst, StatusAmpel } from "@/lib/types";
import type { LiveInfo } from "@/lib/live/runner";
import { relativeTage } from "@/lib/format";
import { StatusLed } from "@/components/StatusLed";

const FREIKONTINGENT = 1000; // Calls/Monat, siehe ak-leadgen/README.md "Meta"-Tab

function ampelFuerVerbrauch(calls: number): StatusAmpel {
  const anteil = calls / FREIKONTINGENT;
  if (anteil >= 0.9) return "handlung";
  if (anteil >= 0.7) return "beobachten";
  return "ok";
}

// Reine Verbrauchsanzeige für ak-leadgen (Google Places API) - kein Geldbetrag,
// keine manuelle Pflege. Zeigt Calls diesen Monat gegen das Freikontingent.
export function LeadgenVerbrauch({
  dienst,
  onAbrufen,
}: {
  dienst: Dienst;
  onAbrufen: () => Promise<LiveInfo | null>;
}) {
  const l = dienst.leadgen;
  const [meldung, setMeldung] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  if (!l) return null;

  const calls = l.callsMonat;
  const verbrauchLabel =
    dienst.abrufStatus === "fehlgeschlagen"
      ? "Live-Abruf fehlgeschlagen — Wert nicht bestätigt"
      : dienst.herkunft === "live" && dienst.letzterAbruf
        ? `live · aktualisiert ${relativeTage(dienst.letzterAbruf)}`
        : "noch nicht abgerufen";

  async function abrufen() {
    setMeldung(null);
    setLaedt(true);
    const info = await onAbrufen();
    setLaedt(false);
    if (!info) return;
    if (info.keinKey) {
      setMeldung(
        "Kein Sheets-Zugang hinterlegt — GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL, " +
          "GOOGLE_SHEETS_PRIVATE_KEY und LEADGEN_SHEET_ID in .env.local setzen.",
      );
    } else if (!info.ok) {
      setMeldung(`Live-Abruf fehlgeschlagen: ${info.fehler ?? "unbekannter Fehler"}.`);
    } else {
      setMeldung("Verbrauch live aktualisiert.");
    }
  }

  return (
    <section className="panel claude" aria-label="Google Places API Verbrauch">
      <div className="claude__kopf">
        <h2 className="abschnitt__titel" style={{ margin: 0 }}>
          Google Places API (Leadgen) <span className="claude__sub">Freikontingent {FREIKONTINGENT}/Monat</span>
        </h2>
        <button type="button" className="btn btn--klein" onClick={abrufen} disabled={laedt}>
          {laedt ? "Rufe ab …" : "Verbrauch live abrufen"}
        </button>
      </div>

      <div className="claude__zahlen">
        <div className="claude__rest">
          <span className="eyebrow">Calls diesen Monat{l.monat ? ` (${l.monat})` : ""}</span>
          <span className="claude__restzahl">
            {calls == null ? "—" : `${calls} / ${FREIKONTINGENT}`}
          </span>
          {calls != null && <StatusLed status={ampelFuerVerbrauch(calls)} />}
          <span className="claude__geschaetzt">{verbrauchLabel}</span>
        </div>
      </div>

      {meldung && <p className="meldung">{meldung}</p>}
    </section>
  );
}
