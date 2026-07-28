"use client";

import type { Reflexion } from "@/lib/kalender-typen";
import { ausIso, iso, plusTage } from "./datum";
import { MINIZIEL_BIS, MINIZIEL_FERTIG, MINIZIEL_LABEL, MINIZIEL_SATZ, MINIZIEL_VON } from "./ziele";
import s from "./kalender.module.css";

// Punktleiste bis zur Abreise: ein Punkt je Tag, gefüllt sobald der Tag abgeschlossen ist.
// Nach dem Enddatum verschwindet die Leiste von selbst — ein abgelaufenes Miniziel soll
// nicht als Mahnmal stehenbleiben.
export function Miniziel({ reflexionen }: { reflexionen: Record<string, Reflexion> }) {
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  const bis = ausIso(MINIZIEL_BIS);
  if (heute > bis) return null;

  const tage: string[] = [];
  for (let d = ausIso(MINIZIEL_VON); d <= bis; d = plusTage(d, 1)) tage.push(iso(d));

  const heuteIso = iso(heute);
  const fertig = tage.filter((t) => reflexionen[t]?.ab).length;
  const alle = fertig === tage.length;

  return (
    <div className={s.miniziel}>
      <span className={s.mzLabel}>{MINIZIEL_LABEL}</span>
      <span className={s.mzPunkte}>
        {tage.map((t) => (
          <i
            key={t}
            className={`${reflexionen[t]?.ab ? s.mzVoll : ""}${t === heuteIso ? " " + s.mzHeute : ""}`}
            title={t}
          />
        ))}
      </span>
      <span className={s.mzZahl}>
        {fertig} / {tage.length} durchgezogen
      </span>
      {alle ? <span className={s.mzFertig}>{MINIZIEL_FERTIG}</span> : <span className={s.mzSatz}>{MINIZIEL_SATZ}</span>}
    </div>
  );
}
