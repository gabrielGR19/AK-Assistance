import type { LiveProvider } from "./types";
import { retellProvider } from "./retell-provider";
import { claudeProvider } from "./claude-provider";

// Einziger Registrierungspunkt für Live-Dienste. Ein neuer Live-Dienst braucht genau
// eine neue Provider-Datei (lib/live/<dienst>-provider.ts) plus einen Eintrag hier —
// Routen und UI erkennen ihn dann automatisch, ohne weitere Codeänderungen.
export const LIVE_PROVIDER: LiveProvider[] = [retellProvider, claudeProvider];

export function findeProvider(dienstId: string): LiveProvider | undefined {
  return LIVE_PROVIDER.find((p) => p.dienstId === dienstId);
}
