import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";

const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Du bist ein freundlicher KI-Assistent für einen Handwerksbetrieb.
Deine Aufgaben:
- Kundenanfragen professionell entgegennehmen
- Termine vereinbaren
- Häufige Fragen zum Betrieb beantworten
- Wichtige Informationen (Name, Telefon, Anliegen) erfassen

Antworte immer auf Deutsch, höflich und klar. Halte Antworten kurz (max. 2-3 Sätze),
da du per Telefon sprichst.`;

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getAgentResponse(
  messages: ConversationMessage[],
  systemContext?: string
): Promise<string> {
  const systemPrompt = systemContext
    ? `${SYSTEM_PROMPT}\n\nBetriebsinformationen:\n${systemContext}`
    : SYSTEM_PROMPT;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: systemPrompt,
    messages,
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unerwarteter Antworttyp von Claude");

  return content.text;
}

export async function summarizeCall(transcript: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: "Du bist ein Assistent der Telefonanrufe für Handwerksbetriebe zusammenfasst.",
    messages: [
      {
        role: "user",
        content: `Fasse diesen Anruf kurz zusammen. Extrahiere: Kundenname, Telefonnummer, Anliegen, gewünschter Termin (falls genannt). Antworte auf Deutsch.\n\nTranskript:\n${transcript}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unerwarteter Antworttyp von Claude");

  return content.text;
}
