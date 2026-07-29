"use client";

import { useEffect, useState } from "react";
import type { Reflexion } from "@/lib/kalender-typen";
import { iso } from "./datum";
import s from "./kalender.module.css";

interface Props {
  tage: Date[];
  // Eigene Tagesabschlüsse — fremde werden hier bewusst nicht angezeigt: die Zeile ist
  // Gabriels bzw. Moritz' eigener Rückblick, kein gegenseitiges Kontrollfeld.
  reflexionen: Record<string, Reflexion>;
  // Muss zur Rasterbreite passen, sonst stehen die Zellen nicht unter den Tagesspalten.
  spalten: string;
  beiAenderung: (datum: string, ab: boolean, notiz: string) => void;
}

const LEER: Reflexion = { ab: false, notiz: "" };

export function Reflexionszeile({ tage, reflexionen, spalten, beiAenderung }: Props) {
  // Der Server ist die Quelle der Wahrheit, das Tippen im Notizfeld aber nicht: solange
  // jemand schreibt, gilt der lokale Text. Sonst würde der 8-Sekunden-Poll die halb
  // getippte Notiz zurücksetzen.
  const [entwurf, setEntwurf] = useState<Record<string, string>>({});

  // Sichtbaren Zeitraum wechseln heißt: die Entwürfe der alten Woche sind erledigt.
  useEffect(() => {
    setEntwurf({});
  }, [spalten, tage[0]?.getTime()]);

  return (
    <div className={s.reflexion} style={{ gridTemplateColumns: spalten }}>
      <div className={s.rfLabel}>
        Tages-
        <br />
        abschluss
      </div>
      {tage.map((d) => {
        const tagIso = iso(d);
        const r = reflexionen[tagIso] ?? LEER;
        const text = entwurf[tagIso] ?? r.notiz;
        return (
          <div key={tagIso} className={s.rfZelle}>
            <label className={`${s.rfCheck}${r.ab ? " " + s.rfCheckAb : ""}`}>
              <input
                type="checkbox"
                checked={r.ab}
                onChange={(e) => beiAenderung(tagIso, e.target.checked, text)}
              />
              <span>Tag durchgezogen</span>
            </label>
            <input
              className={s.rfNotiz}
              type="text"
              value={text}
              placeholder="Was lief, was nicht?"
              aria-label={`Notiz zum ${tagIso}`}
              onChange={(e) => setEntwurf((alt) => ({ ...alt, [tagIso]: e.target.value }))}
              // Erst beim Verlassen speichern — nicht bei jedem Tastenanschlag eine Anfrage.
              onBlur={() => {
                const neu = entwurf[tagIso];
                if (neu === undefined || neu === r.notiz) return;
                beiAenderung(tagIso, r.ab, neu);
                setEntwurf((alt) => {
                  const rest = { ...alt };
                  delete rest[tagIso];
                  return rest;
                });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
