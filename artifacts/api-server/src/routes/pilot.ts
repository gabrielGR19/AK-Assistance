import { Router } from "express";
import { db, pilotApplicationsTable } from "@workspace/db";
import { insertPilotApplicationSchema } from "@workspace/db";
import { appendPilotApplication } from "../google-sheets";

const router = Router();

router.post("/pilot", async (req, res) => {
  const parsed = insertPilotApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Eingabe", details: parsed.error.issues });
    return;
  }

  try {
    const [row] = await db
      .insert(pilotApplicationsTable)
      .values(parsed.data)
      .returning();
    req.log.info({ id: row.id, company: row.company }, "Pilot-Bewerbung gespeichert");

    // Sync to Google Sheets (non-blocking — don't fail the request if Sheets is unavailable)
    appendPilotApplication(row).catch((err) => {
      req.log.warn({ err }, "Google Sheets sync fehlgeschlagen");
    });

    res.status(201).json({ success: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Fehler beim Speichern der Pilot-Bewerbung");
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

router.get("/pilot", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(pilotApplicationsTable)
      .orderBy(pilotApplicationsTable.createdAt);
    res.json({ applications: rows });
  } catch (err) {
    req.log.error({ err }, "Fehler beim Abrufen der Pilot-Bewerbungen");
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

export default router;
