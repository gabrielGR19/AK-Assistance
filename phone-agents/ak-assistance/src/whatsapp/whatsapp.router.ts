import { Router, type Request, type Response } from "express";

export const whatsappRouter = Router();

// Webhook-Verifizierung von Meta (einmalig bei Setup)
whatsappRouter.get("/", (req: Request, res: Response) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "ak-assistance-verify";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WhatsApp Webhook verifiziert");
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Forbidden");
  }
});

// Eingehende WhatsApp-Nachrichten (für zukünftige Interaktionen)
whatsappRouter.post("/", async (req: Request, res: Response) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      console.log(`📨 WhatsApp-Nachricht empfangen von ${message.from}: ${message.text?.body}`);
      // TODO: Antwortlogik für eingehende WhatsApp-Nachrichten
    }
  }

  res.status(200).json({ status: "ok" });
});
