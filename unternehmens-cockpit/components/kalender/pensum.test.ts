import { test } from "node:test";
import assert from "node:assert/strict";
import { pensumAm, stundenText } from "./pensum.ts";
import type { Termin } from "../../lib/kalender-typen.ts";
import { STANDARD_LABELS, labelKarte } from "../../lib/kalender-labels.ts";

const TAG = "2026-07-28";
const LABELS = labelKarte(STANDARD_LABELS);

function termin(teile: Partial<Termin>): Termin {
  return {
    id: "t1",
    besitzer: "gabriel",
    titel: "Test",
    label: "programmieren",
    notiz: "",
    start: `${TAG}T09:00`,
    ende: `${TAG}T10:00`,
    ...teile,
  };
}

test("zählt eigene Arbeitstermine des Tages in Minuten", () => {
  const termine = [
    termin({ id: "a", start: `${TAG}T09:00`, ende: `${TAG}T10:30` }),
    termin({ id: "b", label: "vertrieb", start: `${TAG}T11:00`, ende: `${TAG}T12:15` }),
  ];
  assert.equal(pensumAm(termine, "gabriel", TAG, LABELS), 90 + 75);
});

test("Termine anderer Tage zählen nicht", () => {
  const termine = [termin({ id: "a", start: "2026-07-29T09:00", ende: "2026-07-29T10:00" })];
  assert.equal(pensumAm(termine, "gabriel", TAG, LABELS), 0);
});

test("Termine der anderen Person zählen nicht", () => {
  const termine = [termin({ id: "a", besitzer: "moritz" })];
  assert.equal(pensumAm(termine, "gabriel", TAG, LABELS), 0);
});

test("Sport, Lesen und Arzt zahlen nicht aufs Arbeitspensum ein", () => {
  const termine = [
    termin({ id: "a", label: "sport", ende: `${TAG}T11:00` }),
    termin({ id: "b", label: "lesen", start: `${TAG}T12:00`, ende: `${TAG}T13:00` }),
    termin({ id: "c", label: "arzt", start: `${TAG}T14:00`, ende: `${TAG}T15:00` }),
  ];
  assert.equal(pensumAm(termine, "gabriel", TAG, LABELS), 0);
});

test("aufgelöste Serien-Vorkommen zählen wie normale Termine", () => {
  const termine = [
    termin({
      id: "serie:s1:2026-07-28",
      label: "gruendung",
      start: `${TAG}T11:00`,
      ende: `${TAG}T12:00`,
      ausSerie: { serieId: "s1", datum: TAG },
    }),
  ];
  assert.equal(pensumAm(termine, "gabriel", TAG, LABELS), 60);
});


test("stundenText schreibt deutsche Kommazahlen", () => {
  assert.equal(stundenText(240), "4,0");
  assert.equal(stundenText(90), "1,5");
  assert.equal(stundenText(0), "0,0");
});
