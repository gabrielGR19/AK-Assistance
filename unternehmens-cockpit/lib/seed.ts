import { CockpitData, Dienst } from "./types";

// Erzeugt den Startbestand: die 7 bekannten Dienste, alle Kostenfelder LEER.
// Gabriel trägt Beträge, Kurs und Guthaben-Basis selbst ein — hier werden KEINE Zahlen erfunden.
// Währungs-Defaults nach üblicher Abrechnung des Anbieters; Gabriel kann sie jederzeit ändern.
export function seedDaten(): CockpitData {
  const jetzt = new Date().toISOString();

  // Setzt die vom System verwalteten Standardfelder; die fachlichen Felder kommen per Override.
  const dienst = (
    over: Pick<Dienst, "id" | "name" | "kategorie" | "abrechnungsmodell" | "waehrung"> &
      Partial<Dienst>,
  ): Dienst => ({
    inhaber: "",
    betrag: null,
    statusAmpel: "ok",
    naechsteFaelligkeit: null,
    notiz: "",
    herkunft: "manuell",
    letzteAenderung: jetzt,
    letzterAbruf: null,
    abrufStatus: null,
    ...over,
  });

  return {
    meta: { version: 1, eurUsdKurs: null, kursStand: null },
    dienste: [
      dienst({ id: "retell", name: "Retell.ai", kategorie: "Voice-Agent", abrechnungsmodell: "verbrauch", waehrung: "USD" }),
      dienst({ id: "hetzner", name: "Hetzner", kategorie: "Hosting", abrechnungsmodell: "monatlich", waehrung: "EUR", notiz: "Server für Website + n8n" }),
      dienst({ id: "ionos", name: "IONOS", kategorie: "Domain", abrechnungsmodell: "jaehrlich", waehrung: "EUR", notiz: "Domain ak-assistance.de" }),
      dienst({ id: "google-workspace", name: "Google Workspace", kategorie: "Produktivität", abrechnungsmodell: "monatlich", waehrung: "EUR", notiz: "Betrag pro Nutzer × 2 Nutzer eintragen" }),
      dienst({ id: "netlify", name: "Netlify", kategorie: "Hosting", abrechnungsmodell: "monatlich", waehrung: "USD", notiz: "Demo-Hosting" }),
      dienst({ id: "github", name: "GitHub", kategorie: "Versionierung", abrechnungsmodell: "monatlich", waehrung: "USD" }),
      dienst({
        id: "claude-api",
        name: "Anthropic / Claude API",
        kategorie: "KI/API",
        abrechnungsmodell: "verbrauch",
        waehrung: "USD",
        notiz: "Blog-Agent — kein Auto-Reload! Bei 0 stoppen die wöchentlichen Blogposts.",
        claude: {
          guthabenBasisUsd: null,
          guthabenBasisDatum: null,
          schwelleUsd: null,
          verbrauchSeitBasisUsd: null,
          restguthabenGeschaetztUsd: null,
        },
      }),
    ],
  };
}
