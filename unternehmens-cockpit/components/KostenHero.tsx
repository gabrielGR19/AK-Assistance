"use client";

import { useState } from "react";
import type { KostenErgebnis } from "@/lib/costs";
import type { Meta } from "@/lib/types";
import { formatEur, formatDatum } from "@/lib/format";

// Das visuelle Zentrum: Monats- und Jahressumme als große Mono-Anzeige.
// Der EUR/USD-Kurs wird hier inline gepflegt (nötig, um USD-Posten umzurechnen).
export function KostenHero({
  kosten,
  meta,
  onKursSpeichern,
}: {
  kosten: KostenErgebnis;
  meta: Meta;
  onKursSpeichern: (kurs: number) => void;
}) {
  const [kursEingabe, setKursEingabe] = useState(meta.eurUsdKurs?.toString() ?? "");

  const alleErfasst = !kosten.unvollstaendig && !kosten.kursFehlt;

  return (
    <section className="panel hero" aria-label="Gesamtkosten">
      <div className="hero__block hero__block--primaer">
        <div className="hero__label">
          <span className="eyebrow">Kosten / Monat</span>
        </div>
        <div className="hero__zahl">{formatEur(kosten.monatEur)}</div>
      </div>

      <div className="hero__block hero__block--sekundaer">
        <div className="hero__label">
          <span className="eyebrow">Kosten / Jahr</span>
        </div>
        <div className="hero__zahl">{formatEur(kosten.jahrEur)}</div>
      </div>

      <div className="hero__fuss">
        {kosten.unvollstaendig && (
          <span className="hinweis hinweis--warn">
            <span className="hinweis__marke" aria-hidden="true" />
            Nicht alle Dienste haben einen Betrag — Summe unvollständig.
          </span>
        )}
        {kosten.kursFehlt && (
          <span className="hinweis hinweis--warn">
            <span className="hinweis__marke" aria-hidden="true" />
            USD-Posten ohne Wechselkurs — nicht in EUR summiert.
          </span>
        )}
        {alleErfasst && (
          <span className="hinweis" style={{ color: "var(--led-ok)" }}>
            <span className="hinweis__marke" aria-hidden="true" />
            Alle Dienste erfasst.
          </span>
        )}

        <span className="kurs">
          <label htmlFor="kurs" style={{ margin: 0 }}>
            1&nbsp;USD&nbsp;=
          </label>
          <input
            id="kurs"
            className="kurs__eingabe"
            type="number"
            step="0.0001"
            min="0"
            inputMode="decimal"
            placeholder="EUR"
            value={kursEingabe}
            onChange={(e) => setKursEingabe(e.target.value)}
            style={{ margin: 0 }}
          />
          <button
            type="button"
            className="btn btn--klein"
            onClick={() => {
              const k = Number(kursEingabe);
              if (Number.isFinite(k) && k > 0) onKursSpeichern(k);
            }}
          >
            Kurs speichern
          </button>
          {meta.kursStand && (
            <span className="eyebrow" title="Stand der letzten Kurs-Pflege">
              Stand {formatDatum(meta.kursStand)}
            </span>
          )}
        </span>
      </div>
    </section>
  );
}
