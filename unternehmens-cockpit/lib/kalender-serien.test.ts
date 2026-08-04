import { test } from "node:test";
import assert from "node:assert/strict";
import { expandiereSerien, validiereSerie } from "./kalender-serien.ts";
import type { Serie } from "./kalender-typen.ts";
import { STANDARD_LABEL_IDS } from "./kalender-labels.ts";

// Baut eine gültige Basis-Serie, einzelne Felder werden pro Test überschrieben.
function serie(teil: Partial<Serie> = {}): Serie {
  return {
    id: "s1",
    besitzer: "gabriel",
    titel: "Test-Serie",
    label: "programmieren",
    notiz: "",
    wiederholung: { art: "taeglich" },
    startDatum: "2027-01-01",
    endDatum: null,
    startZeit: "11:00",
    endeZeit: "12:00",
    ausnahmen: [],
    ...teil,
  };
}

test("taegliche Regel ueber einen ganzen Monat", () => {
  const s = serie({ startDatum: "2027-02-01" });
  const t = expandiereSerien([s], "2027-02-01", "2027-02-28");
  assert.equal(t.length, 28);
  assert.equal(t[0].start, "2027-02-01T11:00");
  assert.equal(t[t.length - 1].start, "2027-02-28T11:00");
});

test("Wochentagsregel Di+Mi ueber drei Wochen", () => {
  // 2027-03-01 ist ein Montag
  const s = serie({ wiederholung: { art: "wochentage", tage: [2, 3] }, startDatum: "2027-03-01" });
  const t = expandiereSerien([s], "2027-03-01", "2027-03-21");
  assert.equal(t.length, 6);
  for (const termin of t) {
    // JS Date.getDay(): 0=So, 1=Mo, 2=Di, 3=Mi ...
    const tag = new Date(termin.start.slice(0, 10) + "T00:00:00").getDay();
    assert.ok(tag === 2 || tag === 3);
  }
});

test("Regel mit endDatum endet dort", () => {
  const s = serie({ startDatum: "2027-04-01", endDatum: "2027-04-05" });
  const t = expandiereSerien([s], "2027-04-01", "2027-04-30");
  assert.equal(t.length, 5);
  assert.equal(t[t.length - 1].start, "2027-04-05T11:00");
});

test("Ausnahme-Datum fehlt, Nachbartage bleiben", () => {
  const s = serie({ startDatum: "2027-05-01", ausnahmen: ["2027-05-02"] });
  const t = expandiereSerien([s], "2027-05-01", "2027-05-03");
  assert.equal(t.length, 2);
  assert.deepEqual(
    t.map((x) => x.start.slice(0, 10)),
    ["2027-05-01", "2027-05-03"],
  );
});

test("Zeitraum ueber Monatswechsel ohne Luecke oder Sprung", () => {
  const s = serie({ startDatum: "2027-01-01" });
  const t = expandiereSerien([s], "2027-02-28", "2027-03-02");
  assert.deepEqual(
    t.map((x) => x.start.slice(0, 10)),
    ["2027-02-28", "2027-03-01", "2027-03-02"],
  );
});

test("Sommerzeit: Beginn (29.03.2026) - taeglicher Termin bleibt bei 11:00", () => {
  const s = serie({ startDatum: "2026-03-25" });
  const t = expandiereSerien([s], "2026-03-25", "2026-03-31");
  assert.equal(t.length, 7);
  for (const termin of t) {
    assert.ok(termin.start.endsWith("T11:00"), termin.start);
  }
  const tag = t.find((x) => x.start.startsWith("2026-03-29"));
  assert.ok(tag);
});

test("Sommerzeit: Ende (25.10.2026) - taeglicher Termin bleibt bei 11:00", () => {
  const s = serie({ startDatum: "2026-10-22" });
  const t = expandiereSerien([s], "2026-10-22", "2026-10-28");
  assert.equal(t.length, 7);
  for (const termin of t) {
    assert.ok(termin.start.endsWith("T11:00"), termin.start);
  }
  const tag = t.find((x) => x.start.startsWith("2026-10-25"));
  assert.ok(tag);
});

test("Anfrage-Zeitraum komplett vor startDatum ergibt leeres Ergebnis", () => {
  const s = serie({ startDatum: "2027-06-01" });
  const t = expandiereSerien([s], "2027-05-01", "2027-05-31");
  assert.deepEqual(t, []);
});

test("validiereSerie weist fehlenden Titel ab", () => {
  const r = validiereSerie({ ...serie(), titel: "" }, STANDARD_LABEL_IDS);
  assert.equal(r.ok, false);
});

test("validiereSerie weist unbekanntes Label ab", () => {
  const r = validiereSerie({ ...serie(), label: "unbekannt" }, STANDARD_LABEL_IDS);
  assert.equal(r.ok, false);
});

test("validiereSerie weist endeZeit vor startZeit ab", () => {
  const r = validiereSerie({ ...serie(), startZeit: "12:00", endeZeit: "11:00" }, STANDARD_LABEL_IDS);
  assert.equal(r.ok, false);
});

test("validiereSerie weist leere Wochentagsliste ab", () => {
  const r = validiereSerie({ ...serie(), wiederholung: { art: "wochentage", tage: [] } }, STANDARD_LABEL_IDS);
  assert.equal(r.ok, false);
});

test("validiereSerie akzeptiert gueltige Serie", () => {
  const r = validiereSerie(serie(), STANDARD_LABEL_IDS);
  assert.equal(r.ok, true);
});

test("validiereSerie reicht keine unbekannten Fremdfelder durch", () => {
  // Das Ergebnis wird aus den geprueften Feldern neu aufgebaut. Wuerde stattdessen das
  // Roh-Objekt durchgereicht, landete beliebiger Fremdinhalt in data/kalender.json.
  const r = validiereSerie({ ...serie(), schadhaft: { tief: true }, admin: true }, STANDARD_LABEL_IDS);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(
    Object.keys(r.wert).sort(),
    ["ausnahmen", "besitzer", "endDatum", "endeZeit", "id", "label", "notiz", "startDatum", "startZeit", "titel", "wiederholung"],
  );
});
