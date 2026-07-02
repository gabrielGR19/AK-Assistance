import type { Warnung } from "@/lib/checks";

// Warnband ganz oben — die "Warnleuchte". Ohne Warnungen ein ruhiger grüner Zustand.
export function WarnBand({ warnungen }: { warnungen: Warnung[] }) {
  if (warnungen.length === 0) {
    return (
      <section className="warnband warnband--ruhig" aria-label="Warnungen">
        <div className="warnband__kopf">
          <span className="warnband__leuchte" aria-hidden="true" />
          <span className="warnband__titel">Alles im grünen Bereich</span>
        </div>
      </section>
    );
  }

  const anzahl = warnungen.length;
  return (
    <section className="warnband" aria-label="Warnungen">
      <div className="warnband__kopf">
        <span className="warnband__leuchte" aria-hidden="true" />
        <span className="warnband__titel">
          {anzahl} Warnung{anzahl === 1 ? "" : "en"}
        </span>
      </div>
      <ul className="warnliste">
        {warnungen.map((w, i) => (
          <li key={`${w.dienstId}-${i}`} className="warnzeile">
            <span className={`warnzeile__marke warnzeile__marke--${w.schwere}`} aria-hidden="true" />
            <div>
              <div className="warnzeile__titel">{w.titel}</div>
              <div className="warnzeile__detail">{w.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
