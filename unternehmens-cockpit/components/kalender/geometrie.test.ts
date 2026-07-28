import { test } from "node:test";
import assert from "node:assert/strict";
import {
  minuteAusPosition,
  neueStartMinute,
  neueEndMinute,
  neuerZeitraum,
  spalteAusPosition,
  alsUhrzeit,
  runde,
  RASTER_MIN,
  type RasterMass,
} from "./geometrie.ts";
import { pageYMitScroll } from "./geometrie.ts";
import { STUNDE_VON, SPUR } from "./datum.ts";

test("ohne Scrollen während des Zugs bleibt die Zeigerposition unverändert", () => {
  assert.equal(pageYMitScroll(500, 120, 120), 500);
});

test("Scrollen mitten im Ziehen verschiebt die Zeigerposition mit dem Raster", () => {
  // 84px nach unten gescrollt = eine Stunde: der Zeiger steht jetzt eine Stunde später.
  assert.equal(pageYMitScroll(500, 0, SPUR), 500 + SPUR);
  // Zurückgescrollt: entsprechend nach oben.
  assert.equal(pageYMitScroll(500, SPUR, 0), 500 - SPUR);
});

// Rasterfläche wie im Browser: beginnt 500px unter dem Dokumentanfang, 06:00–24:00.
const MASS: RasterMass = { obenAbsolut: 500, hoehe: 18 * SPUR };

// Dokumentposition einer Uhrzeit — die Umkehrung dessen, was der Kalender rechnet.
function pageYFuer(stunde: number, minute = 0): number {
  return MASS.obenAbsolut + ((stunde * 60 + minute - STUNDE_VON * 60) / 60) * SPUR;
}

test("Position wird zur richtigen Uhrzeit", () => {
  assert.equal(minuteAusPosition(pageYFuer(6), MASS), 6 * 60);
  assert.equal(minuteAusPosition(pageYFuer(10), MASS), 10 * 60);
  assert.equal(minuteAusPosition(pageYFuer(23, 30), MASS), 23 * 60 + 30);
});

test("Position wird auf 5 Minuten gerundet", () => {
  assert.equal(runde(612), 610);
  assert.equal(runde(613), 615);
  assert.equal(minuteAusPosition(pageYFuer(10, 2), MASS) % RASTER_MIN, 0);
});

test("Positionen ausserhalb des Rasters werden geklemmt, nicht extrapoliert", () => {
  assert.equal(minuteAusPosition(0, MASS), STUNDE_VON * 60, "weit oberhalb → 06:00");
  assert.equal(minuteAusPosition(999_999, MASS), 24 * 60, "weit unterhalb → 24:00");
});

// ---------------------------------------------------------------------------
// Regression: der Fehler, wegen dem Termine auf 05:30 sprangen und verschwanden.
// ---------------------------------------------------------------------------

test("REGRESSION: Klick ohne Bewegung verschiebt den Termin nicht", () => {
  // Termin 10:00–11:00, in der Mitte angefasst (10:30), Maus bewegt sich nicht.
  const urVon = 10 * 60;
  const urBis = 11 * 60;
  const griff = 10 * 60 + 30;

  const neu = neueStartMinute(urVon, urBis, griff, griff);

  assert.equal(neu, urVon, "der Termin muss exakt liegen bleiben");
  assert.notEqual(neu, 5 * 60 + 30, "insbesondere darf er nicht auf 05:30 springen");
});

test("REGRESSION: die alte Rechnung ergab 05:30 — die neue kann das nicht mehr", () => {
  // Der alte Code las die Rasterposition aus einem Element, das ein Neuaufbau ersetzt hatte.
  // Dessen getBoundingClientRect() lieferte Nullen, wodurch jede weitere Bewegung als
  // "Zeiger steht auf 06:00" gelesen wurde:
  const urVon = 10 * 60;
  const griff = 10 * 60 + 30;
  const zeigerAltFehlerhaft = STUNDE_VON * 60; // 360, das Ergebnis des kaputten Rects
  assert.equal(urVon + (zeigerAltFehlerhaft - griff), 5 * 60 + 30, "so entstand die 05:30");

  // Neu: die Rasterfläche wird einmalig beim Drücken gemessen und durchgereicht, statt
  // während der Bewegung erneut aus dem DOM gelesen zu werden. Dieselbe Mausposition
  // ergibt deshalb weiterhin dieselbe Uhrzeit — auch nach beliebig vielen Neuaufbauten.
  const zeigerNeu = minuteAusPosition(pageYFuer(10, 30), MASS);
  assert.equal(zeigerNeu, griff);
  assert.equal(neueStartMinute(urVon, 11 * 60, griff, zeigerNeu), urVon);
});

test("Verschieben um eine Stunde nach unten", () => {
  const neu = neueStartMinute(10 * 60, 11 * 60, 10 * 60 + 30, 11 * 60 + 30);
  assert.equal(neu, 11 * 60);
});

test("Verschieben wird an den Tagesgrenzen geklemmt, Dauer bleibt erhalten", () => {
  assert.equal(neueStartMinute(10 * 60, 11 * 60, 10 * 60, 0), 0, "nicht vor 00:00");
  // Ein einstündiger Termin kann spätestens um 23:00 beginnen.
  assert.equal(neueStartMinute(10 * 60, 11 * 60, 10 * 60, 24 * 60), 23 * 60);
});

test("Größe ändern: Ende folgt, Mindestlänge bleibt", () => {
  assert.equal(neueEndMinute(10 * 60, 11 * 60, 11 * 60, 12 * 60), 12 * 60);
  assert.equal(
    neueEndMinute(10 * 60, 11 * 60, 11 * 60, 8 * 60),
    10 * 60 + RASTER_MIN,
    "das Ende darf nie vor oder auf den Start rutschen",
  );
});

test("Neuer Termin: Klick ohne Aufziehen ergibt eine Stunde", () => {
  assert.deepEqual(neuerZeitraum(9 * 60, 9 * 60), { von: 9 * 60, bis: 10 * 60 });
});

test("Neuer Termin: nach oben aufgezogen ergibt denselben Zeitraum wie nach unten", () => {
  assert.deepEqual(neuerZeitraum(11 * 60, 9 * 60), { von: 9 * 60, bis: 11 * 60 });
  assert.deepEqual(neuerZeitraum(9 * 60, 11 * 60), { von: 9 * 60, bis: 11 * 60 });
});

test("Spaltenzuordnung trifft den richtigen Tag", () => {
  const spalten = [
    { datum: "2026-07-27", linksAbsolut: 100, rechtsAbsolut: 200 },
    { datum: "2026-07-28", linksAbsolut: 200, rechtsAbsolut: 300 },
    { datum: "2026-07-29", linksAbsolut: 300, rechtsAbsolut: 400 },
  ];
  assert.equal(spalteAusPosition(150, spalten), "2026-07-27");
  assert.equal(spalteAusPosition(200, spalten), "2026-07-28", "linke Kante gehört zur neuen Spalte");
  assert.equal(spalteAusPosition(399, spalten), "2026-07-29");
  assert.equal(spalteAusPosition(20, spalten), "2026-07-27", "links daneben → erste Spalte");
  assert.equal(spalteAusPosition(9999, spalten), "2026-07-29", "rechts daneben → letzte Spalte");
  assert.equal(spalteAusPosition(150, []), null);
});

test("Minuten werden korrekt als Uhrzeit formatiert", () => {
  assert.equal(alsUhrzeit(0), "00:00");
  assert.equal(alsUhrzeit(9 * 60 + 5), "09:05");
  assert.equal(alsUhrzeit(23 * 60 + 55), "23:55");
});
