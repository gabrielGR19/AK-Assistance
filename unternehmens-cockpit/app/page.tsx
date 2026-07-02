"use client";

import { useEffect, useMemo, useState } from "react";
import type { CockpitData, Dienst, DienstEingabe } from "@/lib/types";
import { berechneKosten } from "@/lib/costs";
import { berechneWarnungen } from "@/lib/checks";
import { WarnBand } from "@/components/WarnBand";
import { KostenHero } from "@/components/KostenHero";
import { DienstTabelle } from "@/components/DienstTabelle";
import { DienstFormular } from "@/components/DienstFormular";

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

  useEffect(() => {
    void ladeDaten();
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

      {fehler && <p className="meldung">{fehler}</p>}

      <DienstTabelle
        dienste={daten.dienste}
        kostenIndex={kostenIndex}
        onBearbeiten={bearbeiten}
        onLoeschen={loeschen}
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
