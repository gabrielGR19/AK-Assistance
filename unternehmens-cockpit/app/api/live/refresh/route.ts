import { ladeDaten } from "@/lib/db";
import { fuehreLiveAbrufAus } from "@/lib/live/runner";
import { LIVE_PROVIDER } from "@/lib/live/registry";
import { cronSecretGueltig } from "@/lib/cron-auth";

// POST /api/live/refresh — läuft über alle registrierten Live-Provider und aktualisiert
// jeden zugehörigen Dienst. Nur für den periodischen Aufruf durch das Crontab-Skript
// (kein manueller Browser-Anwendungsfall) — daher hartes Cron-Secret statt Basic-Auth.
export async function POST(request: Request) {
  if (!cronSecretGueltig(request.headers.get("x-cockpit-cron-secret"))) {
    return Response.json({ fehler: "Ungültiges oder fehlendes Cron-Secret." }, { status: 401 });
  }

  try {
    const daten = await ladeDaten();
    const ergebnisse: Record<string, unknown> = {};

    for (const provider of LIVE_PROVIDER) {
      const d = daten.dienste.find((x) => x.id === provider.dienstId);
      if (!d) continue;
      const ergebnis = await fuehreLiveAbrufAus(daten, d, provider);
      ergebnisse[provider.dienstId] = ergebnis.typ === "voraussetzung_fehlt" ? { fehler: ergebnis.fehler } : ergebnis.live;
    }

    return Response.json({ ergebnisse });
  } catch (err) {
    console.error("Fehler beim gesammelten Live-Refresh:", err);
    return Response.json({ fehler: "Live-Refresh fehlgeschlagen." }, { status: 500 });
  }
}
