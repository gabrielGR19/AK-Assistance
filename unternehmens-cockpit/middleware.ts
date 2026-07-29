import { NextRequest, NextResponse } from "next/server";
import { cronSecretGueltig } from "./lib/cron-auth";
import { BENUTZER_HEADER, ENTWICKLUNG_COOKIE } from "./lib/benutzer";

// Reicht den authentifizierten Benutzernamen als Header an die Anwendung weiter, damit
// Server-Code weiß, WER schreibt (Kalender: jeder darf nur eigene Termine ändern).
// Ein vom Client mitgeschickter Header dieses Namens wird vorher gelöscht — sonst könnte
// sich jeder als der jeweils andere ausgeben.
function mitBenutzer(request: NextRequest, benutzer: string | null): NextResponse {
  const kopf = new Headers(request.headers);
  kopf.delete(BENUTZER_HEADER);
  if (benutzer) kopf.set(BENUTZER_HEADER, benutzer);
  return NextResponse.next({ request: { headers: kopf } });
}

// Pfade, die ein Crontab-Skript (statt eines Browsers) mit korrektem Cron-Secret-Header
// ohne Basic-Auth aufrufen darf — z.B. für periodischen Live-Refresh und Erinnerungs-Check.
const CRON_PFADE = ["/api/live/refresh", "/api/reminders", "/api/retell/kunden/freeze", "/api/alerts/scan", "/api/checks"];

// Basic-Auth-Schutz für das gesamte Cockpit. Aktiv nur, wenn COCKPIT_PASSWORT gesetzt ist —
// so bleibt die lokale Entwicklung ohne Passwort offen, die Produktion (mit gesetztem
// Passwort in .env.local) ist geschützt. Geprüft werden Benutzername UND Passwort;
// beide werden nur serverseitig gelesen, nie geloggt.
export function middleware(request: NextRequest) {
  const passwort = process.env.COCKPIT_PASSWORT;
  if (!passwort) {
    // In Produktion ist ein fehlendes Passwort ein Konfigurationsfehler, kein Freibrief.
    // Vorher galt hier derselbe Zweig wie lokal: ein pm2-Neustart ohne .env.local hätte das
    // gesamte Cockpit ohne Passwort geöffnet — und per Cookie hätte sich jeder als Moritz
    // ausgeben und in dessen Namen schreiben können. Lieber nicht erreichbar als offen.
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Cockpit ist nicht einsatzbereit: COCKPIT_PASSWORT fehlt.", { status: 503 });
    }
    // Ungeschützt (lokal). Identität kommt aus einem Cookie, damit sich der
    // Zwei-Personen-Betrieb in zwei Browserprofilen durchspielen lässt; ohne Cookie
    // ist man Gabriel.
    return mitBenutzer(request, request.cookies.get(ENTWICKLUNG_COOKIE)?.value ?? "gabriel");
  }

  const benutzernamen = (process.env.COCKPIT_BENUTZERNAMEN ?? "")
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter((n) => n.length > 0);

  // Server-zu-Server-Aufruf mit korrektem Secret: Basic-Auth für genau diese Routen umgehen.
  // Ohne COCKPIT_CRON_SECRET oder mit falschem/fehlendem Header ändert sich nichts am
  // bisherigen Verhalten (kein neues Loch).
  if (CRON_PFADE.includes(request.nextUrl.pathname) && cronSecretGueltig(request.headers.get("x-cockpit-cron-secret"))) {
    // Ohne Benutzer: ein Cronjob ist keine Person und darf im Kalender nichts schreiben.
    return mitBenutzer(request, null);
  }

  const kopf = request.headers.get("authorization");
  if (kopf?.startsWith("Basic ")) {
    try {
      const dekodiert = atob(kopf.slice(6)); // "benutzer:passwort"
      const idx = dekodiert.indexOf(":");
      const eingegebenerName = idx >= 0 ? dekodiert.slice(0, idx) : "";
      const eingegeben = idx >= 0 ? dekodiert.slice(idx + 1) : "";
      const nameGueltig = benutzernamen.includes(eingegebenerName.trim().toLowerCase());
      if (nameGueltig && eingegeben === passwort) return mitBenutzer(request, eingegebenerName.trim());
    } catch {
      // Kaputter Header → wie fehlende Auth behandeln (unten 401).
    }
  }

  return new NextResponse("Zugang nur mit Benutzername und Passwort.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AK Assistance Cockpit", charset="UTF-8"' },
  });
}

// Alles schützen außer Next.js-interne Assets (sonst wird der 401-Dialog vor dem Laden ausgelöst).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
