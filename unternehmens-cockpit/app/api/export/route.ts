import { ladeDaten } from "@/lib/db";

// GET /api/export — lädt die komplette JSON-"Datenbank" als Datei herunter (manuelles Backup).
// Dateiname mit Datum, damit mehrere Stände unterscheidbar bleiben.
export async function GET() {
  try {
    const daten = await ladeDaten();
    const datum = new Date().toISOString().slice(0, 10);
    const inhalt = JSON.stringify(daten, null, 2);
    return new Response(inhalt, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="cockpit-${datum}.json"`,
      },
    });
  } catch (err) {
    console.error("Fehler beim Export:", err);
    return Response.json({ fehler: "Export fehlgeschlagen." }, { status: 500 });
  }
}
