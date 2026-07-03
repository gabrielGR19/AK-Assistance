import { promises as fs } from "fs";
import path from "path";
import { CockpitData } from "./types";
import { seedDaten } from "./seed";

// Speicherort der JSON-"Datenbank". Liegt unter data/ und ist per .gitignore ausgeschlossen.
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "cockpit.json");

// Lädt die Cockpit-Daten. Existiert die Datei noch nicht, wird sie einmalig aus dem Seed erzeugt.
export async function ladeDaten(): Promise<CockpitData> {
  try {
    const inhalt = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(inhalt) as CockpitData;
  } catch (err: unknown) {
    if (istNichtGefunden(err)) {
      const daten = seedDaten();
      await speichereDaten(daten);
      return daten;
    }
    // Andere Fehler (kaputtes JSON, Rechte) nicht verschlucken — sichtbar machen.
    throw err;
  }
}

// Schreibt die Daten atomar: erst in eine temporäre Datei, dann umbenennen.
// So bleibt bei einem Absturz mitten im Schreiben die alte Datei intakt.
export async function speichereDaten(daten: CockpitData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(daten, null, 2), "utf-8");
  await fs.rename(temp, DATA_FILE);
}

// Prüft, ob ein Fehler "Datei nicht gefunden" (ENOENT) ist.
function istNichtGefunden(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as NodeJS.ErrnoException).code === "ENOENT"
  );
}
