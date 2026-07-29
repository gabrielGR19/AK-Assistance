// Löst Serienregeln zu konkreten Vorkommen auf (siehe lib/kalender-typen.ts).
//
// Wichtig: Tage werden NIE mit Millisekunden-Arithmetik gezählt. An den
// Zeitumstellungs-Tagen hat ein Tag 23 bzw. 25 Stunden — mit `+ 86400000`
// würde man einen Kalendertag überspringen oder doppelt sehen. Stattdessen
// arbeiten wir mit Date-Feldern (Jahr/Monat/Tag) genau wie der Prototyp
// (../planung/arbeitskalender.html, Funktion plusTage).
import { istLabel, istPerson, vorkommenId, type Serie, type Termin, type Wochentag } from "./kalender-typen.ts";
import { istEchtesDatum } from "./kalender-termine.ts";

function zwei(n: number): string {
  return String(n).padStart(2, "0");
}

// "YYYY-MM-DD" aus lokalen Date-Feldern, nie über toISOString (das würde UTC nutzen).
function iso(d: Date): string {
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

// Parst "YYYY-MM-DD" als lokale Mitternacht.
function ausIsoDatum(s: string): Date {
  const [j, m, t] = s.split("-").map(Number);
  return new Date(j, m - 1, t);
}

// Ein Kalendertag weiter, über Datumsfelder statt Millisekunden.
function plusTage(d: Date, n: number): Date {
  const k = new Date(d);
  k.setDate(k.getDate() + n);
  return k;
}

// JS liefert 0=Sonntag…6=Samstag, unser Typ 1=Montag…7=Sonntag.
function isoWochentag(d: Date): Wochentag {
  return (((d.getDay() + 6) % 7) + 1) as Wochentag;
}

export function expandiereSerien(serien: Serie[], vonDatum: string, bisDatum: string): Termin[] {
  const ergebnis: Termin[] = [];

  for (const serie of serien) {
    // Schnittmenge aus angefragtem Zeitraum und Gültigkeit der Serie (String-Vergleich
    // funktioniert bei "YYYY-MM-DD" wie ein Datumsvergleich).
    const effVon = serie.startDatum > vonDatum ? serie.startDatum : vonDatum;
    const effBis = serie.endDatum && serie.endDatum < bisDatum ? serie.endDatum : bisDatum;
    if (effVon > effBis) continue;

    for (let d = ausIsoDatum(effVon); iso(d) <= effBis; d = plusTage(d, 1)) {
      const datum = iso(d);
      if (serie.ausnahmen.includes(datum)) continue;
      if (serie.wiederholung.art === "wochentage" && !serie.wiederholung.tage.includes(isoWochentag(d))) continue;

      ergebnis.push({
        id: vorkommenId(serie.id, datum),
        besitzer: serie.besitzer,
        titel: serie.titel,
        label: serie.label,
        notiz: serie.notiz,
        start: `${datum}T${serie.startZeit}`,
        ende: `${datum}T${serie.endeZeit}`,
        ausSerie: { serieId: serie.id, datum },
      });
    }
  }

  ergebnis.sort((a, b) => a.start.localeCompare(b.start));
  return ergebnis;
}

const RE_DATUM = /^\d{4}-\d{2}-\d{2}$/;
// Stunde 00–23, Minute 00–59 — siehe die Begründung an ZEITPUNKT in kalender-termine.ts.
const RE_ZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;

// Prüft eine Serie auf Plausibilität, bevor sie gespeichert wird. Bricht beim ersten
// Fehler ab — für die Anzeige im UI reicht eine konkrete Meldung, keine Fehlerliste.
export function validiereSerie(roh: unknown): { ok: true; wert: Serie } | { ok: false; fehler: string } {
  if (typeof roh !== "object" || roh === null) {
    return { ok: false, fehler: "Die Serie ist kein gültiges Objekt." };
  }
  const r = roh as Record<string, unknown>;

  if (typeof r.id !== "string" || r.id.trim() === "") {
    return { ok: false, fehler: "Die Serie hat keine gültige id." };
  }
  if (typeof r.titel !== "string" || r.titel.trim() === "") {
    return { ok: false, fehler: "Der Titel fehlt oder ist leer." };
  }
  if (!istPerson(r.besitzer)) {
    return { ok: false, fehler: "Der Besitzer ist unbekannt." };
  }
  if (!istLabel(r.label)) {
    return { ok: false, fehler: "Das Label ist unbekannt." };
  }
  if (typeof r.notiz !== "string") {
    return { ok: false, fehler: "Die Notiz muss Text sein." };
  }
  // istEchtesDatum zusätzlich zur Regex: sonst wird "2026-02-31" gespeichert und die Serie
  // beginnt an einem Tag, den es nicht gibt.
  if (typeof r.startDatum !== "string" || !RE_DATUM.test(r.startDatum) || !istEchtesDatum(r.startDatum)) {
    return { ok: false, fehler: "Das Startdatum hat nicht das Format JJJJ-MM-TT." };
  }
  if (
    r.endDatum !== null &&
    (typeof r.endDatum !== "string" || !RE_DATUM.test(r.endDatum) || !istEchtesDatum(r.endDatum))
  ) {
    return { ok: false, fehler: "Das Enddatum hat nicht das Format JJJJ-MM-TT." };
  }
  if (typeof r.endDatum === "string" && r.endDatum < r.startDatum) {
    return { ok: false, fehler: "Das Enddatum darf nicht vor dem Startdatum liegen." };
  }
  if (typeof r.startZeit !== "string" || !RE_ZEIT.test(r.startZeit)) {
    return { ok: false, fehler: "Die Startzeit hat nicht das Format HH:MM." };
  }
  if (typeof r.endeZeit !== "string" || !RE_ZEIT.test(r.endeZeit)) {
    return { ok: false, fehler: "Die Endzeit hat nicht das Format HH:MM." };
  }
  if (r.endeZeit <= r.startZeit) {
    return { ok: false, fehler: "Die Endzeit muss nach der Startzeit liegen." };
  }
  if (!Array.isArray(r.ausnahmen) || !r.ausnahmen.every((a) => typeof a === "string" && RE_DATUM.test(a))) {
    return { ok: false, fehler: "Die Ausnahmen müssen eine Liste von Daten im Format JJJJ-MM-TT sein." };
  }

  const w = r.wiederholung as Record<string, unknown> | undefined;
  if (typeof w !== "object" || w === null) {
    return { ok: false, fehler: "Die Wiederholung fehlt oder ist ungültig." };
  }
  if (w.art === "taeglich") {
    // keine weiteren Felder nötig
  } else if (w.art === "wochentage") {
    if (!Array.isArray(w.tage) || w.tage.length === 0) {
      return { ok: false, fehler: "Bei einer Wochentagsregel muss mindestens ein Wochentag ausgewählt sein." };
    }
    if (!w.tage.every((t) => Number.isInteger(t) && (t as number) >= 1 && (t as number) <= 7)) {
      return { ok: false, fehler: "Die Wochentage müssen zwischen 1 und 7 liegen." };
    }
  } else {
    return { ok: false, fehler: "Die Wiederholung muss 'taeglich' oder 'wochentage' sein." };
  }

  // Ergebnis aus den geprüften Feldern NEU aufbauen, statt das Roh-Objekt durchzureichen.
  // Sonst landen unbekannte Zusatzfelder aus der Anfrage ungeprüft in data/kalender.json.
  // Besitzer und id überschreibt die aufrufende Route ohnehin mit den Werten aus der Anmeldung.
  const wiederholung: Serie["wiederholung"] =
    w.art === "taeglich" ? { art: "taeglich" } : { art: "wochentage", tage: (w.tage as Wochentag[]).slice() };

  return {
    ok: true,
    wert: {
      id: r.id,
      besitzer: r.besitzer,
      titel: r.titel.trim(),
      label: r.label,
      notiz: r.notiz,
      wiederholung,
      startDatum: r.startDatum,
      endDatum: typeof r.endDatum === "string" ? r.endDatum : null,
      startZeit: r.startZeit,
      endeZeit: r.endeZeit,
      ausnahmen: (r.ausnahmen as string[]).slice(),
    },
  };
}
