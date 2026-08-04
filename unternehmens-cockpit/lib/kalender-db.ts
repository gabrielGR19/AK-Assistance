import { promises as fs } from "fs";
import path from "path";
import type { KalenderDaten } from "./kalender-typen";
import { STANDARD_LABELS } from "./kalender-labels.ts";

// Eigene Datei neben cockpit.json: der Kalender wird ungleich häufiger geschrieben als die
// Kostendaten, und ein Fehler beim einen soll den anderen nicht mitreißen. data/ ist per
// .gitignore ausgeschlossen und wird beim Deploy nie überschrieben.
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "kalender.json");

export const KALENDER_VERSION = 1;

function leererKalender(): KalenderDaten {
  return {
    version: KALENDER_VERSION,
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

// Ergänzt fehlende Felder, damit ein älterer oder von Hand bearbeiteter Stand die App nicht
// zum Absturz bringt. Bewusst defensiv: die Datei liegt auf einem Server, an dem auch mal
// jemand von Hand etwas repariert.
function normalisiere(roh: Partial<KalenderDaten> | null): KalenderDaten {
  const leer = leererKalender();
  if (!roh || typeof roh !== "object") return leer;
  return {
    version: typeof roh.version === "number" ? roh.version : KALENDER_VERSION,
    aenderungszaehler: typeof roh.aenderungszaehler === "number" ? roh.aenderungszaehler : 0,
    termine: Array.isArray(roh.termine) ? roh.termine : [],
    serien: Array.isArray(roh.serien) ? roh.serien : [],
    ganztags: Array.isArray(roh.ganztags) ? roh.ganztags : [],
    reflexionen: {
      gabriel: roh.reflexionen?.gabriel ?? {},
      moritz: roh.reflexionen?.moritz ?? {},
    },
    pensumSoll: {
      gabriel: roh.pensumSoll?.gabriel ?? leer.pensumSoll.gabriel,
      moritz: roh.pensumSoll?.moritz ?? leer.pensumSoll.moritz,
    },
    vorlagen: Array.isArray(roh.vorlagen) ? roh.vorlagen : [],
    // Fehlt oder leer (alter Stand ohne Label-Verwaltung): Standardliste einsetzen, damit ein
    // frisch migrierter Kalender nicht ohne ein einziges Label startet.
    labels: Array.isArray(roh.labels) && roh.labels.length > 0 ? roh.labels : leer.labels,
  };
}

async function vonPlatte(): Promise<KalenderDaten> {
  try {
    return normalisiere(JSON.parse(await fs.readFile(DATA_FILE, "utf-8")));
  } catch (err: unknown) {
    if (istNichtGefunden(err)) return leererKalender();
    throw err; // kaputtes JSON oder Rechteproblem nicht verschlucken
  }
}

// Atomar schreiben: erst temporär, dann umbenennen. Ein Absturz mitten im Schreiben lässt
// die alte Datei intakt (gleiches Vorgehen wie lib/db.ts).
async function aufPlatte(daten: KalenderDaten): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(daten, null, 2), "utf-8");
  await fs.rename(temp, DATA_FILE);
}

// Nur lesen — braucht keine Sperre.
export async function ladeKalender(): Promise<KalenderDaten> {
  return vonPlatte();
}

// Warteschlange für Schreibvorgänge.
//
// Ohne sie wäre "laden → ändern → speichern" ein klassisches Lost Update: tragen Gabriel und
// Moritz in derselben Sekunde je einen Termin ein, lesen beide Anfragen denselben Stand und
// die zweite überschreibt den Termin der ersten. Diese Kette stellt sicher, dass immer nur
// ein Änderungsvorgang gleichzeitig läuft und jeder den Stand des vorherigen sieht.
//
// Prozessintern und damit ausreichend, solange EIN Node-Prozess läuft. Auf dem Server ist das
// so (pm2 `unternehmens-cockpit`, mode: fork, 1 Instanz — am 27.07.2026 geprüft). Würde das je
// auf pm2-Cluster umgestellt, greift diese Sperre nicht mehr und es bräuchte eine Dateisperre.
let kette: Promise<unknown> = Promise.resolve();

/**
 * Ändert den Kalender unter Ausschluss anderer Schreibvorgänge.
 *
 * `aendern` bekommt den frisch geladenen Stand und darf ihn direkt mutieren. Der Rückgabewert
 * wird durchgereicht. Wirft `aendern`, wird NICHTS gespeichert und der Fehler weitergegeben —
 * die Datei bleibt auf dem letzten gültigen Stand.
 */
export function aendereKalender<T>(aendern: (daten: KalenderDaten) => T | Promise<T>): Promise<T> {
  const lauf = kette.then(async () => {
    const daten = await vonPlatte();
    const ergebnis = await aendern(daten);
    daten.aenderungszaehler += 1;
    await aufPlatte(daten);
    return ergebnis;
  });
  // Die Kette selbst darf nie im Fehlerzustand hängenbleiben, sonst scheitern alle
  // Folgeaufrufe. Der Fehler erreicht den Aufrufer über `lauf`.
  kette = lauf.catch(() => undefined);
  return lauf;
}

function istNichtGefunden(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as NodeJS.ErrnoException).code === "ENOENT"
  );
}
