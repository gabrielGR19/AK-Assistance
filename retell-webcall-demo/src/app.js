import { RetellWebClient } from "retell-client-js-sdk";

const gate = document.getElementById("gate");
const gateForm = document.getElementById("gate-form");
const gateError = document.getElementById("gate-error");
const codeInput = document.getElementById("code");
const unlockBtn = document.getElementById("unlock-btn");

const callSection = document.getElementById("call");
const callBtn = document.getElementById("call-btn");
const hangupBtn = document.getElementById("hangup-btn");
const callError = document.getElementById("call-error");
const statusEl = document.getElementById("status");
const statusText = document.getElementById("status-text");

const API = "/api/create-web-call";

const client = new RetellWebClient();
let accessCode = null;
let callActive = false;

function setStatus(state, text) {
  statusEl.dataset.state = state;
  statusText.textContent = text;
}

function showError(el, message) {
  el.textContent = message || "";
}

// --- Schritt 1: Zugangscode gegen die Function prüfen ---------------------
gateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = codeInput.value.trim();
  if (!value) return;

  unlockBtn.disabled = true;
  unlockBtn.textContent = "Prüfe …";
  showError(gateError, "");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: value, verify: true }),
    });

    if (res.ok) {
      accessCode = value;
      gate.hidden = true;
      callSection.hidden = false;
      setStatus("idle", "Bereit");
      callBtn.focus();
      return;
    }

    const data = await res.json().catch(() => ({}));
    showError(gateError, data.error || "Prüfung fehlgeschlagen.");
    codeInput.select();
  } catch {
    showError(gateError, "Keine Verbindung zum Server.");
  } finally {
    unlockBtn.disabled = false;
    unlockBtn.textContent = "Freischalten";
  }
});

// --- Schritt 2: Web-Call starten ------------------------------------------
callBtn.addEventListener("click", async () => {
  if (callActive) return;

  callBtn.disabled = true;
  showError(callError, "");
  setStatus("connecting", "Verbindet …");

  // Mikrofon-Freigabe zuerst und direkt im Klick-Kontext anfordern: Safari
  // knüpft Audio-Rechte an die Nutzergeste, die ein await sonst verlieren kann.
  try {
    const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
    probe.getTracks().forEach((track) => track.stop());
  } catch {
    setStatus("error", "Kein Mikrofon");
    showError(
      callError,
      "Mikrofon-Zugriff wurde blockiert. Bitte in der Adressleiste freigeben und erneut versuchen.",
    );
    callBtn.disabled = false;
    return;
  }

  try {
    // Token erst jetzt holen — er verfällt 30 Sekunden nach Erstellung.
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: accessCode }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.accessToken) {
      throw new Error(data.error || `Serverfehler (${res.status}).`);
    }

    await client.startCall({ accessToken: data.accessToken });
  } catch (err) {
    setStatus("error", "Fehler");
    showError(callError, err.message || "Anruf konnte nicht gestartet werden.");
    callBtn.disabled = false;
  }
});

hangupBtn.addEventListener("click", () => {
  client.stopCall();
});

// --- SDK-Events -----------------------------------------------------------
client.on("call_started", () => {
  callActive = true;
  callBtn.hidden = true;
  hangupBtn.hidden = false;
  setStatus("connecting", "Verbunden — Assistent kommt ans Telefon …");
});

client.on("call_ready", () => {
  setStatus("live", "Im Gespräch");
});

client.on("agent_start_talking", () => {
  if (callActive) setStatus("live", "Assistent spricht …");
});

client.on("agent_stop_talking", () => {
  if (callActive) setStatus("live", "Im Gespräch — Sie sind dran");
});

client.on("call_ended", () => {
  callActive = false;
  hangupBtn.hidden = true;
  callBtn.hidden = false;
  callBtn.disabled = false;
  setStatus("ended", "Gespräch beendet");
});

client.on("error", (err) => {
  console.error("Retell-Fehler:", err);
  callActive = false;
  client.stopCall();
  hangupBtn.hidden = true;
  callBtn.hidden = false;
  callBtn.disabled = false;
  setStatus("error", "Verbindung abgebrochen");
  showError(callError, typeof err === "string" ? err : err?.message || "Unbekannter Fehler.");
});

// Beim Schließen/Wegnavigieren auflegen, damit kein Anruf weiterläuft.
window.addEventListener("pagehide", () => {
  if (callActive) client.stopCall();
});
