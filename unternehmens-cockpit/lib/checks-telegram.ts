import type { Warnung } from "@/lib/checks";

// Telegram-Push für Kosten-/Fälligkeits-Warnungen — nur "hoch", "mittel" bleibt bewusst
// nur im Dashboard/Report sichtbar. Kein Dedup/State (anders als lib/alerts.ts): bei
// täglichem Takt ist eine tägliche Wiederholung einer unbehobenen "hoch"-Warnung gewollt.
export async function sendeTelegramFuerWarnungen(warnungen: Warnung[]): Promise<void> {
  const hoch = warnungen.filter((w) => w.schwere === "hoch");
  if (hoch.length === 0) return;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const zeilen = hoch.map((w) => `— [${w.dienstName}] ${w.titel}`);
  const text = `💸 Kosten-Alarm (${hoch.length} kritisch):\n${zeilen.join("\n")}\n\nDetails: https://cockpit.ak-assistance.de/report`;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Telegram-Ausfall darf den Check nicht scheitern lassen.
  }
}
