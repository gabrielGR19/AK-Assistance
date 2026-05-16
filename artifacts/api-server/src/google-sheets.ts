import { ReplitConnectors } from "@replit/connectors-sdk";

const SPREADSHEET_ID = "1plzSJN7aQ2g69eLuoxMY9H8fSgvvdWQljqQqhW80I1Q";
const SHEET_NAME = "Bewerbungen";

export async function appendPilotApplication(application: {
  id: number;
  company: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
}): Promise<void> {
  const connectors = new ReplitConnectors();

  const row = [
    application.id.toString(),
    application.company,
    application.name,
    application.email,
    application.phone,
    application.createdAt.toLocaleString("de-DE", { timeZone: "Europe/Berlin" }),
  ];

  const response = await connectors.proxy(
    "google-sheet",
    `/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Sheets append failed: ${response.status} ${text}`);
  }
}
