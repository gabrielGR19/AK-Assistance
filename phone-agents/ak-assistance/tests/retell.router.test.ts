import crypto from "crypto";
import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const TEST_SECRET = "test-webhook-secret";

// config mocken: kein Env-Setup nötig, kein process.exit beim Import
vi.mock("../src/config", () => ({
  config: { RETELL_WEBHOOK_SECRET: "test-webhook-secret" },
}));

// Handler mocken: Router-Tests dürfen keine n8n-/WhatsApp-Aufrufe auslösen
vi.mock("../src/webhook/retell.handler", () => ({
  handleCallStarted: vi.fn().mockResolvedValue(undefined),
  handleCallEnded: vi.fn().mockResolvedValue(undefined),
}));

let server: Server;
let basisUrl: string;

beforeAll(async () => {
  const { retellRouter } = await import("../src/webhook/retell.router");
  const app = express();
  app.use(express.json());
  app.use("/webhook/retell", retellRouter);

  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  const adresse = server.address();
  if (adresse === null || typeof adresse === "string") throw new Error("Kein Port");
  basisUrl = `http://127.0.0.1:${adresse.port}/webhook/retell`;
});

afterAll(() => {
  server?.close();
});

function signiere(body: unknown, secret: string): string {
  return crypto.createHmac("sha256", secret).update(JSON.stringify(body)).digest("hex");
}

async function sende(body: unknown, signatur?: string): Promise<Response> {
  return fetch(basisUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signatur && { "x-retell-signature": signatur }),
    },
    body: JSON.stringify(body),
  });
}

const beispielEvent = {
  event: "call_started",
  call_id: "call-1",
  agent_id: "agent-1",
  call_type: "inbound",
  from_number: "+491701234567",
  to_number: "+49911987654",
  start_timestamp: 1_700_000_000,
};

describe("Retell-Webhook Signaturprüfung", () => {
  it("akzeptiert eine gültige HMAC-Signatur (200)", async () => {
    const antwort = await sende(beispielEvent, signiere(beispielEvent, TEST_SECRET));

    expect(antwort.status).toBe(200);
    expect(await antwort.json()).toEqual({ received: true });
  });

  it("lehnt eine gefälschte Signatur gleicher Länge ab (401)", async () => {
    const gefaelscht = signiere(beispielEvent, "falsches-secret");
    const antwort = await sende(beispielEvent, gefaelscht);

    expect(antwort.status).toBe(401);
  });

  it("lehnt fehlende Signatur ab (401)", async () => {
    const antwort = await sende(beispielEvent);

    expect(antwort.status).toBe(401);
  });

  it("lehnt eine Signatur ab, die zu einem anderen Body gehört (401)", async () => {
    const andererBody = { ...beispielEvent, call_id: "call-2" };
    const antwort = await sende(beispielEvent, signiere(andererBody, TEST_SECRET));

    expect(antwort.status).toBe(401);
  });

  it("lehnt eine Signatur mit falscher Länge ab (401)", async () => {
    const antwort = await fetch(basisUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-retell-signature": "zu-kurz",
      },
      body: JSON.stringify(beispielEvent),
    });

    expect(antwort.status).toBe(401);
  });
});
