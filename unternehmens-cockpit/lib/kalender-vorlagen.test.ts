import { test } from "node:test";
import assert from "node:assert/strict";
import { baueVorlage, darfVorlageAendern, validiereVorlage } from "./kalender-vorlagen.ts";
import type { Vorlage } from "./kalender-typen.ts";

const gueltig = { titel: "Cold Calls (10 Anrufe)", label: "vertrieb", min: 75 };

test("gültige Vorlage wird angenommen", () => {
  const p = validiereVorlage(gueltig);
  assert.ok(p.ok);
  assert.equal(p.wert.min, 75);
});

test("Titel wird getrimmt", () => {
  const p = validiereVorlage({ ...gueltig, titel: "  Gym  " });
  assert.ok(p.ok);
  assert.equal(p.wert.titel, "Gym");
});

test("leerer Titel wird abgelehnt", () => {
  const p = validiereVorlage({ ...gueltig, titel: "   " });
  assert.ok(!p.ok);
  assert.match(p.fehler, /Titel/);
});

test("unbekanntes Label wird abgelehnt", () => {
  const p = validiereVorlage({ ...gueltig, label: "urlaub" });
  assert.ok(!p.ok);
});

test("zu kurze und zu lange Dauer werden abgelehnt", () => {
  assert.ok(!validiereVorlage({ ...gueltig, min: 1 }).ok);
  assert.ok(!validiereVorlage({ ...gueltig, min: 13 * 60 }).ok);
});

test("Dauer als Kommazahl wird abgelehnt", () => {
  assert.ok(!validiereVorlage({ ...gueltig, min: 30.5 }).ok);
});

test("Besitzer kommt aus der Anmeldung, nicht aus der Eingabe", () => {
  const p = validiereVorlage({ ...gueltig, besitzer: "moritz" });
  assert.ok(p.ok);
  const v = baueVorlage(p.wert, "gabriel");
  assert.equal(v.besitzer, "gabriel");
  assert.ok(v.id.startsWith("v"));
});

test("darfVorlageAendern lässt nur den Besitzer durch", () => {
  const v: Vorlage = { id: "v1", besitzer: "gabriel", titel: "Gym", label: "sport", min: 120 };
  assert.equal(darfVorlageAendern(v, "gabriel"), true);
  assert.equal(darfVorlageAendern(v, "moritz"), false);
  assert.equal(darfVorlageAendern(v, null), false);
});
