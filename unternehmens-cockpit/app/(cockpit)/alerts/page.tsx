"use client";

import { useEffect, useMemo, useState } from "react";
import type { Alert, AlertSchwere, AlertStatus, AlertsScanZustand } from "@/lib/types";

const SCHWERE_LABEL: Record<AlertSchwere, string> = { hoch: "🔴 Hoch", mittel: "🟡 Mittel", niedrig: "⚪ Niedrig" };
const STATUS_LABEL: Record<AlertStatus, string> = { neu: "Neu", gesehen: "Gesehen", erledigt: "Erledigt" };

export default function AlertsSeite() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scan, setScan] = useState<AlertsScanZustand | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(true);
  const [scanLaeuft, setScanLaeuft] = useState(false);
  const [filterAgent, setFilterAgent] = useState<string>("alle");
  const [filterSchwere, setFilterSchwere] = useState<string>("alle");
  const [filterStatus, setFilterStatus] = useState<string>("offen");

  useEffect(() => {
    void laden();
  }, []);

  async function laden() {
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error();
      const antwort = await res.json();
      setAlerts(antwort.alerts ?? []);
      setScan(antwort.scan ?? null);
    } catch {
      setFehler("Alerts konnten nicht geladen werden.");
    } finally {
      setLaedt(false);
    }
  }

  async function scanJetzt() {
    setScanLaeuft(true);
    setFehler(null);
    try {
      const res = await fetch("/api/alerts/scan", { method: "POST" });
      if (!res.ok) throw new Error();
      await laden();
    } catch {
      setFehler("Scan fehlgeschlagen.");
    } finally {
      setScanLaeuft(false);
    }
  }

  async function statusSetzen(id: string, status: AlertStatus) {
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      setAlerts((alte) => alte.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch {
      setFehler("Status konnte nicht gespeichert werden.");
    }
  }

  const agenten = useMemo(() => {
    const namen = new Map<string, string>();
    for (const a of alerts) namen.set(a.agentId, a.agentName);
    return Array.from(namen.entries());
  }, [alerts]);

  // Häufungen der letzten 24h pro Agent (nur hoch), damit Problem-Agenten hervorstechen.
  const haeufungen = useMemo(() => {
    const grenze = Date.now() - 24 * 60 * 60 * 1000;
    const zaehler = new Map<string, number>();
    for (const a of alerts) {
      if (a.schwere !== "hoch" || a.status === "erledigt") continue;
      if (Date.parse(a.letztesAuftreten) < grenze) continue;
      zaehler.set(a.agentName, (zaehler.get(a.agentName) ?? 0) + a.anzahlGebuendelt);
    }
    return Array.from(zaehler.entries()).filter(([, n]) => n >= 2);
  }, [alerts]);

  const gefiltert = alerts.filter((a) => {
    if (filterAgent !== "alle" && a.agentId !== filterAgent) return false;
    if (filterSchwere !== "alle" && a.schwere !== filterSchwere) return false;
    if (filterStatus === "offen" && a.status === "erledigt") return false;
    if (filterStatus !== "offen" && filterStatus !== "alle" && a.status !== filterStatus) return false;
    return true;
  });

  if (laedt) return <main className="shell lade">Alerts laden …</main>;

  return (
    <main className="shell">
      <header className="seitenkopf">
        <h1 className="seitenkopf__titel">Alerts</h1>
        <div className="seitenkopf__meta">
          <button className="btn btn--klein" onClick={scanJetzt} disabled={scanLaeuft}>
            {scanLaeuft ? "Scan läuft …" : "Jetzt scannen"}
          </button>
        </div>
      </header>

      {scan?.letzterLaufIso && (
        <p className="hinweis">
          Letzter Scan: {new Date(scan.letzterLaufIso).toLocaleString("de-DE")}
          {scan.letzterFehler ? ` — ⚠️ ${scan.letzterFehler}` : ""}
        </p>
      )}
      {fehler && <p className="meldung">{fehler}</p>}

      {haeufungen.length > 0 && (
        <section className="warnband warnband--kritisch" aria-label="Häufungen">
          <div className="warnband__kopf">
            <span className="warnband__leuchte" aria-hidden="true" />
            <span className="warnband__titel">Auffällige Häufungen (24h)</span>
          </div>
          <ul className="warnliste">
            {haeufungen.map(([name, n]) => (
              <li key={name} className="warnzeile">
                <span className="warnzeile__marke warnzeile__marke--hoch" aria-hidden="true" />
                <div className="warnzeile__titel">
                  {name}: {n} kritische Vorfälle in den letzten 24 Stunden
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="abschnitt">
        <div className="abschnitt__kopf">
          <h2 className="abschnitt__titel">
            {gefiltert.length} Alert{gefiltert.length === 1 ? "" : "s"}
          </h2>
          <div className="filter">
            <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}>
              <option value="alle">Alle Agenten</option>
              {agenten.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <select value={filterSchwere} onChange={(e) => setFilterSchwere(e.target.value)}>
              <option value="alle">Alle Schweregrade</option>
              <option value="hoch">Hoch</option>
              <option value="mittel">Mittel</option>
              <option value="niedrig">Niedrig</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="offen">Offen (neu + gesehen)</option>
              <option value="neu">Nur neu</option>
              <option value="gesehen">Nur gesehen</option>
              <option value="erledigt">Erledigt</option>
              <option value="alle">Alle</option>
            </select>
          </div>
        </div>

        {gefiltert.length === 0 ? (
          <p className="hinweis">Keine Alerts für diese Filter — alles im grünen Bereich.</p>
        ) : (
          <ul className="alertliste">
            {gefiltert.map((a) => (
              <li key={a.id} className={`alertkarte alertkarte--${a.schwere}${a.status === "erledigt" ? " alertkarte--erledigt" : ""}`}>
                <div className="alertkarte__kopf">
                  <span className={`alertkarte__schwere alertkarte__schwere--${a.schwere}`}>{SCHWERE_LABEL[a.schwere]}</span>
                  <span className="alertkarte__agent">{a.agentName}</span>
                  <span className="alertkarte__zeit">
                    {new Date(a.letztesAuftreten).toLocaleString("de-DE")}
                    {a.anzahlGebuendelt > 1 ? ` · ${a.anzahlGebuendelt}×` : ""}
                  </span>
                </div>
                <div className="alertkarte__titel">{a.titel}</div>
                <div className="alertkarte__detail">{a.detail}</div>
                <div className="alertkarte__fuss">
                  <span className="alertkarte__kategorie">{a.kategorie}</span>
                  {a.publicLogUrl && (
                    <a className="btn btn--klein" href={a.publicLogUrl} target="_blank" rel="noreferrer">
                      Transcript/Log
                    </a>
                  )}
                  {a.n8nUrl && (
                    <a className="btn btn--klein" href={a.n8nUrl} target="_blank" rel="noreferrer">
                      n8n-Execution
                    </a>
                  )}
                  <span className="alertkarte__aktionen">
                    {(["neu", "gesehen", "erledigt"] as AlertStatus[])
                      .filter((s) => s !== a.status)
                      .map((s) => (
                        <button key={s} className="btn btn--klein" onClick={() => statusSetzen(a.id, s)}>
                          → {STATUS_LABEL[s]}
                        </button>
                      ))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
