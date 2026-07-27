import type { PersonId } from "./kalender-typen";
import { istPerson } from "./kalender-typen";

// Header, unter dem die Middleware den authentifizierten Benutzernamen an die Anwendung
// weiterreicht. Die Middleware LÖSCHT einen eventuell mitgeschickten gleichnamigen Header
// des Clients, bevor sie ihren eigenen setzt — der Wert ist deshalb serverseitig
// vertrauenswürdig und kann nicht gefälscht werden.
export const BENUTZER_HEADER = "x-cockpit-benutzer";

// Cookie, mit dem sich NUR in der lokalen Entwicklung (ohne COCKPIT_PASSWORT) die
// Identität umschalten lässt. Ohne dieses Ventil ließe sich der Zwei-Personen-Betrieb
// lokal gar nicht durchspielen, weil es dann keinen Basic-Auth-Dialog gibt.
// In Produktion (Passwort gesetzt) wird das Cookie ignoriert.
export const ENTWICKLUNG_COOKIE = "cockpit-dev-benutzer";

// Bildet einen Basic-Auth-Benutzernamen auf eine Person des Kalenders ab.
// Unbekannte Namen ergeben null — sie dürfen das Cockpit sehen, aber nicht im
// Kalender schreiben.
export function personAusBenutzername(name: string | null | undefined): PersonId | null {
  const k = (name ?? "").trim().toLowerCase();
  return istPerson(k) ? k : null;
}

// Liest die Person aus den Request-Headern. Einzige zulässige Quelle für "wer schreibt hier".
export function personAusHeadern(headers: Headers): PersonId | null {
  return personAusBenutzername(headers.get(BENUTZER_HEADER));
}
