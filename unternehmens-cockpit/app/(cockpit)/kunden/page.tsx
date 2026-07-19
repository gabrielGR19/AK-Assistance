"use client";

import { useEffect, useMemo, useState } from "react";
import { Donut } from "@/components/Donut";

interface KundenVerbrauchEintrag {
  agentId: string;
  agentName: string;
  anzahlCalls: number;
  minuten: number;
  kostenUsd: number;
}

const USD = new Intl.NumberFormat("de-DE", { style: "currency", currency: "USD" });
const ZAHL1 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MONAT_LANG = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
const ZEITPUNKT = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Aktueller Monat als "YYYY-MM" (lokale Zeit reicht für die Anzeige/Navigation).
function laufenderMonat(): string {
  const jetzt = new Date();
  return `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, "0")}`;
}

// Verschiebt einen "YYYY-MM"-Monat um `delta` Monate.
function verschiebeMonat(monat: string, delta: number): string {
  const [jahr, monatIndex] = monat.split("-").map(Number);
  const d = new Date(Date.UTC(jahr, monatIndex - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monatAnzeige(monat: string): string {
  const [jahr, monatIndex] = monat.split("-").map(Number);
  return MONAT_LANG.format(new Date(Date.UTC(jahr, monatIndex - 1, 1)));
}

// Kunden-Verbrauchsübersicht: Call-Minuten und Retell-Kosten pro Kunde (= pro Agent) für
// einen wählbaren Monat — als Beleg für die individuelle monatliche Kundenabrechnung.
export default function KundenVerbrauch() {
  const [monat, setMonat] = useState(laufenderMonat());
  const [kunden, setKunden] = useState<KundenVerbrauchEintrag[] | null>(null);
  const [eingefrorenAm, setEingefrorenAm] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    let abgebrochen = false;
    setLaedt(true);
    setFehler(null);
    fetch(`/api/retell/kunden?monat=${monat}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.fehler ?? "Abruf fehlgeschlagen.");
        return body;
      })
      .then((body) => {
        if (abgebrochen) return;
        setKunden(body.kunden);
        setEingefrorenAm(body.eingefrorenAm ?? null);
      })
      .catch((err) => {
        if (abgebrochen) return;
        setFehler(err instanceof Error ? err.message : "Abruf fehlgeschlagen.");
        setKunden(null);
        setEingefrorenAm(null);
      })
      .finally(() => {
        if (!abgebrochen) setLaedt(false);
      });
    return () => {
      abgebrochen = true;
    };
  }, [monat]);

  const summe = useMemo(() => {
    if (!kunden) return null;
    return kunden.reduce(
      (acc, k) => ({
        kostenUsd: acc.kostenUsd + k.kostenUsd,
        minuten: acc.minuten + k.minuten,
        anzahlCalls: acc.anzahlCalls + k.anzahlCalls,
      }),
      { kostenUsd: 0, minuten: 0, anzahlCalls: 0 },
    );
  }, [kunden]);

  const istLaufenderMonat = monat === laufenderMonat();

  return (
    <main className="shell">
      <header className="seitenkopf">
        <h1 className="seitenkopf__titel">Kunden-Verbrauch</h1>
        <div className="seitenkopf__meta">
          <a className="btn btn--klein" href={`/api/retell/kunden?monat=${monat}&format=csv`}>
            CSV exportieren
          </a>
        </div>
      </header>

      <section className="abschnitt">
        <div className="abschnitt__kopf">
          <h2 className="abschnitt__titel">{monatAnzeige(monat)}</h2>
          <div className="filter" role="group" aria-label="Monat wechseln">
            <button className="chip" onClick={() => setMonat((m) => verschiebeMonat(m, -1))}>
              ← Vormonat
            </button>
            <button className="chip" onClick={() => setMonat((m) => verschiebeMonat(m, 1))} disabled={istLaufenderMonat}>
              Folgemonat →
            </button>
          </div>
        </div>

        {!laedt && !fehler && (
          <span className="herkunft" title={
            istLaufenderMonat
              ? "Laufender Monat — wird bei jedem Aufruf neu von Retell abgerufen, kein fester Wert möglich."
              : eingefrorenAm
                ? `Abgeschlossener Monat, einmalig eingefroren am ${ZEITPUNKT.format(new Date(eingefrorenAm))}. Ändert sich danach nicht mehr — feste Abrechnungsgrundlage.`
                : undefined
          }>
            <span className={`herkunft__punkt herkunft__punkt--${istLaufenderMonat ? "live" : "manuell"}`} aria-hidden="true" />
            <span className={`herkunft__text herkunft__text--${istLaufenderMonat ? "live" : "manuell"}`}>
              {istLaufenderMonat
                ? "live · läuft noch, Werte bis jetzt"
                : eingefrorenAm
                  ? `eingefroren am ${ZEITPUNKT.format(new Date(eingefrorenAm))}`
                  : "eingefroren"}
            </span>
          </span>
        )}

        {laedt && <p className="lade">Lade Retell-Daten …</p>}
        {fehler && <p className="meldung">{fehler}</p>}

        {summe && !laedt && !fehler && (
          <section className="panel hero" aria-label="Verbrauch gesamt" style={{ marginTop: 16 }}>
            <div className="hero__block hero__block--primaer">
              <div className="hero__label">
                <span className="eyebrow">Kosten gesamt</span>
              </div>
              <div className="hero__zahl">{USD.format(summe.kostenUsd)}</div>
            </div>
            <div className="hero__block hero__block--sekundaer">
              <div className="hero__label">
                <span className="eyebrow">Minuten gesamt</span>
              </div>
              <div className="hero__zahl">{ZAHL1.format(summe.minuten)}</div>
            </div>
            <div className="hero__block hero__block--sekundaer">
              <div className="hero__label">
                <span className="eyebrow">Calls gesamt</span>
              </div>
              <div className="hero__zahl">{summe.anzahlCalls}</div>
            </div>
            <div className="hero__block hero__block--sekundaer">
              <div className="hero__label">
                <span className="eyebrow">Kunden aktiv</span>
              </div>
              <div className="hero__zahl">{kunden?.length ?? 0}</div>
            </div>
          </section>
        )}
      </section>

      {kunden && kunden.length > 0 && !laedt && !fehler && (
        <section className="abschnitt" aria-label="Kostenanteil pro Kunde">
          <div className="abschnitt__kopf">
            <h2 className="abschnitt__titel">Kostenanteil pro Kunde</h2>
          </div>
          <div className="panel">
            <Donut
              segmente={kunden.map((k) => ({ label: k.agentName, wert: k.kostenUsd }))}
              formatWert={(w) => USD.format(w)}
              titel="Kostenanteil pro Kunde"
            />
          </div>
        </section>
      )}

      {kunden && !laedt && !fehler && (
        <section className="abschnitt">
          <div className="tabelle-wrap">
            <table className="tabelle">
              <thead>
                <tr>
                  <th>Kunde</th>
                  <th style={{ textAlign: "right" }}>Calls</th>
                  <th style={{ textAlign: "right" }}>Minuten</th>
                  <th style={{ textAlign: "right" }}>Ø Kosten / Call</th>
                  <th style={{ textAlign: "right" }}>Kosten (USD)</th>
                </tr>
              </thead>
              <tbody>
                {kunden.length === 0 && (
                  <tr>
                    <td colSpan={5} className="leer">
                      Keine Calls in diesem Monat.
                    </td>
                  </tr>
                )}
                {kunden.map((k) => (
                  <tr key={k.agentId}>
                    <td>{k.agentName}</td>
                    <td className="zahl-zelle">{k.anzahlCalls}</td>
                    <td className="zahl-zelle">{ZAHL1.format(k.minuten)}</td>
                    <td className="zahl-zelle">
                      {USD.format(k.anzahlCalls > 0 ? k.kostenUsd / k.anzahlCalls : 0)}
                    </td>
                    <td className="zahl-zelle mono">{USD.format(k.kostenUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="eyebrow" style={{ marginTop: 10 }}>
            Kosten = Retells eigene Abrechnung (Voice Engine, TTS, LLM) in USD, direkt aus der
            Retell-API. Keine Umrechnung, kein eigener Aufschlag enthalten.
          </p>
        </section>
      )}
    </main>
  );
}
