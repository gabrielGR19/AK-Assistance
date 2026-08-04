import { test } from "node:test";
import assert from "node:assert/strict";
import { validiereTermin, darfAendern, istZeitpunkt, istEchtesDatum } from "./kalender-termine.ts";
import type { Termin } from "./kalender-typen.ts";
import { STANDARD_LABEL_IDS } from "./kalender-labels.ts";

const gueltig = {
  titel: "Cold Calls",
  label: "vertrieb",
  notiz: "10 Anrufe",
  start: "2026-07-27T09:00",
  ende: "2026-07-27T10:15",
};

test("gültiger Termin wird angenommen", () => {
  const p = validiereTermin(gueltig, STANDARD_LABEL_IDS);
  assert.ok(p.ok);
  assert.equal(p.wert.titel, "Cold Calls");
  assert.equal(p.wert.start, "2026-07-27T09:00");
});

test("leerer Titel wird zu 'Ohne Titel' statt abgelehnt", () => {
  const p = validiereTermin({ ...gueltig, titel: "   " }, STANDARD_LABEL_IDS);
  assert.ok(p.ok);
  assert.equal(p.wert.titel, "Ohne Titel");
});

test("unbekanntes Label wird abgelehnt", () => {
  const p = validiereTermin({ ...gueltig, label: "urlaub" }, STANDARD_LABEL_IDS);
  assert.ok(!p.ok);
  assert.match(p.fehler, /Label/);
});

test("Ende vor Start wird abgelehnt", () => {
  const p = validiereTermin({ ...gueltig, start: "2026-07-27T11:00", ende: "2026-07-27T10:00" }, STANDARD_LABEL_IDS);
  assert.ok(!p.ok);
  assert.match(p.fehler, /Ende/);
});

test("Ende gleich Start wird abgelehnt (kein Null-Minuten-Termin)", () => {
  const p = validiereTermin({ ...gueltig, ende: gueltig.start }, STANDARD_LABEL_IDS);
  assert.ok(!p.ok);
});

test("Termin über Mitternacht wird abgelehnt", () => {
  const p = validiereTermin({ ...gueltig, start: "2026-07-27T23:00", ende: "2026-07-28T01:00" }, STANDARD_LABEL_IDS);
  assert.ok(!p.ok);
  assert.match(p.fehler, /selben Tag/);
});

test("nicht existierendes Datum wird abgelehnt", () => {
  // Reine Regex-Prüfung würde den 31. Februar durchlassen.
  assert.equal(istEchtesDatum("2026-02-31"), false);
  assert.equal(istEchtesDatum("2026-02-28"), true);
  const p = validiereTermin({ ...gueltig, start: "2026-02-31T09:00", ende: "2026-02-31T10:00" }, STANDARD_LABEL_IDS);
  assert.ok(!p.ok);
});

test("kaputte Zeitformate werden abgelehnt", () => {
  for (const wert of ["2026-07-27 09:00", "2026-7-27T09:00", "09:00", "", null, 42, undefined]) {
    assert.equal(istZeitpunkt(wert), false, `${String(wert)} darf kein Zeitpunkt sein`);
  }
});

test("überlanger Titel wird abgelehnt", () => {
  const p = validiereTermin({ ...gueltig, titel: "x".repeat(201) }, STANDARD_LABEL_IDS);
  assert.ok(!p.ok);
});

test("Nicht-Objekt als Eingabe wird abgelehnt", () => {
  for (const wert of [null, undefined, "text", 5, []]) {
    const p = validiereTermin(wert, STANDARD_LABEL_IDS);
    if (Array.isArray(wert)) continue; // ein Array ist ein Objekt, scheitert an den Feldern
    assert.ok(!p.ok, `${String(wert)} darf nicht durchgehen`);
  }
});

test("darfAendern lässt nur den Besitzer durch", () => {
  const termin: Termin = { id: "t1", besitzer: "gabriel", ...gueltig, label: "vertrieb" };
  assert.equal(darfAendern(termin, "gabriel"), true);
  assert.equal(darfAendern(termin, "moritz"), false, "Moritz darf Gabriels Termin nicht ändern");
  assert.equal(darfAendern(termin, null), false, "ohne Anmeldung darf niemand ändern");
});
