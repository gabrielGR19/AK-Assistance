import { Router } from "express";
import { db, newsletterSubscribersTable } from "@workspace/db";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/newsletter", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: "Bitte geben Sie eine gültige E-Mail-Adresse ein." });
    return;
  }

  try {
    await db
      .insert(newsletterSubscribersTable)
      .values({ email })
      .onConflictDoNothing();
    req.log.info({ email }, "Newsletter-Anmeldung gespeichert");
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Fehler beim Speichern der Newsletter-Anmeldung");
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export default router;
