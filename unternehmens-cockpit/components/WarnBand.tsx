import type { Warnung } from "@/lib/checks";

// Kompaktes Warnband: eine ruhige Zeile, die zusammenfasst statt zu drängen.
// Details klappen erst auf Klick auf — die Startseite bleibt aufgeräumt.
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
  const kritisch = warnungen.some((w) => w.schwere === "hoch");
  const zusammenfassung = warnungen.map((w) => w.titel).join(" · ");

  return (
    <details className={`warnband${kritisch ? " warnband--kritisch" : ""}`}>
      <summary className="warnband__kopf">
        <span className="warnband__leuchte" aria-hidden="true" />
        <span className="warnband__titel">
          {anzahl} Warnung{anzahl === 1 ? "" : "en"}
        </span>
        <span className="warnband__zusammenfassung">{zusammenfassung}</span>
        <span className="warnband__pfeil">Details</span>
      </summary>
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
    </details>
  );
}
