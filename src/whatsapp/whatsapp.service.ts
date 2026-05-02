import axios from "axios";
import { config } from "../config";
import type { CallSummaryData, WhatsAppTextMessage } from "./whatsapp.types";

const GRAPH_API_URL = `https://graph.facebook.com/v19.0/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;

async function sendMessage(payload: WhatsAppTextMessage): Promise<void> {
  await axios.post(GRAPH_API_URL, payload, {
    headers: {
      Authorization: `Bearer ${config.WHATSAPP_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}

export async function sendWhatsAppSummary(data: CallSummaryData): Promise<void> {
  const appointmentLine = data.appointmentRequested
    ? `\n📅 *Terminwunsch:* ${data.appointmentDate ?? "nicht spezifiziert"}`
    : "";

  const message = `📞 *Neuer Anruf eingegangen*

👤 *Kunde:* ${data.customerName ?? "Unbekannt"}
📱 *Telefon:* ${data.customerPhone}

📝 *Zusammenfassung:*
${data.summary}${appointmentLine}

_Automatisch erstellt von AK-Assistance_`;

  await sendMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: data.craftworkerPhone,
    type: "text",
    text: { body: message },
  });

  console.log(`✅ WhatsApp-Zusammenfassung gesendet an ${data.craftworkerPhone}`);
}

export async function sendAppointmentConfirmation(
  customerPhone: string,
  date: string,
  craftworkerName: string
): Promise<void> {
  const message = `Hallo! Ihr Termin mit *${craftworkerName}* wurde für *${date}* bestätigt. Bei Fragen antworten Sie einfach auf diese Nachricht. — AK-Assistance`;

  await sendMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: customerPhone,
    type: "text",
    text: { body: message },
  });
}
