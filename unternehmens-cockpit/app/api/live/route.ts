import { LIVE_PROVIDER } from "@/lib/live/registry";

// GET /api/live — Liste der Dienst-IDs mit registriertem Live-Provider.
// Unabhängig vom Dienste-Payload abrufbar, damit der Live-Button im Frontend auch nach
// anderen Aktionen (Bearbeiten, Löschen, Kurs speichern) korrekt sichtbar bleibt.
export async function GET() {
  return Response.json({ ids: LIVE_PROVIDER.map((p) => p.dienstId) });
}
