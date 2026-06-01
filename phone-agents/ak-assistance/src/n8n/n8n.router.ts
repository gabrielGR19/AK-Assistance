import { Router, type Request, type Response } from "express";
import { sendAppointmentConfirmation } from "../whatsapp/whatsapp.service";

export const n8nRouter = Router();

// n8n ruft diesen Endpoint auf, nachdem ein Termin im Kalender angelegt wurde
n8nRouter.post("/appointment-confirmed", async (req: Request, res: Response) => {
  const { customerPhone, appointmentDate, craftworkerName } = req.body;

  if (!customerPhone || !appointmentDate || !craftworkerName) {
    res.status(400).json({ error: "Fehlende Felder: customerPhone, appointmentDate, craftworkerName" });
    return;
  }

  await sendAppointmentConfirmation(customerPhone, appointmentDate, craftworkerName);
  res.status(200).json({ sent: true });
});
