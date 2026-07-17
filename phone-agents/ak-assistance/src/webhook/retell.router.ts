import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { config } from "../config";
import { handleCallStarted, handleCallEnded } from "./retell.handler";
import type { RetellWebhookEvent } from "./retell.types";

export const retellRouter = Router();

function verifyRetellSignature(req: Request): boolean {
  const signature = req.headers["x-retell-signature"] as string;
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", config.RETELL_WEBHOOK_SECRET);
  hmac.update(JSON.stringify(req.body));
  const expected = hmac.digest("hex");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  // timingSafeEqual wirft bei unterschiedlicher Länge — Längen vorher prüfen,
  // damit der Handler nie eine unbehandelte Exception auslöst.
  if (signatureBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

retellRouter.post("/", async (req: Request, res: Response) => {
  if (!verifyRetellSignature(req)) {
    console.warn("⚠️ Ungültige Retell-Signatur");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const event = req.body as RetellWebhookEvent;

  // Sofort 200 antworten — Retell erwartet schnelle Antwort
  res.status(200).json({ received: true });

  try {
    switch (event.event) {
      case "call_started":
        await handleCallStarted(event);
        break;
      case "call_ended":
        await handleCallEnded(event);
        break;
      default:
        console.log(`Unbekanntes Event: ${(event as RetellWebhookEvent).event}`);
    }
  } catch (err) {
    console.error("Fehler bei Webhook-Verarbeitung:", err);
  }
});
