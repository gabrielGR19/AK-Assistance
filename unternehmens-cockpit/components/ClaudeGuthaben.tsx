"use client";

import { useState } from "react";
import type { Dienst } from "@/lib/types";
import type { LiveInfo } from "@/lib/live/runner";
import { formatBetrag, formatDatum, relativeTage } from "@/lib/format";

// Überwachung des Claude-API-Guthabens (Blog-Agent, kein Auto-Reload).
// Zeigt das geschätzte Restguthaben groß und IMMER als "geschätzt" gelabelt.
export function ClaudeGuthaben({
  dienst,
  onSpeichern,
  onAbrufen,
}: {
  dienst: Dienst;
  onSpeichern: (patch: Record<string, unknown>) => Promise<void>;
  onAbrufen: () => Promise<LiveInfo | null>;
}) {
  const c = dienst.claude;
  const [basis, setBasis] = useState(c?.guthabenBasisUsd?.toString() ?? "");
  const [datum, setDatum] = useState(c?.guthabenBasisDatum ?? "");
  const [schwelle, setSchwelle] = useState(c?.schwelleUsd?.toString() ?? "");
  const [verbrauchManuell, setVerbrauchManuell] = useState("");
  const [meldung, setMeldung] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  if (!c) return null;

  const rest = c.restguthabenGeschaetztUsd;
  // Wie frisch ist der Verbrauchswert? Bestimmt das Label unter der Zahl.
  const verbrauchLabel =
    dienst.abrufStatus === "fehlgeschlagen"
      ? "Live-Abruf fehlgeschlagen — Wert nicht bestätigt"
      : dienst.herkunft === "live" && dienst.letzterAbruf
        ? `live · aktualisiert ${relativeTage(dienst.letzterAbruf)}`
        : "manuell eingetragen";

  async function speichern() {
    setMeldung(null);
    await onSpeichern({
      guthabenBasisUsd: basis === "" ? null : Number(basis),
      guthabenBasisDatum: datum === "" ? null : datum,
      schwelleUsd: schwelle === "" ? null : Number(schwelle),
      ...(verbrauchManuell !== "" ? { verbrauchManuellUsd: Number(verbrauchManuell) } : {}),
    });
    setVerbrauchManuell("");
    setMeldung("Gespeichert.");
  }

  async function abrufen() {
    setMeldung(null);
    setLaedt(true);
    const info = await onAbrufen();
    setLaedt(false);
    if (!info) return;
    if (info.keinKey) {
      setMeldung(
        "Kein Admin-Key hinterlegt — Live-Abruf nicht aktiv. Trage den Verbrauch unten manuell ein oder hinterlege ANTHROPIC_ADMIN_KEY in .env.local.",
      );
    } else if (!info.ok) {
      setMeldung(`Live-Abruf fehlgeschlagen: ${info.fehler ?? "unbekannter Fehler"}.`);
    } else {
      setMeldung("Verbrauch live aktualisiert.");
    }
  }

  return (
    <section className="panel claude" aria-label="Claude-API-Guthaben">
      <div className="claude__kopf">
        <h2 className="abschnitt__titel" style={{ margin: 0 }}>
          Claude-API-Guthaben <span className="claude__sub">Blog-Agent · kein Auto-Reload</span>
        </h2>
        <button type="button" className="btn btn--klein" onClick={abrufen} disabled={laedt}>
          {laedt ? "Rufe ab …" : "Verbrauch live abrufen"}
        </button>
      </div>

      <div className="claude__zahlen">
        <div className="claude__rest">
          <span className="eyebrow">Restguthaben (geschätzt)</span>
          <span className="claude__restzahl">
            {rest == null ? "—" : formatBetrag(rest, "USD")}
          </span>
          <span className="claude__geschaetzt">geschätzt: Basis − Verbrauch, kein exakter Kontostand</span>
        </div>

        <dl className="claude__details">
          <div>
            <dt>Guthaben-Basis</dt>
            <dd>
              {c.guthabenBasisUsd == null ? (
                <span className="leer">nicht gesetzt</span>
              ) : (
                <>
                  {formatBetrag(c.guthabenBasisUsd, "USD")}
                  {c.guthabenBasisDatum && (
                    <span className="claude__stand"> · Stand {formatDatum(c.guthabenBasisDatum)}</span>
                  )}
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>Verbrauch seit Basis</dt>
            <dd>
              {c.verbrauchSeitBasisUsd == null ? (
                <span className="leer">—</span>
              ) : (
                formatBetrag(c.verbrauchSeitBasisUsd, "USD")
              )}
              <span className="claude__stand"> · {verbrauchLabel}</span>
            </dd>
          </div>
          <div>
            <dt>Warnschwelle</dt>
            <dd>{c.schwelleUsd == null ? <span className="leer">nicht gesetzt</span> : formatBetrag(c.schwelleUsd, "USD")}</dd>
          </div>
        </dl>
      </div>

      <form
        className="claude__formular"
        onSubmit={(e) => {
          e.preventDefault();
          void speichern();
        }}
      >
        <label>
          Basis-Guthaben (USD)
          <input type="number" step="0.01" min="0" inputMode="decimal" value={basis} onChange={(e) => setBasis(e.target.value)} placeholder="z.B. 100" />
        </label>
        <label>
          Basis-Datum
          <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </label>
        <label>
          Warnschwelle (USD)
          <input type="number" step="0.01" min="0" inputMode="decimal" value={schwelle} onChange={(e) => setSchwelle(e.target.value)} placeholder="z.B. 20" />
        </label>
        <label>
          Verbrauch manuell (USD) <span style={{ color: "var(--ink-faint)" }}>(Fallback)</span>
          <input type="number" step="0.01" min="0" inputMode="decimal" value={verbrauchManuell} onChange={(e) => setVerbrauchManuell(e.target.value)} placeholder="nur ohne Live-Abruf" />
        </label>
        <div className="claude__aktionen">
          <button type="submit" className="btn btn--primaer btn--klein">
            Speichern
          </button>
          {meldung && <span className="claude__meldung">{meldung}</span>}
        </div>
      </form>
    </section>
  );
}
