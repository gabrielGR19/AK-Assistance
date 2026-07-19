import { NextRequest } from "next/server";
import { cronSecretGueltig } from "@/lib/cron-auth";
import { holeOderFriereMonatEin } from "@/lib/kunden-verlauf";
import { monatsBereichMs } from "@/lib/monat";

// Vormonat als "YYYY-MM" (UTC), relativ zu jetzt.
function vormonat(): string {
  const jetzt = new Date();
  const d = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// POST /api/retell/kunden/freeze — friert den Vormonat als Kunden-Verbrauchs-Snapshot ein,
// falls das noch nicht geschehen ist. Idempotent, für täglichen Crontab-Aufruf gedacht
// (siehe scripts/kunden-freeze.sh) — so ist der Monat spätestens am Folgetag fest, auch
// wenn niemand zufällig das Cockpit aufruft. Server-zu-Server-Auth wie /api/live/refresh.
export async function POST(request: NextRequest) {
  if (!cronSecretGueltig(request.headers.get("x-cockpit-cron-secret"))) {
    return Response.json({ fehler: "Fehlendes oder falsches Cron-Secret." }, { status: 401 });
  }

  const monat = vormonat();
  const { vonMs, bisMs } = monatsBereichMs(monat);
  const ergebnis = await holeOderFriereMonatEin(monat, vonMs, bisMs);

  if (!ergebnis.ok) {
    return Response.json(
      { monat, fehler: ergebnis.fehler ?? "Abruf fehlgeschlagen.", keinKey: ergebnis.keinKey },
      { status: ergebnis.keinKey ? 400 : 502 },
    );
  }

  return Response.json({
    monat,
    status: ergebnis.neuEingefroren ? "eingefroren" : "war bereits eingefroren",
    anzahlKunden: ergebnis.kunden.length,
  });
}
