import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// dotenv neutralisieren: Tests kontrollieren process.env selbst,
// eine lokale .env darf die Ergebnisse nicht beeinflussen.
vi.mock("dotenv", () => ({ default: { config: vi.fn() } }));

const PFLICHT_VARS: Record<string, string> = {
  RETELL_API_KEY: "retell-key",
  RETELL_WEBHOOK_SECRET: "webhook-secret",
  ANTHROPIC_API_KEY: "anthropic-key",
  WHATSAPP_API_TOKEN: "wa-token",
  WHATSAPP_PHONE_NUMBER_ID: "12345",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "67890",
  N8N_WEBHOOK_URL: "https://n8n.example.com/webhook",
};

const ALLE_VARS = [
  ...Object.keys(PFLICHT_VARS),
  "PORT",
  "NODE_ENV",
  "N8N_API_KEY",
  "AIRTABLE_API_KEY",
  "AIRTABLE_BASE_ID",
];

let gesicherteEnv: Record<string, string | undefined>;

beforeEach(() => {
  vi.resetModules();
  gesicherteEnv = {};
  for (const key of ALLE_VARS) {
    gesicherteEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const [key, wert] of Object.entries(gesicherteEnv)) {
    if (wert === undefined) delete process.env[key];
    else process.env[key] = wert;
  }
  vi.restoreAllMocks();
});

describe("config (Env-Validierung via Zod)", () => {
  it("akzeptiert vollständige Pflicht-Variablen und setzt Defaults", async () => {
    Object.assign(process.env, PFLICHT_VARS);

    const { config } = await import("../src/config");

    expect(config.RETELL_API_KEY).toBe("retell-key");
    expect(config.PORT).toBe("3000"); // Default
    expect(config.NODE_ENV).toBe("development"); // Default
    expect(config.N8N_API_KEY).toBeUndefined(); // optional
  });

  it("beendet den Prozess (exit 1) bei fehlender Pflicht-Variable", async () => {
    const { ANTHROPIC_API_KEY: _weg, ...unvollstaendig } = PFLICHT_VARS;
    Object.assign(process.env, unvollstaendig);

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {
        throw new Error("process.exit aufgerufen");
      }) as never);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/config")).rejects.toThrow("process.exit aufgerufen");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("beendet den Prozess bei ungültiger N8N_WEBHOOK_URL (keine URL)", async () => {
    Object.assign(process.env, PFLICHT_VARS, { N8N_WEBHOOK_URL: "keine-url" });

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {
        throw new Error("process.exit aufgerufen");
      }) as never);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/config")).rejects.toThrow("process.exit aufgerufen");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("lehnt ungültiges NODE_ENV ab", async () => {
    Object.assign(process.env, PFLICHT_VARS, { NODE_ENV: "staging" });

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {
        throw new Error("process.exit aufgerufen");
      }) as never);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/config")).rejects.toThrow("process.exit aufgerufen");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
