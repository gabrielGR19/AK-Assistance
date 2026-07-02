import type { Dienst } from "@/lib/types";
import { herkunftAnzeige } from "@/lib/herkunft";

// Kleiner Badge unter dem Dienstnamen: zeigt Herkunft und Frische des Werts.
// "bitte prüfen" erscheint separat und auffälliger, wenn ein manueller Wert veraltet ist.
export function HerkunftBadge({ dienst, jetzt }: { dienst: Dienst; jetzt?: Date }) {
  const a = herkunftAnzeige(dienst, jetzt);
  return (
    <span className="herkunft" title={a.titel}>
      <span className={`herkunft__punkt herkunft__punkt--${a.ton}`} aria-hidden="true" />
      <span className={`herkunft__text herkunft__text--${a.ton}`}>{a.text}</span>
      {a.pruefen && <span className="herkunft__pruefen">bitte prüfen</span>}
    </span>
  );
}
