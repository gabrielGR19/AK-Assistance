import { Router } from "express";

const router = Router();

const RETELL_API_KEY = process.env.RETELL_API_KEY || "";
const AGENT_ID = process.env.RETELL_AGENT_ID || "agent_60ad635e387246bfcdc4d4fda9";

router.post("/create-call", async (req, res) => {
  if (!RETELL_API_KEY || !AGENT_ID) {
    req.log.error("Retell API key or Agent ID not configured");
    res.status(500).json({ error: "Demo nicht konfiguriert" });
    return;
  }

  try {
    const response = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RETELL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agent_id: AGENT_ID }),
    });

    if (!response.ok) {
      const error = await response.text();
      req.log.error({ status: response.status, error }, "Retell API Fehler");
      res.status(response.status).json({ error: "Retell API Fehler" });
      return;
    }

    const data = (await response.json()) as { access_token: string };
    res.json({ access_token: data.access_token });
  } catch (err) {
    req.log.error({ err }, "create-call fehlgeschlagen");
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export default router;
