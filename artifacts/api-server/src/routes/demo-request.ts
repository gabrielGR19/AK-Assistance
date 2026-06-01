import { Router } from "express";

const router = Router();

router.post("/demo-request", (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Ungültige E-Mail-Adresse." });
    return;
  }

  // TODO: n8n Webhook URL hier eintragen wenn bereit
  // Trigger: POST an n8n → n8n verschickt HTML-E-Mail mit Demo-Link:
  //   https://ak-assistance-feedback.netlify.app
  req.log.info({ email }, "Demo request received");

  res.json({ success: true });
});

export default router;
