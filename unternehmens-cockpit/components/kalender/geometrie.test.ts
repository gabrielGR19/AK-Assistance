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
import { pageYMitScroll, autoScrollSchritt, SCROLL_MAX_PRO_SEKUNDE } from "./geometrie.ts";
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
  // Ein einstündiger Termin endet spätestens um 23:55 und beginnt damit um 22:55.
  assert.equal(neueStartMinute(10 * 60, 11 * 60, 10 * 60, 24 * 60), 22 * 60 + 55);
});

// Regression: Ein Ende von exakt 24:00 hat den Block auf die Mindesthöhe zusammenfallen
// lassen ("22:00–00:00"), weil minutenAmTag() aus einem so gebauten Date wieder 0 liest,
// und das Zeitfeld im Editor blieb leer. Alle drei Wege ins Ende müssen bei 23:55 stoppen.
test("kein Termin endet auf 24:00", () => {
  assert.equal(
    neueEndMinute(22 * 60, 23 * 60, 23 * 60, 24 * 60),
    24 * 60 - RASTER_MIN,
    "Ziehen am unteren Griff bis zur Rasterkante",
  );
  assert.equal(
    neuerZeitraum(22 * 60, 24 * 60).bis,
    24 * 60 - RASTER_MIN,
    "Aufziehen eines neuen Termins bis zur Rasterkante",
  );
  assert.equal(
    neueStartMinute(10 * 60, 11 * 60, 10 * 60, 24 * 60) + 60,
    24 * 60 - RASTER_MIN,
    "Verschieben nach ganz unten",
  );
  assert.equal(alsUhrzeit(24 * 60 - RASTER_MIN), "23:55");
});

test("Aufziehen ganz unten am Raster ergibt keinen umgekehrten Zeitraum", () => {
  const z = neuerZeitraum(24 * 60, 24 * 60);
  assert.ok(z.bis > z.von, `Ende (${z.bis}) muss nach dem Start (${z.von}) liegen`);
});

// Automatisches Mitscrollen: sichtbarer Bereich von 200 bis 800 (Fensterkoordinaten).
const OBEN = 200;
const UNTEN = 800;

test("in der Mitte des Rasters wird nicht gescrollt", () => {
  assert.equal(autoScrollSchritt(500, OBEN, UNTEN), 0);
  assert.equal(autoScrollSchritt(OBEN + 60, OBEN, UNTEN), 0, "knapp ausserhalb des Randstreifens");
  assert.equal(autoScrollSchritt(UNTEN - 60, OBEN, UNTEN), 0);
});

test("am unteren Rand wird nach unten gescrollt, am oberen nach oben", () => {
  assert.ok(autoScrollSchritt(UNTEN - 10, OBEN, UNTEN) > 0, "unten: positiver Versatz");
  assert.ok(autoScrollSchritt(OBEN + 10, OBEN, UNTEN) < 0, "oben: negativer Versatz");
});

test("der Versatz wächst zum Rand hin und bleibt gedeckelt", () => {
  const knapp = autoScrollSchritt(UNTEN - 40, OBEN, UNTEN);
  const naeher = autoScrollSchritt(UNTEN - 10, OBEN, UNTEN);
  assert.ok(naeher > knapp, `näher am Rand muss schneller sein (${naeher} > ${knapp})`);
  assert.equal(autoScrollSchritt(UNTEN, OBEN, UNTEN), SCROLL_MAX_PRO_SEKUNDE, "direkt an der Kante");
  assert.equal(autoScrollSchritt(UNTEN + 500, OBEN, UNTEN), SCROLL_MAX_PRO_SEKUNDE, "weit darunter nicht schneller");
  assert.equal(autoScrollSchritt(OBEN - 500, OBEN, UNTEN), -SCROLL_MAX_PRO_SEKUNDE, "weit darüber nicht schneller");
});

test("bei einem flachen Bereich überlappen sich die Randstreifen nicht", () => {
  // Höhe 30: ohne Deckelung läge die Mitte in beiden Streifen und würde gleichzeitig
  // nach oben und unten ziehen.
  const mitte = 15;
  const schritt = autoScrollSchritt(mitte, 0, 30);
  assert.equal(schritt, 0, "die Mitte eines flachen Bereichs scrollt nicht");
  assert.ok(autoScrollSchritt(29, 0, 30) > 0);
  assert.ok(autoScrollSchritt(1, 0, 30) < 0);
});

// Regression zur 05:30-Fehlerklasse: Beim Mitscrollen bewegt sich die Maus NICHT, nur
// scrollTop ändert sich. Die Uhrzeit unter dem Zeiger muss trotzdem mitwandern — und zwar
// über die Aufrechnung des Scroll-Versatzes, nicht über ein erneutes Messen des Rasters.
test("mitscrollen verschiebt die Uhrzeit unter dem stillstehenden Zeiger", () => {
  const mass: RasterMass = { obenAbsolut: 100, hoehe: 18 * SPUR };
  const pageY = 400; // Maus bleibt, wo sie ist
  const vorher = minuteAusPosition(pageYMitScroll(pageY, 0, 0), mass);
  const nachher = minuteAusPosition(pageYMitScroll(pageY, 0, SPUR), mass);
  assert.equal(nachher - vorher, 60, "eine Stunde Scroll = eine Stunde später");
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
