// Einlesen einer Kalender-Sicherung.
//
// Zwei Formate müssen hier durch:
//   - der alte Prototyp (planung/arbeitskalender.html): kein `besitzer`, `reflexionen` als
//     flache Datumstabelle, `pensumSoll` als einzelne Zahl
//   - ein Export aus diesem Cockpit: beide Personen enthalten
//
// In beiden Fällen gilt dieselbe Regel: übernommen wird ausschließlich, was der
// importierenden Person gehört. Ein Import darf niemals die Einträge des anderen
// überschreiben — sonst genügt eine falsche Datei, um dessen Kalender zu leeren.
import type { Ganztags, PersonId, Reflexion, Serie, Termin, Vorlage } from "./kalender-typen.ts";
import { istPerson } from "./kalender-typen.ts";
import type { Pruefung } from "./kalender-termine.ts";
import { baueTermin, istEchtesDatum, validiereTermin } from "./kalender-termine.ts";
import { validiereSerie } from "./kalender-serien.ts";
import { baueVorlage, validiereVorlage } from "./kalender-vorlagen.ts";
import { validierePensum, validiereReflexion } from "./kalender-tagesstand.ts";

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const MAX_EINTRAEGE = 5000;

export interface ImportErgebnis {
  termine: Termin[];
  serien: Serie[];
  ganztags: Ganztags[];
  vorlagen: Vorlage[];
  reflexionen: Record<string, Reflexion>;
  // null = die Datei enthielt kein brauchbares Pensum, das bestehende bleibt stehen.
  pensumSoll: number | null;
  // Wie viele Einträge unbrauchbar waren. Ein Import bricht daran nicht ab, aber der
  // Nutzer erfährt es — stilles Verschlucken wäre schlimmer als eine Zahl.
  uebersprungen: number;
}

function liste(wert: unknown): unknown[] {
  return Array.isArray(wert) ? wert.slice(0, MAX_EINTRAEGE) : [];
}

function neueId(praefix: string): string {
  return praefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function leseGanztags(roh: unknown, besitzer: PersonId): Ganztags | null {
  if (!roh || typeof roh !== "object") return null;
  const g = roh as Record<string, unknown>;
  const titel = typeof g.titel === "string" ? g.titel.trim() : "";
  if (!titel) return null;
  if (typeof g.von !== "string" || !DATUM.test(g.von) || !istEchtesDatum(g.von)) return null;
  if (typeof g.bis !== "string" || !DATUM.test(g.bis) || !istEchtesDatum(g.bis)) return null;
  if (g.bis < g.von) return null;
  return {
    id: neueId("g"),
    besitzer,
    titel,
    notiz: typeof g.notiz === "string" ? g.notiz : "",
    von: g.von,
    bis: g.bis,
  };
}

// Reflexionen liegen im Prototyp flach ("2026-07-27": {...}), im Cockpit-Export je Person.
function leseReflexionen(roh: unknown, person: PersonId): { werte: Record<string, Reflexion>; uebersprungen: number } {
  if (!roh || typeof roh !== "object") return { werte: {}, uebersprungen: 0 };
  const tabelle = roh as Record<string, unknown>;
  const quelle = istPerson(person) && tabelle[person] && typeof tabelle[person] === "object" ? tabelle[person] : tabelle;

  const werte: Record<string, Reflexion> = {};
  let uebersprungen = 0;
  for (const [datum, eintrag] of Object.entries(quelle as Record<string, unknown>)) {
    // Die Personenschlüssel eines Cockpit-Exports sind keine Tage.
    if (!DATUM.test(datum)) continue;
    const e = (eintrag ?? {}) as Record<string, unknown>;
    const geprueft = validiereReflexion({ datum, ab: e.ab === true, notiz: typeof e.notiz === "string" ? e.notiz : "" });
    if (!geprueft.ok) {
      uebersprungen += 1;
      continue;
    }
    if (geprueft.wert.ab || geprueft.wert.notiz) {
      werte[datum] = { ab: geprueft.wert.ab, notiz: geprueft.wert.notiz };
    }
  }
  return { werte, uebersprungen };
}

function lesePensum(roh: unknown, person: PersonId): number | null {
  const wert = roh && typeof roh === "object" ? (roh as Record<string, unknown>)[person] : roh;
  const geprueft = validierePensum({ minuten: wert });
  return geprueft.ok ? geprueft.wert : null;
}

/**
 * Liest eine Sicherungsdatei und gibt zurück, was für `person` übernommen werden soll.
 * Einträge, die zu einer anderen Person gehören, werden übersprungen — nicht umgeschrieben.
 */
export function leseImport(roh: unknown, person: PersonId): Pruefung<ImportErgebnis> {
  if (!roh || typeof roh !== "object" || Array.isArray(roh)) {
    return { ok: false, fehler: "Die Datei enthält keinen lesbaren Kalender." };
  }
  const d = roh as Record<string, unknown>;
  if (!Array.isArray(d.termine) && !Array.isArray(d.ganztags) && !d.reflexionen) {
    return { ok: false, fehler: "Die Datei sieht nicht wie ein Kalender-Export aus." };
  }

  let uebersprungen = 0;
  const gehoertMir = (e: unknown) => {
    const b = (e as Record<string, unknown>)?.besitzer;
    // Kein Besitzer = Prototyp-Datei, die gehört der importierenden Person.
    return b === undefined || b === person;
  };

  const termine: Termin[] = [];
  for (const roheZeile of liste(d.termine)) {
    if (!gehoertMir(roheZeile)) continue;
    const geprueft = validiereTermin(roheZeile);
    if (!geprueft.ok) {
      uebersprungen += 1;
      continue;
    }
    termine.push(baueTermin(geprueft.wert, person));
  }

  const serien: Serie[] = [];
  for (const roheZeile of liste(d.serien)) {
    if (!gehoertMir(roheZeile)) continue;
    // id und Besitzer setzt der Server, nicht die Datei.
    const geprueft = validiereSerie({ ...(roheZeile as object), id: neueId("s"), besitzer: person });
    if (!geprueft.ok) {
      uebersprungen += 1;
      continue;
    }
    serien.push(geprueft.wert);
  }

  const ganztags: Ganztags[] = [];
  for (const roheZeile of liste(d.ganztags)) {
    if (!gehoertMir(roheZeile)) continue;
    const eintrag = leseGanztags(roheZeile, person);
    if (!eintrag) {
      uebersprungen += 1;
      continue;
    }
    ganztags.push(eintrag);
  }

  const vorlagen: Vorlage[] = [];
  for (const roheZeile of liste(d.vorlagen)) {
    if (!gehoertMir(roheZeile)) continue;
    const geprueft = validiereVorlage(roheZeile);
    if (!geprueft.ok) {
      uebersprungen += 1;
      continue;
    }
    vorlagen.push(baueVorlage(geprueft.wert, person));
  }

  const reflexionen = leseReflexionen(d.reflexionen, person);

  return {
    ok: true,
    wert: {
      termine,
      serien,
      ganztags,
      vorlagen,
      reflexionen: reflexionen.werte,
      pensumSoll: lesePensum(d.pensumSoll, person),
      uebersprungen: uebersprungen + reflexionen.uebersprungen,
    },
  };
}
