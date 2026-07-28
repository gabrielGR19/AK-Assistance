import { test } from "node:test";
import assert from "node:assert/strict";
import { leseImport } from "./kalender-import.ts";

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
  const p = leseImport(prototypDatei, "gabriel");
  assert.ok(p.ok);
  assert.equal(p.wert.termine.length, 2);
  assert.ok(p.wert.termine.every((t) => t.besitzer === "gabriel"));
  assert.equal(p.wert.ganztags[0].besitzer, "gabriel");
  assert.equal(p.wert.vorlagen[0].besitzer, "gabriel");
  assert.equal(p.wert.pensumSoll, 240);
  assert.equal(p.wert.uebersprungen, 0);
});

test("leere Reflexionen werden nicht mitgeschleppt", () => {
  const p = leseImport(prototypDatei, "gabriel");
  assert.ok(p.ok);
  assert.deepEqual(Object.keys(p.wert.reflexionen), ["2026-07-27"]);
});

test("ids aus der Datei werden nicht übernommen", () => {
  const p = leseImport(prototypDatei, "gabriel");
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
  const p = leseImport(export_, "gabriel");
  assert.ok(p.ok);
  assert.equal(p.wert.termine.length, 1);
  assert.equal(p.wert.termine[0].titel, "Cold Calls");
  assert.equal(p.wert.ganztags.length, 0);
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
  );
  assert.ok(p.ok);
  assert.equal(p.wert.termine.length, 1);
  assert.equal(p.wert.uebersprungen, 3);
});

test("etwas, das kein Kalender ist, wird abgelehnt", () => {
  assert.ok(!leseImport(null, "gabriel").ok);
  assert.ok(!leseImport("text", "gabriel").ok);
  assert.ok(!leseImport([1, 2, 3], "gabriel").ok);
  assert.ok(!leseImport({ irgendwas: true }, "gabriel").ok);
});

test("unsinniges Pensum lässt das bestehende stehen", () => {
  const p = leseImport({ termine: [], pensumSoll: 99999 }, "gabriel");
  assert.ok(p.ok);
  assert.equal(p.wert.pensumSoll, null);
});
