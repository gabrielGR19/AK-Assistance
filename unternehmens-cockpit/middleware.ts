import { NextRequest, NextResponse } from "next/server";
import { cronSecretGueltig } from "./lib/cron-auth";

// Pfade, die ein Crontab-Skript (statt eines Browsers) mit korrektem Cron-Secret-Header
// ohne Basic-Auth aufrufen darf — z.B. für periodischen Live-Refresh und Erinnerungs-Check.
const CRON_PFADE = ["/api/live/refresh", "/api/reminders"];

// Basic-Auth-Schutz für das gesamte Cockpit. Aktiv nur, wenn COCKPIT_PASSWORT gesetzt ist —
// so bleibt die lokale Entwicklung ohne Passwort offen, die Produktion (mit gesetztem
// Passwort in .env.local) ist geschützt. Passwort wird nur serverseitig gelesen, nie geloggt.
export function middleware(request: NextRequest) {
  const passwort = process.env.COCKPIT_PASSWORT;
  if (!passwort) return NextResponse.next(); // ungeschützt (lokal)

  // Server-zu-Server-Aufruf mit korrektem Secret: Basic-Auth für genau diese Routen umgehen.
  // Ohne COCKPIT_CRON_SECRET oder mit falschem/fehlendem Header ändert sich nichts am
  // bisherigen Verhalten (kein neues Loch).
  if (CRON_PFADE.includes(request.nextUrl.pathname) && cronSecretGueltig(request.headers.get("x-cockpit-cron-secret"))) {
    return NextResponse.next();
  }

  const kopf = request.headers.get("authorization");
  if (kopf?.startsWith("Basic ")) {
    try {
      const dekodiert = atob(kopf.slice(6)); // "benutzer:passwort"
      const idx = dekodiert.indexOf(":");
      const eingegeben = idx >= 0 ? dekodiert.slice(idx + 1) : "";
      if (eingegeben === passwort) return NextResponse.next();
    } catch {
      // Kaputter Header → wie fehlende Auth behandeln (unten 401).
    }
  }

  return new NextResponse("Zugang nur mit Passwort.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AK Assistance Cockpit", charset="UTF-8"' },
  });
}

// Alles schützen außer Next.js-interne Assets (sonst wird der 401-Dialog vor dem Laden ausgelöst).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
