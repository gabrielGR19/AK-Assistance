"use client";

import { useEffect, useMemo, useState } from "react";
import type { CockpitData, Dienst, DienstEingabe } from "@/lib/types";
import type { LiveInfo } from "@/lib/live/runner";
import { berechneKosten } from "@/lib/costs";
import { berechneWarnungen } from "@/lib/checks";
import { WarnBand } from "@/components/WarnBand";
import { KostenHero } from "@/components/KostenHero";
import { DienstTabelle } from "@/components/DienstTabelle";
import { DienstFormular } from "@/components/DienstFormular";
import { ClaudeGuthaben } from "@/components/ClaudeGuthaben";

// Leeres Formular als Ausgangszustand für einen neuen Dienst.
const LEER: DienstEingabe = {
  name: "",
  kategorie: "",
  inhaber: "",
  abrechnungsmodell: "monatlich",
  betrag: null,
  waehrung: "EUR",
  statusAmpel: "ok",
  naechsteFaelligkeit: null,
  notiz: "",
};

export default function Cockpit() {
  const [daten, setDaten] = useState<CockpitData | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [formular, setFormular] = useState<DienstEingabe>(LEER);
  const [bearbeiteId, setBearbeiteId] = useState<string | null>(null);
  const [formularOffen, setFormularOffen] = useState(false);
  const [liveFaehigIds, setLiveFaehigIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void ladeDaten();
    void ladeLiveFaehigkeit();
  }, []);

  async function ladeDaten() {
    try {
      const res = await fetch("/api/dienste");
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      setDaten(await res.json());
    } catch {
      setFehler("Dienste konnten nicht geladen werden.");
    }
  }

  // Welche Dienste einen registrierten Live-Provider haben — unabhängig vom Dienste-Payload,
  // damit der Live-Button auch nach anderen Aktionen (Bearbeiten, Löschen) sichtbar bleibt.
  async function ladeLiveFaehigkeit() {
    try {
      const res = await fetch("/api/live");
      if (!res.ok) return;
      const antwort = await res.json();
      setLiveFaehigIds(new Set<string>(antwort.ids ?? []));
    } catch {
      // Live-Buttons bleiben einfach ausgeblendet, kein kritischer Fehler.
    }
  }

  // Kosten und Warnungen aus den reinen Funktionen ableiten (eine Quelle der Wahrheit).
  const kosten = useMemo(() => (daten ? berechneKosten(daten) : null), [daten]);
  const warnungen = useMemo(() => (daten ? berechneWarnungen(daten) : []), [daten]);
  const kostenIndex = useMemo(
    () => new Map((kosten?.proDienst ?? []).map((k) => [k.id, k])),
    [kosten],
  );

  async function speichern() {
    setFehler(null);
    const url = bearbeiteId ? `/api/dienste/${bearbeiteId}` : "/api/dienste";
    const methode = bearbeiteId ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method: methode,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formular),
      });
      const antwort = await res.json();
      if (!res.ok) {
        setFehler(antwort.fehler ?? "Speichern fehlgeschlagen.");
        return;
      }
      setDaten(antwort);
      schliesseFormular();
    } catch {
      setFehler("Speichern fehlgeschlagen (Netzwerk).");
    }
  }

  async function loeschen(id: string) {
    setFehler(null);
    try {
      const res = await fetch(`/api/dienste/${id}`, { method: "DELETE" });
      const antwort = await res.json();
      if (!res.ok) {
        setFehler(antwort.fehler ?? "Löschen fehlgeschlagen.");
        return;
      }
      setDaten(antwort);
    } catch {
      setFehler("Löschen fehlgeschlagen (Netzwerk).");
    }
  }

  async function kursSpeichern(kurs: number) {
    setFehler(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eurUsdKurs: kurs }),
      });
      const antwort = await res.json();
      if (!res.ok) {
        setFehler(antwort.fehler ?? "Kurs konnte nicht gespeichert werden.");
        return;
      }
      setDaten(antwort);
    } catch {
      setFehler("Kurs konnte nicht gespeichert werden (Netzwerk).");
    }
  }

  // Claude-Guthaben: manuelle Basis/Schwelle/Fallback-Verbrauch speichern.
  async function claudeSpeichern(patch: Record<string, unknown>) {
    setFehler(null);
    try {
      const res = await fetch("/api/claude", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const antwort = await res.json();
      if (!res.ok) {
        setFehler(antwort.fehler ?? "Claude-Einstellungen konnten nicht gespeichert werden.");
        return;
      }
      setDaten(antwort.daten);
    } catch {
      setFehler("Claude-Einstellungen konnten nicht gespeichert werden (Netzwerk).");
    }
  }

  // Generischer Live-Abruf über die Provider-Registry — nutzbar für jeden Dienst mit
  // registriertem Live-Provider (Claude, Retell, künftige Dienste), ohne Sonderfälle.
  async function liveAbrufen(dienstId: string): Promise<LiveInfo | null> {
    setFehler(null);
    try {
      const res = await fetch(`/api/live/${dienstId}`, { method: "POST" });
      const antwort = await res.json();
      if (!res.ok) {
        setFehler(antwort.fehler ?? "Live-Abruf fehlgeschlagen.");
        return null;
      }
      setDaten(antwort.daten);
      return antwort.live ?? null;
    } catch {
      setFehler("Live-Abruf fehlgeschlagen (Netzwerk).");
      return null;
    }
  }

  function bearbeiten(d: Dienst) {
    setBearbeiteId(d.id);
    setFormular({
      name: d.name,
      kategorie: d.kategorie,
      inhaber: d.inhaber,
      abrechnungsmodell: d.abrechnungsmodell,
      betrag: d.betrag,
      waehrung: d.waehrung,
      statusAmpel: d.statusAmpel,
      naechsteFaelligkeit: d.naechsteFaelligkeit,
      notiz: d.notiz,
    });
    setFormularOffen(true);
    if (typeof window !== "undefined") window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function schliesseFormular() {
    setBearbeiteId(null);
    setFormular(LEER);
    setFormularOffen(false);
  }

  if (fehler && !daten) return <main className="shell lade">{fehler}</main>;
  if (!daten || !kosten) return <main className="shell lade">Cockpit lädt …</main>;

  const heute = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  const claudeDienst = daten.dienste.find((d) => d.claude);

  return (
    <main className="shell">
      <header className="kopf">
        <div className="marke">
          <span className="marke__punkt" aria-hidden="true" />
          <span className="marke__name">AK Assistance</span>
          <span className="marke__sub">Betriebs-Cockpit</span>
        </div>
        <div className="kopf__meta">
          <a className="btn btn--klein" href="/report">
            Report / Druckansicht
          </a>
          <span>Stand {heute}</span>
        </div>
      </header>

      <WarnBand warnungen={warnungen} />

      <KostenHero kosten={kosten} meta={daten.meta} onKursSpeichern={kursSpeichern} />

      {claudeDienst && (
        <ClaudeGuthaben
          dienst={claudeDienst}
          onSpeichern={claudeSpeichern}
          onAbrufen={() => liveAbrufen(claudeDienst.id)}
        />
      )}

      {fehler && <p className="meldung">{fehler}</p>}

      <DienstTabelle
        dienste={daten.dienste}
        kostenIndex={kostenIndex}
        liveFaehigIds={liveFaehigIds}
        onBearbeiten={bearbeiten}
        onLoeschen={loeschen}
        onLiveAbruf={liveAbrufen}
      />

      <section className="abschnitt">
        <div className="abschnitt__kopf">
          <h2 className="abschnitt__titel">
            {formularOffen && bearbeiteId ? "Dienst bearbeiten" : "Neuen Dienst anlegen"}
          </h2>
          {!formularOffen && (
            <button className="btn btn--primaer" onClick={() => setFormularOffen(true)}>
              + Dienst hinzufügen
            </button>
          )}
        </div>
        {formularOffen && (
          <DienstFormular
            wert={formular}
            onChange={setFormular}
            onSpeichern={speichern}
            onAbbrechen={schliesseFormular}
            istBearbeitung={!!bearbeiteId}
          />
        )}
      </section>
    </main>
  );
}
