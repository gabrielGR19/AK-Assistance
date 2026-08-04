import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STANDARD_LABELS,
  STANDARD_LABEL_IDS,
  erlaubteLabels,
  validiereLabel,
  baueLabel,
  textfarbeZu,
  labelNutzung,
  nutzungText,
  labelKarte,
  labelAus,
  MIN_LABELS,
} from "./kalender-labels.ts";
import type { KalenderDaten } from "./kalender-typen.ts";

const gueltig = { name: "Marketing", farbe: "#5AC8FA", arbeit: true, gruppe: "firma" as const };

test("gültiges Label wird angenommen", () => {
  const p = validiereLabel(gueltig);
  assert.ok(p.ok);
  assert.equal(p.wert.name, "Marketing");
});

test("Name wird getrimmt", () => {
  const p = validiereLabel({ ...gueltig, name: "  Vertrieb  " });
  assert.ok(p.ok);
  assert.equal(p.wert.name, "Vertrieb");
});

test("leerer Name wird abgelehnt", () => {
  const p = validiereLabel({ ...gueltig, name: "   " });
  assert.ok(!p.ok);
  assert.match(p.fehler, /Namen/);
});

test("zu langer Name wird abgelehnt", () => {
  const p = validiereLabel({ ...gueltig, name: "x".repeat(41) });
  assert.ok(!p.ok);
});

test("Farbe ohne Hex-Format wird abgelehnt", () => {
  for (const farbe of ["blau", "#fff", "5AC8FA", "#5AC8FAFF", ""]) {
    const p = validiereLabel({ ...gueltig, farbe });
    assert.ok(!p.ok, `${farbe} darf nicht durchgehen`);
  }
});

test("arbeit muss ein Wahrheitswert sein", () => {
  const p = validiereLabel({ ...gueltig, arbeit: "ja" });
  assert.ok(!p.ok);
});

test("Gruppe muss 'firma' oder 'uebrige' sein", () => {
  assert.ok(!validiereLabel({ ...gueltig, gruppe: "sonstiges" }).ok);
  assert.ok(validiereLabel({ ...gueltig, gruppe: "uebrige" }).ok);
});

test("Nicht-Objekt als Eingabe wird abgelehnt", () => {
  for (const wert of [null, undefined, "text", 5]) {
    assert.ok(!validiereLabel(wert).ok);
  }
});

test("baueLabel vergibt eine id und berechnet die Schriftfarbe", () => {
  const p = validiereLabel(gueltig);
  assert.ok(p.ok);
  const l = baueLabel(p.wert);
  assert.ok(l.id.startsWith("l"));
  assert.equal(l.name, "Marketing");
  assert.equal(l.farbe, "#5AC8FA");
});

test("textfarbeZu lässt helle Farben unverändert", () => {
  // Wie "Vertrieb" im Standardbestand: Rand- und Schriftfarbe sind dort identisch.
  assert.equal(textfarbeZu("#5AC8FA"), "#5AC8FA");
  assert.equal(textfarbeZu("#FFFFFF"), "#FFFFFF");
});

test("textfarbeZu hellt dunkle Farben auf", () => {
  const hell = textfarbeZu("#0A63D6");
  assert.notEqual(hell, "#0A63D6");
  // Aufgehellt heißt: jeder Kanal ist mindestens so groß wie vorher.
  const kanal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  for (let i = 0; i < 3; i++) {
    assert.ok(kanal(hell, i) >= kanal("#0A63D6", i));
  }
});

test("STANDARD_LABELS deckt sich mit STANDARD_LABEL_IDS", () => {
  assert.deepEqual(new Set(STANDARD_LABELS.map((l) => l.id)), STANDARD_LABEL_IDS);
  assert.equal(STANDARD_LABELS.length, 7);
});

function leererKalenderMitLabels(): KalenderDaten {
  return {
    version: 1,
    aenderungszaehler: 0,
    termine: [],
    serien: [],
    ganztags: [],
    reflexionen: { gabriel: {}, moritz: {} },
    pensumSoll: { gabriel: 240, moritz: 240 },
    vorlagen: [],
    labels: STANDARD_LABELS.map((l) => ({ ...l })),
  };
}

test("erlaubteLabels liefert die ids der aktuellen Liste", () => {
  const daten = leererKalenderMitLabels();
  const erlaubt = erlaubteLabels(daten);
  assert.ok(erlaubt.has("vertrieb"));
  assert.ok(!erlaubt.has("urlaub"));
});

test("labelNutzung zählt über beide Personen", () => {
  const daten = leererKalenderMitLabels();
  daten.termine.push(
    { id: "t1", besitzer: "gabriel", titel: "A", label: "sport", notiz: "", start: "2026-08-04T09:00", ende: "2026-08-04T10:00" },
    { id: "t2", besitzer: "moritz", titel: "B", label: "sport", notiz: "", start: "2026-08-04T11:00", ende: "2026-08-04T12:00" },
  );
  daten.vorlagen.push({ id: "v1", besitzer: "gabriel", titel: "Gym", label: "sport", min: 60 });

  const n = labelNutzung(daten, "sport");
  assert.equal(n.termine, 2);
  assert.equal(n.serien, 0);
  assert.equal(n.vorlagen, 1);
  assert.match(nutzungText(n), /2 Terminen/);
  assert.match(nutzungText(n), /1 Vorlage/);
});

test("labelNutzung ist 0 für ein ungenutztes Label", () => {
  const daten = leererKalenderMitLabels();
  const n = labelNutzung(daten, "arzt");
  assert.deepEqual(n, { termine: 0, serien: 0, vorlagen: 0 });
  assert.equal(nutzungText(n), "");
});

test("labelAus liefert ein neutrales Ersatzlabel für unbekannte Schlüssel", () => {
  const karte = labelKarte(STANDARD_LABELS);
  assert.equal(labelAus(karte, "vertrieb").name, "Vertrieb (Cold Calls)");
  const ersatz = labelAus(karte, "geloescht");
  assert.equal(ersatz.name, "Unbekannt");
});

test("MIN_LABELS ist mindestens 1", () => {
  assert.ok(MIN_LABELS >= 1);
});
