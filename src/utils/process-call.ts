import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TEST_TRANSCRIPT =
  "Hallo, ich bin Thomas Müller, meine Heizung ist kaputt und läuft nicht mehr an. " +
  "Ich brauche jemanden am Donnerstag zwischen 10 und 12 Uhr. " +
  "Meine Adresse ist Musterstraße 5 in Berlin, Postleitzahl 10115.";

// ─── Subagent-Definitionen ────────────────────────────────────────────────────

async function extractCallData(transcript: string): Promise<ExtractedData> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system:
      "Du extrahierst strukturierte Daten aus Anruf-Transkripten für Handwerksbetriebe. " +
      "Antworte ausschließlich mit validem JSON, ohne Markdown-Blöcke.",
    messages: [
      {
        role: "user",
        content:
          `Extrahiere folgende Felder aus dem Transkript und gib sie als JSON zurück:\n` +
          `- name (string | null)\n` +
          `- problem (string | null)\n` +
          `- wunschtermin (string | null)\n` +
          `- adresse (string | null)\n` +
          `- plz (string | null)\n` +
          `- stadt (string | null)\n\n` +
          `Transkript:\n"${transcript}"`,
      },
    ],
  });

  const text = extractText(response);
  return JSON.parse(text) as ExtractedData;
}

async function writeWhatsAppMessage(transcript: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system:
      "Du schreibst WhatsApp-Nachrichten für Handwerker. " +
      "Der Ton ist professionell, klar und knapp. Benutze sparsam Emojis. " +
      "Antworte nur mit dem Nachrichtentext, ohne Anführungszeichen oder Erklärungen.",
    messages: [
      {
        role: "user",
        content:
          `Schreibe eine WhatsApp-Benachrichtigung an den Handwerker über diesen Kundenanruf. ` +
          `Fasse die wichtigsten Infos zusammen: Kundenname, Problem, Wunschtermin, Adresse.\n\n` +
          `Transkript:\n"${transcript}"`,
      },
    ],
  });

  return extractText(response);
}

async function buildAirtableRecord(transcript: string): Promise<AirtableRecord> {
  const now = new Date().toISOString();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system:
      "Du erstellst Airtable-Einträge aus Anruf-Transkripten für Handwerksbetriebe. " +
      "Antworte ausschließlich mit validem JSON, ohne Markdown-Blöcke.",
    messages: [
      {
        role: "user",
        content:
          `Erstelle einen Airtable-Eintrag als JSON mit diesen Feldern:\n` +
          `- Status (string): immer "Neu"\n` +
          `- Kundenname (string | null)\n` +
          `- Problem (string | null): kurze Beschreibung\n` +
          `- Priorität (string): "Hoch", "Mittel" oder "Niedrig" je nach Dringlichkeit\n` +
          `- Wunschtermin (string | null)\n` +
          `- Adresse (string | null): vollständige Adresse\n` +
          `- Notizen (string): alle weiteren relevanten Infos aus dem Transkript\n` +
          `- Erstellt_Am (string): "${now}"\n\n` +
          `Transkript:\n"${transcript}"`,
      },
    ],
  });

  const text = extractText(response);
  return JSON.parse(text) as AirtableRecord;
}

// ─── Typen ───────────────────────────────────────────────────────────────────

interface ExtractedData {
  name: string | null;
  problem: string | null;
  wunschtermin: string | null;
  adresse: string | null;
  plz: string | null;
  stadt: string | null;
}

interface AirtableRecord {
  Status: string;
  Kundenname: string | null;
  Problem: string | null;
  Priorität: string;
  Wunschtermin: string | null;
  Adresse: string | null;
  Notizen: string;
  Erstellt_Am: string;
}

interface ProcessedCall {
  transcript: string;
  extractedData: ExtractedData;
  whatsappMessage: string;
  airtableRecord: AirtableRecord;
  durationMs: number;
}

// ─── Hilfsfunktion ───────────────────────────────────────────────────────────

function extractText(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unerwarteter Antworttyp");
  return block.text.trim();
}

// ─── Hauptfunktion ───────────────────────────────────────────────────────────

export async function processCallTranscript(transcript: string): Promise<ProcessedCall> {
  const start = Date.now();

  console.log("⚡ Starte 3 Subagents parallel...\n");

  const [extractedData, whatsappMessage, airtableRecord] = await Promise.all([
    extractCallData(transcript).then((r) => { console.log("✅ Subagent 1 fertig: Datenextraktion"); return r; }),
    writeWhatsAppMessage(transcript).then((r) => { console.log("✅ Subagent 2 fertig: WhatsApp-Nachricht"); return r; }),
    buildAirtableRecord(transcript).then((r) => { console.log("✅ Subagent 3 fertig: Airtable-Eintrag"); return r; }),
  ]);

  return {
    transcript,
    extractedData,
    whatsappMessage,
    airtableRecord,
    durationMs: Date.now() - start,
  };
}

// ─── CLI-Ausführung ──────────────────────────────────────────────────────────

async function main() {
  const transcript = process.argv[2] ?? TEST_TRANSCRIPT;

  console.log("━".repeat(60));
  console.log("📞 AK-Assistance — Transkript-Verarbeitung");
  console.log("━".repeat(60));
  console.log(`\n📄 Transkript:\n"${transcript}"\n`);

  const result = await processCallTranscript(transcript);

  console.log("\n" + "━".repeat(60));
  console.log("📊 ERGEBNISSE");
  console.log("━".repeat(60));

  console.log("\n🔍 Extrahierte Daten:");
  console.log(JSON.stringify(result.extractedData, null, 2));

  console.log("\n💬 WhatsApp-Nachricht:");
  console.log(result.whatsappMessage);

  console.log("\n🗃️  Airtable-Eintrag:");
  console.log(JSON.stringify(result.airtableRecord, null, 2));

  console.log(`\n⏱️  Gesamtdauer: ${result.durationMs}ms`);
  console.log("━".repeat(60));
}

main().catch((err) => {
  console.error("❌ Fehler:", err);
  process.exit(1);
});
