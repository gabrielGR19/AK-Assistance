import { ladeDaten, speichereDaten } from "@/lib/db";
import type { AlertStatus } from "@/lib/types";

// GET /api/alerts — alle Alerts, neueste zuerst.
export async function GET() {
  try {
    const daten = await ladeDaten();
    const alerts = [...(daten.alerts ?? [])].sort(
      (a, b) => Date.parse(b.letztesAuftreten) - Date.parse(a.letztesAuftreten),
    );
    return Response.json({ alerts, scan: daten.alertsScan ?? null });
  } catch (err) {
    console.error("Fehler beim Laden der Alerts:", err);
    return Response.json({ fehler: "Alerts konnten nicht geladen werden." }, { status: 500 });
  }
}

const GUELTIGE_STATUS: AlertStatus[] = ["neu", "gesehen", "erledigt"];

// PATCH /api/alerts — Status eines Alerts ändern: { id, status }.
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; status?: string };
    if (!body.id || !GUELTIGE_STATUS.includes(body.status as AlertStatus)) {
      return Response.json({ fehler: "id und gültiger status erforderlich." }, { status: 400 });
    }
    const daten = await ladeDaten();
    const alert = (daten.alerts ?? []).find((a) => a.id === body.id);
    if (!alert) return Response.json({ fehler: "Alert nicht gefunden." }, { status: 404 });
    alert.status = body.status as AlertStatus;
    await speichereDaten(daten);
    return Response.json({ ok: true, alert });
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Alerts:", err);
    return Response.json({ fehler: "Alert konnte nicht aktualisiert werden." }, { status: 500 });
  }
}
