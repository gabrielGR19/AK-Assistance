"use client";

import { useState } from "react";
import { MONATE, iso, montagVon, plusTage } from "./datum";
import s from "./kalender.module.css";

interface Props {
  // Tage, die in der Hauptansicht gerade sichtbar sind — werden hier hervorgehoben.
  sichtbareTage: Date[];
  beiTagWaehlen: (d: Date) => void;
}

// Kleiner Monatskalender in der Seitenleiste. Reine Navigation: eigener Monats-Zustand,
// ein Klick springt in der Hauptansicht auf den Tag.
export function MiniMonat({ sichtbareTage, beiTagWaehlen }: Props) {
  const [monat, setMonat] = useState(() => new Date());

  const erster = new Date(monat.getFullYear(), monat.getMonth(), 1);
  const start = montagVon(erster);
  const heute = iso(new Date());
  const gewaehlt = new Set(sichtbareTage.map(iso));

  return (
    <div className={s.minimonat}>
      <div className={s.mmKopf}>
        <button
          aria-label="Vorheriger Monat"
          onClick={() => setMonat((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
        >
          ‹
        </button>
        <b>
          {MONATE[monat.getMonth()].slice(0, 3)} {monat.getFullYear()}
        </b>
        <button
          aria-label="Nächster Monat"
          onClick={() => setMonat((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
        >
          ›
        </button>
      </div>

      <div className={s.mmGrid}>
        {["M", "D", "M", "D", "F", "S", "S"].map((w, i) => (
          <div key={i}>{w}</div>
        ))}
        {Array.from({ length: 42 }, (_, i) => plusTage(start, i)).map((d) => {
          const k = iso(d);
          const fremd = d.getMonth() !== monat.getMonth();
          const klassen = [
            fremd ? s.mmFremd : "",
            k === heute ? s.mmHeute : gewaehlt.has(k) ? s.mmGewaehlt : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button key={k} className={klassen} onClick={() => beiTagWaehlen(d)}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
