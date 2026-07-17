import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", () => ({
  default: { post: vi.fn() },
}));

vi.mock("../src/config", () => ({
  config: {
    N8N_WEBHOOK_URL: "https://n8n.example.com/webhook",
    N8N_API_KEY: "geheimer-key",
  },
}));

const axiosPost = vi.mocked(axios.post);

beforeEach(() => {
  axiosPost.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("triggerN8nWorkflow", () => {
  it("ruft den Trigger-Endpunkt mit Payload, API-Key-Header und Timeout auf", async () => {
    axiosPost.mockResolvedValueOnce({ status: 200 });
    const { triggerN8nWorkflow } = await import("../src/n8n/n8n.service");

    await triggerN8nWorkflow("call-ended", { callId: "call-1" });

    expect(axiosPost).toHaveBeenCalledWith(
      "https://n8n.example.com/webhook/call-ended",
      { callId: "call-1" },
      {
        headers: {
          "Content-Type": "application/json",
          "X-N8N-API-KEY": "geheimer-key",
        },
        timeout: 5000,
      }
    );
  });

  it("schluckt Netzwerkfehler: der Hauptablauf darf nicht abbrechen", async () => {
    axiosPost.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const { triggerN8nWorkflow } = await import("../src/n8n/n8n.service");

    await expect(
      triggerN8nWorkflow("call-started", { callId: "call-2" })
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("schluckt auch Timeout-Fehler (axios timeout)", async () => {
    const timeoutFehler = Object.assign(new Error("timeout of 5000ms exceeded"), {
      code: "ECONNABORTED",
    });
    axiosPost.mockRejectedValueOnce(timeoutFehler);
    const { triggerN8nWorkflow } = await import("../src/n8n/n8n.service");

    await expect(
      triggerN8nWorkflow("appointment-requested", {})
    ).resolves.toBeUndefined();
  });
});
