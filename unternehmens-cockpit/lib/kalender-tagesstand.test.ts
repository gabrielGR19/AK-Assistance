import { test } from "node:test";
import assert from "node:assert/strict";
import { istLeer, validierePensum, validiereReflexion } from "./kalender-tagesstand.ts";

test("gültiger Tagesabschluss wird angenommen", () => {
  const p = validiereReflexion({ datum: "2026-07-28", ab: true, notiz: "  Lief gut  " });
  assert.ok(p.ok);
  assert.equal(p.wert.datum, "2026-07-28");
  assert.equal(p.wert.ab, true);
  assert.equal(p.wert.notiz, "Lief gut");
});

test("fehlende Notiz ist erlaubt und wird zu leerem Text", () => {
  const p = validiereReflexion({ datum: "2026-07-28", ab: false });
  assert.ok(p.ok);
  assert.equal(p.wert.notiz, "");
});

test("Datum, das es nicht gibt, wird abgelehnt", () => {
  const p = validiereReflexion({ datum: "2026-02-31", ab: true, notiz: "" });
  assert.ok(!p.ok);
  assert.match(p.fehler, /Datum/);
});

test("Datum im falschen Format wird abgelehnt", () => {
  const p = validiereReflexion({ datum: "28.07.2026", ab: true, notiz: "" });
  assert.ok(!p.ok);
  assert.match(p.fehler, /Datum/);
});

test("Haken muss ein Wahrheitswert sein", () => {
  const p = validiereReflexion({ datum: "2026-07-28", ab: "ja", notiz: "" });
  assert.ok(!p.ok);
  assert.match(p.fehler, /true oder false/);
});

test("zu lange Notiz wird abgelehnt", () => {
  const p = validiereReflexion({ datum: "2026-07-28", ab: true, notiz: "x".repeat(501) });
  assert.ok(!p.ok);
  assert.match(p.fehler, /501|Zeichen/);
});

test("Pensum in Minuten wird angenommen", () => {
  const p = validierePensum({ minuten: 240 });
  assert.ok(p.ok);
  assert.equal(p.wert, 240);
});

test("Pensum 0 ist erlaubt (freier Tag)", () => {
  const p = validierePensum({ minuten: 0 });
  assert.ok(p.ok);
  assert.equal(p.wert, 0);
});

test("Pensum über 24 Stunden wird abgelehnt", () => {
  const p = validierePensum({ minuten: 24 * 60 + 1 });
  assert.ok(!p.ok);
  assert.match(p.fehler, /24 Stunden/);
});

test("negatives Pensum wird abgelehnt", () => {
  const p = validierePensum({ minuten: -30 });
  assert.ok(!p.ok);
});

test("Pensum als Kommazahl oder Text wird abgelehnt", () => {
  assert.ok(!validierePensum({ minuten: 90.5 }).ok);
  assert.ok(!validierePensum({ minuten: "240" }).ok);
});

test("Eintrag ohne Haken und ohne Notiz gilt als leer", () => {
  assert.equal(istLeer({ ab: false, notiz: "" }), true);
  assert.equal(istLeer({ ab: true, notiz: "" }), false);
  assert.equal(istLeer({ ab: false, notiz: "war zäh" }), false);
});
