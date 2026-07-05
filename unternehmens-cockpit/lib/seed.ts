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
      // Recherche 2026-07-05: Hetzner Cloud API liefert nur Listenpreise pro Ressourcentyp
      // (z.B. GET /v1/server_types), keine tatsächliche Rechnungssumme. Live wäre nur eine
      // Schätzung ("aktive Ressourcen × Listenpreis") — bei einem einzigen Server fragwürdiger
      // Mehrwert gegenüber der Komplexität. Bleibt manuell.
      dienst({ id: "hetzner", name: "Hetzner", kategorie: "Hosting", abrechnungsmodell: "monatlich", waehrung: "EUR", notiz: "Server für Website + n8n" }),
      // Recherche 2026-07-05: IONOS Billing API (/invoices, Cost & Usage) existiert, gehört
      // aber zum IONOS-Cloud-Produkt. Dieser Dienst ist eine reine Domain-Registrierung, keine
      // Cloud-Ressource — unklar, ob die API dafür überhaupt einen Contract liefert. Bleibt manuell.
      dienst({ id: "ionos", name: "IONOS", kategorie: "Domain", abrechnungsmodell: "jaehrlich", waehrung: "EUR", notiz: "Domain ak-assistance.de" }),
      // Recherche 2026-07-05: Kosten für Workspace-Subscriptions sind nur über die Google
      // Reseller-API abrufbar — die gilt für Reseller, die IHRE Kunden verwalten, nicht für
      // einen Direktkunden, der die eigene Rechnung abfragt. Kein Live-Abruf möglich. Bleibt manuell.
      dienst({ id: "google-workspace", name: "Google Workspace", kategorie: "Produktivität", abrechnungsmodell: "monatlich", waehrung: "EUR", notiz: "Betrag pro Nutzer × 2 Nutzer eintragen" }),
      // Recherche 2026-07-05: Keine öffentliche Netlify-API für Bandwidth/Build-Minuten/Kosten
      // gefunden (auch nicht im offiziellen OpenAPI-Spec) — mehrfach von Nutzern im Netlify-
      // Forum nachgefragt, ohne Ergebnis. Bleibt manuell.
      dienst({ id: "netlify", name: "Netlify", kategorie: "Hosting", abrechnungsmodell: "monatlich", waehrung: "USD", notiz: "Demo-Hosting" }),
      // Recherche 2026-07-05: GitHub Billing-Usage-API existiert (/users/{user}/settings/
      // billing/usage), ist aber laut Doku nur für Accounts mit Zugriff auf die "enhanced
      // billing platform" verfügbar — bei einem persönlichen Free/Pro-Account unklar. Nicht
      // ohne echten PAT testbar (keiner hinterlegt). Einziger Kandidat mit Aussicht auf Live —
      // Spike ausstehend, sobald ein PAT mit Billing-Leserechten vorliegt.
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
