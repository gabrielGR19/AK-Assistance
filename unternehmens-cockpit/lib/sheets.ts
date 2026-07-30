// Liest den Monatsverbrauch von ak-leadgen (Google Places API) aus dem Meta-Tab des
// Lead-Sheets, um das Freikontingent (1.000 Calls/Monat) im Cockpit sichtbar zu machen.
//
// Bewusst OHNE googleapis-Abhängigkeit: der Rest des Codebase (lib/claude.ts,
// lib/retell.ts) nutzt durchgehend reines fetch statt SDKs. Die RS256-JWT-Signierung
// für den Service-Account-Token-Tausch läuft über Node's eingebautes crypto - dafür
// braucht es kein zusätzliches Paket.
//
// Sicherheit: der Private Key wird AUSSCHLIESSLICH serverseitig aus process.env
// gelesen, nie geloggt, nie ins Frontend serialisiert. Diese Datei läuft nur serverseitig.

import { createSign } from "crypto";
import type { VerbrauchErgebnis } from "./live/types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const META_RANGE = "Meta!A2:C"; // ohne Header-Zeile
const TIMEOUT_MS = 15_000;

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Erzeugt und signiert ein Service-Account-JWT für den OAuth2-Token-Tausch (RFC 7523).
function signiertesJwt(email: string, privateKey: string): string {
  const jetzt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({ iss: email, scope: SHEETS_SCOPE, aud: TOKEN_URL, iat: jetzt, exp: jetzt + 3600 }),
  );
  const signatur = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(privateKey);
  return `${header}.${payload}.${base64Url(signatur)}`;
}

async function holeAccessToken(email: string, privateKey: string): Promise<string> {
  const jwt = signiertesJwt(email, privateKey);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Token-Tausch fehlgeschlagen: HTTP ${res.status}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Token-Antwort ohne access_token.");
  return json.access_token;
}

// Liest die Zeile des aktuellen Monats aus dem Meta-Tab (ak-leadgen schreibt genau
// eine Zeile pro Monat, siehe leadgen/sheet.py::meta_calls_aktualisieren).
export async function holeLeadgenVerbrauch(): Promise<VerbrauchErgebnis> {
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.LEADGEN_SHEET_ID;
  if (!email || !privateKey || !sheetId) {
    return { ok: false, verbrauchUsd: null, keinKey: true, fehler: "Kein Sheets-Zugang in .env.local." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const token = await holeAccessToken(email, privateKey);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(META_RANGE)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
    if (!res.ok) {
      return { ok: false, verbrauchUsd: null, keinKey: false, fehler: `Sheets-API antwortete mit HTTP ${res.status}.` };
    }

    const json = (await res.json()) as { values?: string[][] };
    const monat = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const zeile = (json.values ?? []).find((z) => z[0] === monat);
    const calls = zeile ? Number.parseInt(zeile[1], 10) : 0;

    return {
      ok: true,
      verbrauchUsd: null,
      keinKey: false,
      fehler: null,
      verbrauchAnzahl: Number.isFinite(calls) ? calls : 0,
      monat,
    };
  } catch (err) {
    const grund = err instanceof Error && err.name === "AbortError" ? "Zeitüberschreitung" : "Netzwerkfehler";
    return { ok: false, verbrauchUsd: null, keinKey: false, fehler: `Sheet nicht erreichbar (${grund}).` };
  } finally {
    clearTimeout(timer);
  }
}
