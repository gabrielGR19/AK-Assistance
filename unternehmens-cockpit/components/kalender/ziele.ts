// Ziel, Meilensteine und Miniziel — Inhalte unverändert aus dem Prototyp
// (planung/arbeitskalender.html) und der Arbeitsgrundlage planung/plan_27-07_bis_06-08.md.
//
// Bewusst als Konstante im Code und nicht in data/kalender.json: das Ziel bis 30.09.2026
// steht fest, es wird nicht im Kalender bearbeitet. Ändert sich der Plan, ändert sich diese
// Datei — nachvollziehbar in der Versionsgeschichte.

export const ZIEL_DATUM = "30.09.";

export const ZIEL_SATZ =
  "Am 30. September 2026 haben wir AK Assistance vollständig angemeldet und rechtlich sauber aufgestellt.";

export const ZIEL_ZUSTAENDE = [
  "Gewerbeschein der Stadt Nürnberg liegt vor",
  "Gesellschaftsvertrag der eGbR unterschrieben — Gewinnverteilung und Ausstieg geregelt",
  "Eintragung der eGbR vollzogen oder beantragt, Notarfrage geklärt",
  "Fragebogen zur steuerlichen Erfassung eingereicht, Kleinunternehmer- und Besteuerungsart bewusst entschieden",
  "Kammerzugehörigkeit (IHK oder HWK) gemeldet",
  "Geschäftskonto auf die Gesellschaft eröffnet",
  "Kundenvertrag mit Haftungsbeschränkung anwaltlich geprüft",
  "Datenschutzpaket steht: AVV, Datenschutzerklärung, Kundenerfassungsbogen",
  "Alle sieben To-Dos aus dem Pöll-Gespräch abgehakt",
  "Zweites Pöll-Gespräch geführt, Aufbau bestätigt",
];

export const ZIEL_NACHSATZ =
  "Danach müssen wir nur noch verkaufen — und erst dann bauen wir den Jahresplan.";

export interface Meilenstein {
  kw: string;
  von: string; // "YYYY-MM-DD"
  bis: string; // "YYYY-MM-DD", einschließlich
  text: string;
}

export const MEILENSTEINE: Meilenstein[] = [
  {
    kw: "KW 31",
    von: "2026-07-27",
    bis: "2026-08-02",
    text: "Arbeitsteilung mit Moritz · To-Do 3 (WZ-Code) · To-Do 1 (Haftungsszenarien) · To-Do 2 begonnen · erster Retell-Klon",
  },
  {
    kw: "KW 32",
    von: "2026-08-03",
    bis: "2026-08-06",
    text: "To-Do 5 (Fragebogen) · To-Do 6 (Lexoffice) · Fragenliste To-Do 4 · Übergabe an Moritz · Klon-Workflow beherrscht",
  },
  { kw: "KW 33–34", von: "2026-08-07", bis: "2026-08-21", text: "Urlaub. Bewusst kein Meilenstein." },
  {
    kw: "KW 35",
    von: "2026-08-24",
    bis: "2026-08-30",
    text: "Notarpflicht geklärt · Anwalt + Steuerberater ausgewählt, Termine gebucht · Pöll-Termin 2 terminiert",
  },
  {
    kw: "KW 36",
    von: "2026-08-31",
    bis: "2026-09-06",
    text: "Gewerbeanmeldung Stadt Nürnberg · Gesellschaftsvertrag unterschriftsreif",
  },
  { kw: "KW 37", von: "2026-09-07", bis: "2026-09-13", text: "Notartermin, Registeranmeldung eGbR · Gewerbeschein da" },
  {
    kw: "KW 38",
    von: "2026-09-14",
    bis: "2026-09-20",
    text: "Fragebogen eingereicht · Anwaltstermin Kundenvertrag + Haftungsbeschränkung",
  },
  {
    kw: "KW 39",
    von: "2026-09-21",
    bis: "2026-09-27",
    text: "Geschäftskonto eröffnet · Kammermeldung · Datenschutzpaket final",
  },
  { kw: "KW 40", von: "2026-09-28", bis: "2026-09-30", text: "Ziel erreicht. Zweiter Pöll-Termin: Bestätigung." },
];

export const MEILENSTEIN_HINWEIS =
  "Notar- und Anwaltstermine haben im September 2–3 Wochen Vorlauf. Deshalb steht das Buchen in KW 35, nicht erst wenn sie fällig sind.";

// Miniziel: jeder Tag bis zur Abreise wird durchgezogen. Läuft das Enddatum ab, blendet
// sich die Leiste von selbst aus.
export const MINIZIEL_VON = "2026-07-27";
export const MINIZIEL_BIS = "2026-08-06";
export const MINIZIEL_LABEL = "Bis zur Abreise";
export const MINIZIEL_SATZ = "Was ich mir für einen Tag vornehme, mache ich an dem Tag.";
export const MINIZIEL_FERTIG = "Alle elf Tage durchgezogen. Miniziel erreicht.";
