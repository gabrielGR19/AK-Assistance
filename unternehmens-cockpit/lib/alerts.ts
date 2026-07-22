// Kernlogik der Voice-Agent-Überwachung: wertet Retell-Calls und n8n-Fehler-Executions
// aus und erzeugt gebündelte Alerts. Reine Datenlogik nach dem Vorbild von checks.ts —
// API-Route, Cron-Scan und Telegram nutzen exakt dieselben Funktionen.

import { holeAlleCallsImZeitraum } from "./retell";
import type { Alert, AlertSchwere, CockpitData } from "./types";
import {
  BUENDEL_FENSTER_MS,
  KURZ_CALL_MS,
  LOG_MIN_DAUER_MS,
  LOG_PFLICHT_AGENT_IDS,
  SCAN_UEBERLAPPUNG_MS,
  WORKFLOW_ZU_AGENT,
  buchungsfensterFuer,
} from "./alerts-config";

// ---------- Rohdaten-Formen (defensiv getypt, Retell/n8n liefern unknown) ----------

interface RetellToolCall {
  name?: string;
  arguments?: string | Record<string, unknown>;
  result?: unknown;
  error?: unknown;
  successful?: boolean;
}

interface RetellCall {
  call_id?: string;
  agent_id?: string;
  agent_name?: string;
  call_status?: string;
  disconnection_reason?: string;
  duration_ms?: number;
  start_timestamp?: number;
  transcript?: string;
  tool_calls?: RetellToolCall[];
  public_log_url?: string;
  call_analysis?: {
    user_sentiment?: string;
    call_successful?: boolean;
    in_voicemail?: boolean;
    call_summary?: string;
  };
}

interface N8nExecution {
  id?: number | string;
  workflowId?: string;
  startedAt?: string;
  status?: string;
}

// Ein noch ungebündelter Befund aus der Auswertung.
interface Befund {
  agentId: string;
  agentName: string;
  callId: string | null;
  n8nExecutionId: string | null;
  kategorie: string;
  schwere: AlertSchwere;
  titel: string;
  detail: string;
  publicLogUrl: string | null;
  n8nUrl: string | null;
  ursache: string; // normalisierter Schlüssel für den Bündel-Fingerprint
  aufgetretenMs: number;
}

// ---------- Hilfsfunktionen ----------

function argumenteAlsObjekt(tc: RetellToolCall): Record<string, unknown> {
  if (tc.arguments && typeof tc.arguments === "object") return tc.arguments as Record<string, unknown>;
  if (typeof tc.arguments === "string") {
    try {
      return JSON.parse(tc.arguments) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function resultAlsText(tc: RetellToolCall): string {
  const r = tc.result ?? tc.error;
  if (r == null) return "";
  return typeof r === "string" ? r : JSON.stringify(r);
}

// Ein Tool-Call gilt als fehlgeschlagen, wenn Retell einen Fehler meldet oder die
// n8n-Antwort erkennbar ein Fehler-/Timeout-Ergebnis ist. slot_unavailable und
// already_booked sind fachlich normale Antworten, keine Fehler.
function toolCallFehlgeschlagen(tc: RetellToolCall): string | null {
  if (tc.successful === false) return "vom System als fehlgeschlagen markiert";
  if (tc.error != null) return resultAlsText(tc).slice(0, 200) || "Fehler ohne Details";
  const text = resultAlsText(tc).toLowerCase();
  if (!text) return null;
  if (text.includes("slot_unavailable") || text.includes("already_booked")) return null;
  if (
    text.includes('"status":"error"') ||
    text.includes("timed out") ||
    text.includes("timeout") ||
    text.includes("econnrefused") ||
    text.includes("internal server error") ||
    text.includes("http 5")
  ) {
    return resultAlsText(tc).slice(0, 200);
  }
  return null;
}

// disconnection_reason-Werte, die auf einen technischen Abbruch hindeuten.
function abbruchFehler(reason: string | undefined): string | null {
  if (!reason) return null;
  const schlecht = new Set([
    "call_transfer_failed",
    "dial_failed",
    "dial_busy",
    "invalid_destination",
    "concurrency_limit_reached",
    "no_valid_payment",
    "scam_detected",
  ]);
  if (schlecht.has(reason) || reason.includes("error")) return reason;
  return null;
}

function neueAlertId(): string {
  return `al_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Auswertung eines einzelnen Retell-Calls ----------

function befundeFuerCall(call: RetellCall): Befund[] {
  const befunde: Befund[] = [];
  if (!call.agent_id || !call.call_id) return befunde;
  if (call.call_status && call.call_status !== "ended" && call.call_status !== "error") return befunde; // laufende Calls überspringen

  const basis = {
    agentId: call.agent_id,
    agentName: call.agent_name || call.agent_id,
    callId: call.call_id,
    n8nExecutionId: null,
    publicLogUrl: call.public_log_url ?? null,
    n8nUrl: null,
    aufgetretenMs: call.start_timestamp ?? Date.now(),
  };
  const dauer = call.duration_ms ?? 0;
  const analyse = call.call_analysis ?? {};
  const toolCalls = Array.isArray(call.tool_calls) ? call.tool_calls : [];

  // 🔴 Tool-Call fehlgeschlagen
  for (const tc of toolCalls) {
    const fehler = toolCallFehlgeschlagen(tc);
    if (fehler) {
      befunde.push({
        ...basis,
        kategorie: "tool-fehler",
        schwere: "hoch",
        titel: `Tool-Call „${tc.name ?? "unbekannt"}" fehlgeschlagen`,
        detail: fehler,
        ursache: `tool:${tc.name ?? "unbekannt"}`,
      });
    }
  }

  // 🔴 Technischer Verbindungsabbruch
  const abbruch = abbruchFehler(call.disconnection_reason);
  if (abbruch || call.call_status === "error") {
    befunde.push({
      ...basis,
      kategorie: "verbindungsabbruch",
      schwere: "hoch",
      titel: "Call technisch abgebrochen",
      detail: `disconnection_reason: ${call.disconnection_reason ?? "unbekannt"}, status: ${call.call_status ?? "?"}`,
      ursache: `abbruch:${call.disconnection_reason ?? call.call_status ?? "?"}`,
    });
  }

  // 🔴 Pflicht-log_call fehlte (nur bei Agenten, deren Flow das vorsieht)
  // Auflegen des Anrufers wird seit dem Call-Ende-Sicherheitsnetz (n8n-Webhook
  // retell-call-ended) automatisch protokolliert — nur reguläre Gesprächsenden
  // ohne log_call sind noch ein echter Fehler.
  if (
    LOG_PFLICHT_AGENT_IDS.has(call.agent_id) &&
    dauer >= LOG_MIN_DAUER_MS &&
    analyse.in_voicemail !== true &&
    call.disconnection_reason !== "user_hangup" &&
    !toolCalls.some((tc) => tc.name === "log_call")
  ) {
    befunde.push({
      ...basis,
      kategorie: "log-fehlt",
      schwere: "hoch",
      titel: "Call ohne Pflicht-log_call beendet",
      detail: `Dauer ${Math.round(dauer / 1000)}s — das Gespräch wurde nicht protokolliert.`,
      ursache: "log-fehlt",
    });
  }

  // 🟡 Rückruf wartet (aus den log_call-Argumenten)
  for (const tc of toolCalls) {
    if (tc.name !== "log_call") continue;
    const args = argumenteAlsObjekt(tc);
    const status = typeof args.status === "string" ? args.status : "";
    if (status.includes("Rückruf") || status.toLowerCase().includes("rueckruf") || status.includes("Frage offen")) {
      const anliegen = typeof args.caller_concern === "string" ? args.caller_concern : "";
      befunde.push({
        ...basis,
        kategorie: "rueckruf-wartet",
        schwere: "mittel",
        titel: `Rückruf wartet: ${status}`,
        detail: anliegen ? `Anliegen: ${anliegen.slice(0, 200)}` : "Ohne notiertes Anliegen.",
        ursache: `rueckruf:${status}`,
      });
    }
  }

  // 🟡 Sehr kurzer Call
  if (dauer > 0 && dauer < KURZ_CALL_MS && call.disconnection_reason === "user_hangup") {
    befunde.push({
      ...basis,
      kategorie: "kurz-call",
      schwere: "mittel",
      titel: `Sehr kurzer Call (${Math.round(dauer / 1000)}s)`,
      detail: "Anrufer hat direkt nach der Begrüßung aufgelegt.",
      ursache: "kurz-call",
    });
  }

  // 🟡 Negatives Sentiment / Call als nicht erfolgreich bewertet
  if (analyse.user_sentiment === "Negative") {
    befunde.push({
      ...basis,
      kategorie: "sentiment-negativ",
      schwere: "mittel",
      titel: "Negatives Anrufer-Sentiment",
      detail: (analyse.call_summary ?? "").slice(0, 250) || "Siehe Transcript.",
      ursache: "sentiment-negativ",
    });
  } else if (analyse.call_successful === false && dauer >= KURZ_CALL_MS) {
    befunde.push({
      ...basis,
      kategorie: "call-erfolglos",
      schwere: "mittel",
      titel: "Call laut Analyse nicht erfolgreich",
      detail: (analyse.call_summary ?? "").slice(0, 250) || "Siehe Transcript.",
      ursache: "call-erfolglos",
    });
  }

  // 🟡 Gehäufte Verständnisprobleme
  const transcript = call.transcript ?? "";
  const verstaendnis = (transcript.match(/nicht (richtig )?verstanden|könnten sie das wiederholen|ich habe sie akustisch/gi) ?? []).length;
  if (verstaendnis >= 3) {
    befunde.push({
      ...basis,
      kategorie: "verstaendnis",
      schwere: "mittel",
      titel: `${verstaendnis} Verständnisprobleme in einem Call`,
      detail: "Mehrfache Nachfragen/Wiederholungen im Transcript.",
      ursache: "verstaendnis",
    });
  }

  // ⚪ Datenqualität bei erfolgreicher Buchung
  for (const tc of toolCalls) {
    if (tc.name !== "check_and_book_appointment") continue;
    const text = resultAlsText(tc);
    if (!text.includes('"status":"success"')) continue;
    const args = argumenteAlsObjekt(tc);

    const fehlend = ["caller_name", "caller_phone", "company_name"].filter(
      (f) => !(typeof args[f] === "string" && (args[f] as string).trim().length > 0),
    );
    if (fehlend.length > 0) {
      befunde.push({
        ...basis,
        kategorie: "pflichtfelder",
        schwere: "niedrig",
        titel: `Buchung mit fehlenden Feldern: ${fehlend.join(", ")}`,
        detail: "Termin wurde trotz unvollständiger Daten gebucht.",
        ursache: `pflichtfelder:${fehlend.join(",")}`,
      });
    }

    const datum = typeof args.requested_date === "string" ? args.requested_date : "";
    const m = datum.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):/);
    if (m) {
      const wochentag = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00`).getDay();
      const stunde = parseInt(m[4], 10);
      const fenster = buchungsfensterFuer(call.agent_id);
      if (!fenster.tage.has(wochentag) || stunde < fenster.vonStunde || stunde > fenster.bisStunde) {
        befunde.push({
          ...basis,
          kategorie: "termin-ausserhalb",
          schwere: "niedrig",
          titel: `Termin außerhalb der erlaubten Zeiten gebucht (${datum})`,
          detail: "Hinweis auf einen Logikfehler in Flow oder Workflow.",
          ursache: "termin-ausserhalb",
        });
      }
    }
  }

  return befunde;
}

// ---------- n8n-Fehler-Executions ----------

async function befundeAusN8n(seitMs: number): Promise<{ befunde: Befund[]; fehler: string | null }> {
  const url = process.env.N8N_URL ?? "https://n8n.ak-assistance.de";
  const key = process.env.N8N_API_KEY;
  if (!key) return { befunde: [], fehler: "Kein N8N_API_KEY in .env.local — n8n-Prüfung übersprungen." };

  let executions: N8nExecution[] = [];
  try {
    const res = await fetch(`${url}/api/v1/executions?status=error&limit=50`, {
      headers: { "X-N8N-API-KEY": key },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { befunde: [], fehler: `n8n-API antwortete mit HTTP ${res.status}.` };
    const json = (await res.json()) as { data?: N8nExecution[] };
    executions = json.data ?? [];
  } catch {
    return { befunde: [], fehler: "n8n-API nicht erreichbar." };
  }

  const befunde: Befund[] = [];

  // Zustands-Check: Ist der Booking-Workflow jedes überwachten Agenten überhaupt aktiv?
  // Ein inaktiver Workflow heißt: JEDE Buchung dieses Agenten schlägt fehl (404) —
  // typische Ursache: fehlende/abgelaufene Google-Credentials nach dem Deployment.
  for (const [workflowId, zuordnung] of Object.entries(WORKFLOW_ZU_AGENT)) {
    try {
      const res = await fetch(`${url}/api/v1/workflows/${workflowId}`, {
        headers: { "X-N8N-API-KEY": key },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) continue;
      const wf = (await res.json()) as { active?: boolean; name?: string };
      if (wf.active === false) {
        befunde.push({
          agentId: zuordnung.agentId,
          agentName: zuordnung.agentName,
          callId: null,
          n8nExecutionId: null,
          kategorie: "workflow-inaktiv",
          schwere: "hoch",
          titel: `Booking-Workflow „${wf.name ?? workflowId}" ist inaktiv`,
          detail: "Jede Terminbuchung dieses Agenten schlägt aktuell fehl (Webhook 404). Häufigste Ursache: Google-Credentials fehlen oder sind abgelaufen.",
          publicLogUrl: null,
          n8nUrl: `${url}/workflow/${workflowId}`,
          ursache: "workflow-inaktiv",
          aufgetretenMs: Date.now(),
        });
      }
    } catch {
      // Einzelner Workflow-Check nicht abrufbar → nächster; der Executions-Teil läuft trotzdem.
    }
  }

  for (const ex of executions) {
    const zuordnung = ex.workflowId ? WORKFLOW_ZU_AGENT[ex.workflowId] : undefined;
    if (!zuordnung) continue; // nur Voice-Workflows melden
    const startMs = ex.startedAt ? Date.parse(ex.startedAt) : 0;
    if (!startMs || startMs < seitMs) continue;

    // Fehlermeldung der Execution holen, um Google-Credential-Probleme zu erkennen.
    let meldung = "";
    try {
      const res = await fetch(`${url}/api/v1/executions/${ex.id}?includeData=true`, {
        headers: { "X-N8N-API-KEY": key },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const detail = (await res.json()) as { data?: { resultData?: { error?: { message?: string; description?: string } } } };
        const err = detail.data?.resultData?.error;
        meldung = [err?.message, err?.description].filter(Boolean).join(" — ").slice(0, 300);
      }
    } catch {
      // Detail nicht abrufbar → generischer n8n-Fehler reicht.
    }

    const istCredentialFehler = /unauthorized|invalid_grant|credential|token|forbidden|401|403/i.test(meldung);
    befunde.push({
      agentId: zuordnung.agentId,
      agentName: zuordnung.agentName,
      callId: null,
      n8nExecutionId: String(ex.id ?? ""),
      kategorie: istCredentialFehler ? "google-credentials" : "n8n-fehler",
      schwere: "hoch",
      titel: istCredentialFehler
        ? "Google-Credentials vermutlich abgelaufen/ungültig"
        : "n8n-Workflow-Fehler",
      detail: meldung || `Execution ${ex.id} des Booking-Workflows schlug fehl.`,
      publicLogUrl: null,
      n8nUrl: `${url}/workflow/${ex.workflowId}/executions/${ex.id}`,
      ursache: istCredentialFehler ? "google-credentials" : `n8n:${meldung.slice(0, 60) || "unbekannt"}`,
      aufgetretenMs: startMs,
    });
  }
  return { befunde, fehler: null };
}

// ---------- Bündelung & Scan ----------

// Führt neue Befunde in die bestehende Alert-Liste ein. Gleicher Fingerprint innerhalb des
// Bündel-Fensters (und nicht "erledigt") → Zähler hoch statt neuer Alert. Gibt die dabei
// wirklich NEU entstandenen Hoch-Alerts zurück (für die Telegram-Benachrichtigung).
export function fuehreBefundeEin(daten: CockpitData, befunde: Befund[], jetztMs: number): Alert[] {
  const alerts = (daten.alerts ??= []);
  const neueHoch: Alert[] = [];
  // Bereits gemeldete Call-/Execution-Referenzen nicht doppelt anlegen (Scan-Überlappung).
  const bekannteRefs = new Set(
    alerts.flatMap((a) => {
      const refs: string[] = [];
      if (a.callId) refs.push(`${a.fingerprint}|call:${a.callId}`);
      if (a.n8nExecutionId) refs.push(`${a.fingerprint}|n8n:${a.n8nExecutionId}`);
      return refs;
    }),
  );

  for (const b of befunde) {
    const fingerprint = `${b.agentId}|${b.kategorie}|${b.ursache}`;
    const ref = b.callId ? `${fingerprint}|call:${b.callId}` : b.n8nExecutionId ? `${fingerprint}|n8n:${b.n8nExecutionId}` : null;
    if (ref && bekannteRefs.has(ref)) continue;

    // Zustands-Alerts (z.B. inaktiver Workflow) bestehen fort, solange der Zustand anhält —
    // längeres Fenster und auch gegen "erledigt" dedupen, damit nicht jeder 15-Minuten-Scan
    // denselben Dauerzustand neu meldet.
    const istZustand = b.kategorie === "workflow-inaktiv";
    const fenster = istZustand ? 7 * 24 * 60 * 60 * 1000 : BUENDEL_FENSTER_MS;
    const vorhanden = alerts.find(
      (a) =>
        a.fingerprint === fingerprint &&
        (a.status !== "erledigt" || istZustand) &&
        jetztMs - Date.parse(a.letztesAuftreten) < fenster,
    );
    if (vorhanden) {
      vorhanden.anzahlGebuendelt += 1;
      vorhanden.letztesAuftreten = new Date(b.aufgetretenMs).toISOString();
      if (b.callId && !vorhanden.callId) vorhanden.callId = b.callId;
      if (b.publicLogUrl && !vorhanden.publicLogUrl) vorhanden.publicLogUrl = b.publicLogUrl;
      if (b.n8nUrl && !vorhanden.n8nUrl) vorhanden.n8nUrl = b.n8nUrl;
    } else {
      const alert: Alert = {
        id: neueAlertId(),
        fingerprint,
        zeitstempel: new Date(b.aufgetretenMs).toISOString(),
        letztesAuftreten: new Date(b.aufgetretenMs).toISOString(),
        agentId: b.agentId,
        agentName: b.agentName,
        callId: b.callId,
        n8nExecutionId: b.n8nExecutionId,
        kategorie: b.kategorie,
        schwere: b.schwere,
        titel: b.titel,
        detail: b.detail,
        publicLogUrl: b.publicLogUrl,
        n8nUrl: b.n8nUrl,
        status: "neu",
        anzahlGebuendelt: 1,
      };
      alerts.push(alert);
      if (alert.schwere === "hoch") neueHoch.push(alert);
    }
    if (ref) bekannteRefs.add(ref);
  }

  // Erledigte Alerts nach 30 Tagen aufräumen, damit die JSON-Datei nicht endlos wächst.
  daten.alerts = alerts.filter(
    (a) => a.status !== "erledigt" || jetztMs - Date.parse(a.letztesAuftreten) < 30 * 24 * 60 * 60 * 1000,
  );

  return neueHoch;
}

export interface ScanErgebnis {
  ok: boolean;
  neueHoch: Alert[];
  geprüfteCalls: number;
  hinweise: string[];
}

// Ein vollständiger Scan-Lauf: Retell + n8n abfragen, Befunde einbündeln, Zustand fortschreiben.
// Mutiert `daten`; der Aufrufer persistiert.
export async function scanAlerts(daten: CockpitData, jetztMs: number = Date.now()): Promise<ScanErgebnis> {
  const zustand = (daten.alertsScan ??= { letzterScanMs: null, letzterLaufIso: null, letzterFehler: null });
  // Erster Lauf: letzte 24h. Danach: seit letztem Lauf, mit Überlappung.
  const seitMs = (zustand.letzterScanMs ?? jetztMs - 24 * 60 * 60 * 1000) - SCAN_UEBERLAPPUNG_MS;
  const hinweise: string[] = [];

  const retell = await holeAlleCallsImZeitraum(seitMs, jetztMs);
  if (!retell.ok) hinweise.push(`Retell: ${retell.fehler ?? "unbekannter Fehler"}`);
  const befunde: Befund[] = [];
  for (const roh of retell.calls) befunde.push(...befundeFuerCall(roh as RetellCall));

  const n8n = await befundeAusN8n(seitMs);
  if (n8n.fehler) hinweise.push(n8n.fehler);
  befunde.push(...n8n.befunde);

  const neueHoch = fuehreBefundeEin(daten, befunde, jetztMs);

  zustand.letzterScanMs = jetztMs;
  zustand.letzterLaufIso = new Date(jetztMs).toISOString();
  zustand.letzterFehler = hinweise.length > 0 ? hinweise.join(" | ") : null;

  return { ok: retell.ok, neueHoch, geprüfteCalls: retell.calls.length, hinweise };
}

// Telegram-Benachrichtigung für neue kritische Alerts — gebündelt in einer Nachricht.
export async function sendeTelegramFuerHoch(neueHoch: Alert[]): Promise<void> {
  if (neueHoch.length === 0) return;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const zeilen = neueHoch.map((a) => `— [${a.agentName}] ${a.titel}`);
  const text = `🔴 Voice-Agent-Alert (${neueHoch.length} kritisch):\n${zeilen.join("\n")}\n\nDetails: https://cockpit.ak-assistance.de/alerts`;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Telegram-Ausfall darf den Scan nicht scheitern lassen — Alerts stehen im Cockpit.
  }
}
