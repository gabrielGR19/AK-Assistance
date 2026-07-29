import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

// kalender-db.ts liest den Datenpfad beim Laden des Moduls aus process.cwd(). Der Test wechselt
// deshalb VOR dem Import in ein Wegwerf-Verzeichnis — sonst würde er die echte
// data/kalender.json überschreiben.
const urspruenglichesCwd = process.cwd();
let tempDir = "";
let db: typeof import("./kalender-db");

before(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kalender-test-"));
  process.chdir(tempDir);
  db = await import("./kalender-db.ts");
});

after(async () => {
  process.chdir(urspruenglichesCwd);
  await fs.rm(tempDir, { recursive: true, force: true });
});

test("leerer Kalender, wenn die Datei noch nicht existiert", async () => {
  const daten = await db.ladeKalender();
  assert.equal(daten.termine.length, 0);
  assert.equal(daten.aenderungszaehler, 0);
  assert.deepEqual(Object.keys(daten.reflexionen).sort(), ["gabriel", "moritz"]);
});

test("50 gleichzeitige Anlagen gehen alle durch — kein Lost Update", async () => {
  // Das ist der eigentliche Zweck der Warteschlange: ohne sie lesen mehrere Aufrufe
  // denselben Stand und überschreiben sich gegenseitig.
  await Promise.all(
    Array.from({ length: 50 }, (_, i) =>
      db.aendereKalender((d) => {
        d.termine.push({
          id: `t${i}`,
          besitzer: i % 2 === 0 ? "gabriel" : "moritz",
          titel: `Termin ${i}`,
          label: "gruendung",
          notiz: "",
          start: "2026-07-27T10:00",
          ende: "2026-07-27T11:00",
        });
      }),
    ),
  );

  const daten = await db.ladeKalender();
  assert.equal(daten.termine.length, 50, "alle 50 Termine müssen erhalten sein");
  assert.equal(new Set(daten.termine.map((t) => t.id)).size, 50, "keine doppelten IDs");
  assert.equal(daten.aenderungszaehler, 50, "jede Änderung zählt den Zähler hoch");
});

test("wirft die Änderungsfunktion, wird nichts gespeichert", async () => {
  const vorher = await db.ladeKalender();

  await assert.rejects(
    db.aendereKalender(() => {
      throw new Error("Absicht");
    }),
    /Absicht/,
  );

  const nachher = await db.ladeKalender();
  assert.equal(nachher.termine.length, vorher.termine.length);
  assert.equal(nachher.aenderungszaehler, vorher.aenderungszaehler, "Zähler darf nicht steigen");
});

test("nach einem Fehler funktionieren weitere Änderungen (Kette reißt nicht ab)", async () => {
  await db.aendereKalender((d) => {
    d.termine.push({
      id: "danach",
      besitzer: "gabriel",
      titel: "Nach dem Fehler",
      label: "gruendung",
      notiz: "",
      start: "2026-07-28T09:00",
      ende: "2026-07-28T09:30",
    });
  });

  const daten = await db.ladeKalender();
  assert.ok(daten.termine.some((t) => t.id === "danach"));
});

test("unvollständiger Stand auf Platte wird ergänzt statt zu crashen", async () => {
  await fs.writeFile(
    path.join(tempDir, "data", "kalender.json"),
    JSON.stringify({ termine: [{ id: "x" }] }),
    "utf-8",
  );

  const daten = await db.ladeKalender();
  assert.equal(daten.termine.length, 1);
  assert.deepEqual(daten.serien, []);
  assert.equal(daten.pensumSoll.moritz, 240, "fehlendes Pensum bekommt den Standardwert");
});
