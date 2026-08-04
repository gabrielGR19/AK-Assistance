"use client";

import { useMemo } from "react";
import { PERSONEN } from "@/lib/kalender-typen";
import { labelAus, labelKarte } from "@/lib/kalender-labels";
import type { KalenderDaten } from "./KalenderAnsicht";
import { WOCHENTAG, iso, montagVon, plusTage } from "./datum";
import s from "./kalender.module.css";

interface Props {
  anker: Date;
  daten: KalenderDaten;
  onTagWaehlen: (tag: Date) => void;
}

function kuerzel(besitzer: string): string {
  const name = PERSONEN[besitzer as keyof typeof PERSONEN]?.name ?? besitzer;
  return name.charAt(0).toUpperCase();
}

// Monatsansicht: 6-Wochen-Raster (42 Zellen), bis zu 4 Termine pro Zelle, Rest als
// "n weitere". Ein Klick auf eine Zelle springt in die Tagesansicht — nichts wird angelegt.
export function MonatsAnsicht({ anker, daten, onTagWaehlen }: Props) {
  const karte = useMemo(() => labelKarte(daten.labels), [daten.labels]);
  const erster = new Date(anker.getFullYear(), anker.getMonth(), 1);
  const start = montagVon(erster);
  const heuteIso = iso(new Date());
  const zellen = Array.from({ length: 42 }, (_, i) => plusTage(start, i));

  return (
    <div className={s.monat}>
      <div className={s.mWochentage}>
        {WOCHENTAG.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className={s.mGrid}>
        {zellen.map((d) => {
          const k = iso(d);
          const fremdMonat = d.getMonth() !== anker.getMonth();
          const heute = k === heuteIso;
          const ganztags = daten.ganztags.filter((g) => k >= g.von && k <= g.bis);
          const termine = daten.termine.filter((t) => t.start.slice(0, 10) === k);

          return (
            <div
              key={k}
              className={`${s.mZelle}${fremdMonat ? " " + s.mZelleFremd : ""}${heute ? " " + s.mZelleHeute : ""}`}
              onClick={() => onTagWaehlen(d)}
            >
              <div className={s.mKopf}>
                <span className={s.mNr}>
                  {d.getDate()}
                  {d.getDate() === 1 ? `. ${["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"][d.getMonth()]}` : ""}
                </span>
              </div>
              {ganztags.map((e) => (
                <div key={e.id} className={`${s.mGanztags}${e.besitzer !== daten.ich ? " " + s.fremd : ""}`} title={e.notiz || e.titel}>
                  {e.besitzer !== daten.ich ? `[${kuerzel(e.besitzer)}] ` : ""}
                  {e.titel}
                </div>
              ))}
              {termine.slice(0, 4).map((t) => {
                const L = labelAus(karte, t.label);
                const fremd = t.besitzer !== daten.ich;
                return (
                  <div key={t.id} className={`${s.mTermin}${fremd ? " " + s.fremd : ""}`}>
                    <i className={s.mPunkt} style={{ background: L.farbe }} />
                    <span>
                      {fremd ? `[${kuerzel(t.besitzer)}] ` : ""}
                      {t.titel}
                    </span>
                  </div>
                );
              })}
              {termine.length > 4 && <div className={s.mMehr}>{termine.length - 4} weitere</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
