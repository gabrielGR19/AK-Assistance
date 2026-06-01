import axios from "axios";
import { config } from "../config";

type WorkflowTrigger = "call-started" | "call-ended" | "appointment-requested";

export async function triggerN8nWorkflow(
  trigger: WorkflowTrigger,
  payload: Record<string, unknown>
): Promise<void> {
  const url = `${config.N8N_WEBHOOK_URL}/${trigger}`;

  try {
    await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(config.N8N_API_KEY && { "X-N8N-API-KEY": config.N8N_API_KEY }),
      },
      timeout: 5000,
    });

    console.log(`🔄 n8n Workflow "${trigger}" ausgelöst`);
  } catch (err) {
    // n8n-Fehler dürfen den Hauptablauf nicht blockieren
    console.error(`⚠️ n8n Workflow "${trigger}" fehlgeschlagen:`, err);
  }
}
