import { test } from "node:test";
import assert from "node:assert/strict";
import { leseImport } from "./kalender-import.ts";
import { STANDARD_LABEL_IDS } from "./kalender-labels.ts";

// So sieht eine Datei aus, die der alte Prototyp exportiert: keine Besitzer, flache
// Reflexionstabelle, Pensum als einzelne Zahl.
const prototypDatei = {
  termine: [
    { id: "t1", titel: "Cold Calls", label: "vertrieb", notiz: "", start: "2026-07-28T09:00", ende: "2026-07-28T10:15" },
    { id: "t2", titel: "Gym", label: "sport", notiz: "", start: "2026-07-28T18:00", ende: "2026-07-28T20:00" },
  ],
  ganztags: [{ id: "g1", titel: "Urlaub", notiz: "", von: "2026-08-07", bis: "2026-08-21" }],
  vorlagen: [{ id: "v1", titel: "Cold Calls (10 Anrufe)", label: "vertrieb", min: 75 }],
  reflexionen: { "2026-07-27": { ab: true, notiz: "lief" }, "2026-07-26": { ab: false, notiz: "" } },
  ausgeblendet: [],
  pensumSoll: 240,
};

test("Prototyp-Datei wird der importierenden Person zugeschrieben", () => {
  const p = leseImport(prototypDatei, "gabriel", STANDARD_LABEL_IDS);
  assert.ok(p.ok);
  assert.equal(p.wert.termine.length, 2);
  assert.ok(p.wert.termine.every((t) => t.besitzer === "gabriel"));
  assert.equal(p.wert.ganztags[0].besitzer, "gabriel");
  assert.equal(p.wert.vorlagen[0].besitzer, "gabriel");
  assert.equal(p.wert.pensumSoll, 240);
  assert.equal(p.wert.uebersprungen, 0);
});

test("leere Reflexionen werden nicht mitgeschleppt", () => {
  const p = leseImport(prototypDatei, "gabriel", STANDARD_LABEL_IDS);
  assert.ok(p.ok);
  assert.ok(p.wert.reflexionen);
  assert.deepEqual(Object.keys(p.wert.reflexionen), ["2026-07-27"]);
});

test("ids aus der Datei werden nicht übernommen", () => {
  const p = leseImport(prototypDatei, "gabriel", STANDARD_LABEL_IDS);
  assert.ok(p.ok);
  assert.ok(p.wert.termine.every((t) => t.id !== "t1" && t.id !== "t2"));
});

test("aus einem Cockpit-Export kommen nur die eigenen Einträge", () => {
  const export_ = {
    termine: [
      { ...prototypDatei.termine[0], besitzer: "gabriel" },
      { ...prototypDatei.termine[1], besitzer: "moritz" },
    ],
    ganztags: [{ ...prototypDatei.ganztags[0], besitzer: "moritz" }],
    vorlagen: [],
    serien: [],
    reflexionen: { gabriel: { "2026-07-27": { ab: true, notiz: "meins" } }, moritz: { "2026-07-27": { ab: true, notiz: "seins" } } },
    pensumSoll: { gabriel: 300, moritz: 180 },
  };
  const p = leseImport(export_, "gabriel", STANDARD_LABEL_IDS);
  assert.ok(p.ok);
  assert.equal(p.wert.termine.length, 1);
  assert.equal(p.wert.termine[0].titel, "Cold Calls");
  assert.equal(p.wert.ganztags.length, 0);
  assert.ok(p.wert.reflexionen);
  assert.equal(p.wert.reflexionen["2026-07-27"].notiz, "meins");
  assert.equal(p.wert.pensumSoll, 300);
});

test("Serien bekommen neue id und den richtigen Besitzer", () => {
  const p = leseImport(
    {
      termine: [],
      serien: [
        {
          id: "alt",
          besitzer: "gabriel",
          titel: "Tagesabschluss",
          label: "claude",
          notiz: "",
          startDatum: "2026-07-27",
          endDatum: null,
          startZeit: "21:00",
          endeZeit: "21:15",
          ausnahmen: [],
          wiederholung: { art: "taeglich" },
        },
      ],
    },
    "gabriel",
    STANDARD_LABEL_IDS,
  );
  assert.ok(p.ok);
  assert.equal(p.wert.serien.length, 1);
  assert.notEqual(p.wert.serien[0].id, "alt");
  assert.equal(p.wert.serien[0].besitzer, "gabriel");
});

test("kaputte Einträge werden übersprungen und gezählt, nicht eingespielt", () => {
  const p = leseImport(
    {
      termine: [
        prototypDatei.termine[0],
        { titel: "Kaputt", label: "gibtsnicht", notiz: "", start: "2026-07-28T09:00", ende: "2026-07-28T10:00" },
        { titel: "Über Mitternacht", label: "lesen", notiz: "", start: "2026-07-28T23:00", ende: "2026-07-29T01:00" },
      ],
      ganztags: [{ titel: "Ohne Datum" }],
    },
    "gabriel",
    STANDARD_LABEL_IDS,
  );
  assert.ok(p.ok);
  assert.equal(p.wert.termine.length, 1);
  assert.equal(p.wert.uebersprungen, 3);
});

test("etwas, das kein Kalender ist, wird abgelehnt", () => {
  assert.ok(!leseImport(null, "gabriel", STANDARD_LABEL_IDS).ok);
  assert.ok(!leseImport("text", "gabriel", STANDARD_LABEL_IDS).ok);
  assert.ok(!leseImport([1, 2, 3], "gabriel", STANDARD_LABEL_IDS).ok);
  assert.ok(!leseImport({ irgendwas: true }, "gabriel", STANDARD_LABEL_IDS).ok);
});

test("unsinniges Pensum lässt das bestehende stehen", () => {
  const p = leseImport({ termine: [], pensumSoll: 99999 }, "gabriel", STANDARD_LABEL_IDS);
  assert.ok(p.ok);
  assert.equal(p.wert.pensumSoll, null);
});

// Regression: Eine Sicherung, die nur Termine enthält, hat die gespeicherten Tagesabschlüsse
// mit einem leeren Objekt überschrieben — damit war die Miniziel-Punktleiste geleert, ohne
// dass die Rückfrage das angekündigt hätte. null heißt jetzt "die Datei sagt dazu nichts".
test("Datei ohne Reflexionsblock lässt die Tagesabschlüsse stehen", () => {
  const p = leseImport({ termine: [prototypDatei.termine[0]] }, "gabriel", STANDARD_LABEL_IDS);
  assert.ok(p.ok);
  assert.equal(p.wert.reflexionen, null);
});

test("Datei mit leerem Reflexionsblock ersetzt die Tagesabschlüsse sehr wohl", () => {
  const p = leseImport({ termine: [], reflexionen: {} }, "gabriel", STANDARD_LABEL_IDS);
  assert.ok(p.ok);
  assert.deepEqual(p.wert.reflexionen, {});
});

test("Serien mit unmöglichem Datum oder unmöglicher Uhrzeit werden abgelehnt", () => {
  const serie = {
    id: "s1",
    besitzer: "gabriel",
    titel: "Test",
    label: "claude",
    notiz: "",
    startDatum: "2026-07-27",
    endDatum: null,
    startZeit: "21:00",
    endeZeit: "21:15",
    ausnahmen: [],
    wiederholung: { art: "taeglich" },
  };
  const zaehle = (abweichung: object) => {
    const p = leseImport({ termine: [], serien: [{ ...serie, ...abweichung }] }, "gabriel", STANDARD_LABEL_IDS);
    assert.ok(p.ok);
    return p.wert.serien.length;
  };
  assert.equal(zaehle({ startDatum: "2026-02-31" }), 0, "den 31. Februar gibt es nicht");
  assert.equal(zaehle({ startZeit: "99:00" }), 0, "Stunde 99 gibt es nicht");
  assert.equal(zaehle({ endeZeit: "21:99" }), 0, "Minute 99 gibt es nicht");
  assert.equal(zaehle({}), 1, "die unveränderte Serie kommt weiterhin durch");
});

test("Termine mit unmöglicher Uhrzeit werden abgelehnt", () => {
  const p = leseImport(
    {
      termine: [
        { titel: "Stunde 30", label: "lesen", notiz: "", start: "2026-07-28T30:00", ende: "2026-07-28T31:00" },
        { titel: "Ende 24:00", label: "lesen", notiz: "", start: "2026-07-28T22:00", ende: "2026-07-28T24:00" },
      ],
    },
    "gabriel",
    STANDARD_LABEL_IDS,
  );
  assert.ok(p.ok);
  assert.equal(p.wert.termine.length, 0);
  assert.equal(p.wert.uebersprungen, 2);
});
