"use client";

import { useMemo, useState } from "react";
import type { Dienst } from "@/lib/types";
import type { DienstKosten } from "@/lib/costs";
import { StatusLed } from "./StatusLed";
import { HerkunftBadge } from "./HerkunftBadge";
import { formatBetrag, formatEur, formatDatum } from "@/lib/format";

const MODELL_LABEL: Record<Dienst["abrechnungsmodell"], string> = {
  monatlich: "monatlich",
  jaehrlich: "jährlich",
  verbrauch: "Verbrauch",
};

// Dienste-Tabelle mit Kategorie-Filter, Status-LED und EUR-Monatswert je Dienst.
export function DienstTabelle({
  dienste,
  kostenIndex,
  onBearbeiten,
  onLoeschen,
}: {
  dienste: Dienst[];
  kostenIndex: Map<string, DienstKosten>;
  onBearbeiten: (d: Dienst) => void;
  onLoeschen: (id: string) => void;
}) {
  const [kategorie, setKategorie] = useState<string>("alle");
  const [loescheId, setLoescheId] = useState<string | null>(null);

  const kategorien = useMemo(() => {
    const set = new Set(dienste.map((d) => d.kategorie));
    return ["alle", ...Array.from(set).sort((a, b) => a.localeCompare(b, "de"))];
  }, [dienste]);

  const sichtbar = kategorie === "alle" ? dienste : dienste.filter((d) => d.kategorie === kategorie);

  return (
    <section className="abschnitt" aria-label="Dienste">
      <div className="abschnitt__kopf">
        <h2 className="abschnitt__titel">Dienste &amp; Accounts</h2>
        <div className="filter" role="group" aria-label="Nach Kategorie filtern">
          {kategorien.map((k) => (
            <button
              key={k}
              className={`chip ${kategorie === k ? "chip--aktiv" : ""}`}
              onClick={() => setKategorie(k)}
            >
              {k === "alle" ? "Alle" : k}
            </button>
          ))}
        </div>
      </div>

      <div className="tabelle-wrap">
        <table className="tabelle">
          <thead>
            <tr>
              <th>Dienst</th>
              <th>Kategorie</th>
              <th>Abrechnung</th>
              <th style={{ textAlign: "right" }}>Betrag</th>
              <th style={{ textAlign: "right" }}>≈ / Monat</th>
              <th>Status</th>
              <th>Fällig</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sichtbar.map((d) => {
              const k = kostenIndex.get(d.id);
              return (
                <tr key={d.id}>
                  <td>
                    <div className="dienst-name">{d.name}</div>
                    {d.inhaber && <div className="dienst-inhaber">{d.inhaber}</div>}
                    <HerkunftBadge dienst={d} />
                  </td>
                  <td>{d.kategorie}</td>
                  <td>
                    <span className="modell">{MODELL_LABEL[d.abrechnungsmodell]}</span>
                  </td>
                  <td className="zahl-zelle">
                    {d.betrag === null ? (
                      <span className="leer">—</span>
                    ) : (
                      formatBetrag(d.betrag, d.waehrung)
                    )}
                  </td>
                  <td className="zahl-zelle">
                    {k && k.monatEur !== null ? (
                      <span title={k.umgerechnet ? "aus USD umgerechnet" : undefined}>
                        {formatEur(k.monatEur)}
                        {k.umgerechnet && <span style={{ color: "var(--ink-faint)" }}> *</span>}
                      </span>
                    ) : (
                      <span className="leer">—</span>
                    )}
                  </td>
                  <td>
                    <StatusLed status={d.statusAmpel} />
                  </td>
                  <td className="mono" style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                    {d.naechsteFaelligkeit ? formatDatum(d.naechsteFaelligkeit) : <span className="leer">—</span>}
                  </td>
                  <td>
                    <div className="zeilen-aktionen">
                      <button className="btn btn--klein" onClick={() => onBearbeiten(d)}>
                        Bearbeiten
                      </button>
                      {loescheId === d.id ? (
                        <>
                          <button
                            className="btn btn--klein btn--gefahr"
                            onClick={() => {
                              onLoeschen(d.id);
                              setLoescheId(null);
                            }}
                          >
                            Wirklich löschen
                          </button>
                          <button className="btn btn--klein btn--verlinkt" onClick={() => setLoescheId(null)}>
                            Abbrechen
                          </button>
                        </>
                      ) : (
                        <button className="btn btn--klein btn--verlinkt" onClick={() => setLoescheId(d.id)}>
                          Löschen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sichtbar.some((d) => kostenIndex.get(d.id)?.umgerechnet) && (
        <p className="eyebrow" style={{ marginTop: 10 }}>
          * aus USD zum gepflegten Kurs umgerechnet
        </p>
      )}
    </section>
  );
}
