// Fügt den Dienst "leadgen" additiv in data/cockpit.json ein, falls er fehlt.
// Idempotent: mehrfacher Aufruf hat keine Wirkung, sobald der Dienst existiert.
// Nötig, weil lib/seed.ts nur bei komplett fehlender Datei läuft - eine bereits
// bestehende cockpit.json (lokal wie auf dem Server) bekommt neue Dienste sonst
// nie automatisch nachgetragen.

const fs = require("fs");
const path = require("path");

const DATEI = path.join(process.cwd(), "data", "cockpit.json");

const daten = JSON.parse(fs.readFileSync(DATEI, "utf-8"));

if (daten.dienste.some((d) => d.id === "leadgen")) {
  console.log("Dienst 'leadgen' existiert bereits - nichts zu tun.");
  process.exit(0);
}

const jetzt = new Date().toISOString();

daten.dienste.push({
  id: "leadgen",
  name: "Google Places API (Leadgen)",
  kategorie: "Marketing/API",
  abrechnungsmodell: "verbrauch",
  waehrung: "EUR",
  inhaber: "",
  betrag: null,
  statusAmpel: "ok",
  naechsteFaelligkeit: null,
  notiz:
    "Kein echter Kostenpunkt, reine Verbrauchsanzeige gegen das 1.000-Calls-Freikontingent/Monat " +
    "(SKU Enterprise+Atmosphere). Bei Überschreitung: $40 pro 1.000 weitere Calls.",
  herkunft: "manuell",
  letzteAenderung: jetzt,
  letzterAbruf: null,
  abrufStatus: null,
  leadgen: { callsMonat: null, monat: null },
});

const temp = `${DATEI}.${process.pid}.tmp`;
fs.writeFileSync(temp, JSON.stringify(daten, null, 2), "utf-8");
fs.renameSync(temp, DATEI);

console.log("Dienst 'leadgen' ergänzt.");
