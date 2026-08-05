import { timingSafeEqual } from "node:crypto";

// Serverseitiger Teil des Web-Calls.
// Der Retell-API-Key bleibt hier — das Frontend bekommt nur den
// access_token, der genau einen Anruf freischaltet und nach 30 s verfällt.

const RETELL_ENDPOINT = "https://api.retellai.com/v2/create-web-call";
// Conversation Flow Agent (from Zweirad Kißkalt - Max)
const KISSKALT_AGENT_ID = "agent_6f090802fac09830ba6ca1e6c7";

// Der Kißkalt-Agent arbeitet mit Platzhaltern im Prompt. Ohne Werte würde
// der Agent sie wörtlich vorlesen — deshalb hier fest hinterlegt.
const DYNAMIC_VARIABLES = {
  firmenname: "Zweirad Kißkalt",
  branche: "Zweiradfachgeschäft mit Meisterwerkstatt",
  tonalitaet: "freundlich und professionell",
};

/** Vergleich ohne Timing-Leak; Länge darf abweichen. */
function codeMatches(input, expected) {
  const a = Buffer.from(String(input));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method Not Allowed" }, 405);
  }

  const apiKey = process.env.RETELL_API_KEY;
  const accessCode = process.env.ACCESS_CODE;

  if (!apiKey || !accessCode) {
    console.error("Konfiguration unvollständig: RETELL_API_KEY oder ACCESS_CODE fehlt");
    return json({ error: "Server ist nicht vollständig konfiguriert." }, 500);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Ungültige Anfrage." }, 400);
  }

  if (!codeMatches(payload?.code ?? "", accessCode)) {
    return json({ error: "Zugangscode stimmt nicht." }, 401);
  }

  // Freischalt-Schritt im Frontend: Code prüfen, aber noch keinen Anruf
  // anlegen (der Token würde nach 30 s ohnehin verfallen).
  if (payload?.verify === true) {
    return json({ ok: true });
  }

  const agentId = process.env.RETELL_AGENT_ID || KISSKALT_AGENT_ID;
  const body = {
    agent_id: agentId,
    retell_llm_dynamic_variables: DYNAMIC_VARIABLES,
  };

  // Unveröffentlichte Agenten brauchen eine explizite Version — sonst
  // sucht Retell nach der letzten veröffentlichten und findet keine.
  if (process.env.RETELL_AGENT_VERSION) {
    const v = process.env.RETELL_AGENT_VERSION;
    body.agent_version = /^\d+$/.test(v) ? Number(v) : v;
  }

  let retellResponse;
  try {
    retellResponse = await fetch(RETELL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("Retell nicht erreichbar:", err);
    return json({ error: "Sprachdienst nicht erreichbar." }, 502);
  }

  const text = await retellResponse.text();

  if (!retellResponse.ok) {
    // Volle Fehlermeldung nur ins Log, nach außen nur der Statuscode.
    console.error(`Retell ${retellResponse.status}: ${text}`);
    return json(
      { error: `Anruf konnte nicht gestartet werden (Retell ${retellResponse.status}).` },
      502,
    );
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("Retell-Antwort war kein JSON:", text.slice(0, 300));
    return json({ error: "Unerwartete Antwort vom Sprachdienst." }, 502);
  }

  if (!data.access_token) {
    console.error("Retell-Antwort ohne access_token:", text.slice(0, 300));
    return json({ error: "Kein Zugangstoken erhalten." }, 502);
  }

  return json({ accessToken: data.access_token, callId: data.call_id });
};

export const config = { path: "/api/create-web-call" };
