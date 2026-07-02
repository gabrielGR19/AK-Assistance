"use client";

import { useEffect, useState } from "react";
import type { CockpitData, Dienst, DienstEingabe } from "@/lib/types";

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
  const [loescheId, setLoescheId] = useState<string | null>(null);

  // Dienste beim ersten Rendern laden.
  useEffect(() => {
    void ladeDienste();
  }, []);

  async function ladeDienste() {
    try {
      const res = await fetch("/api/dienste");
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      setDaten(await res.json());
    } catch {
      setFehler("Dienste konnten nicht geladen werden.");
    }
  }

  // Legt einen neuen Dienst an oder speichert Änderungen am gerade bearbeiteten.
  async function speichern(e: React.FormEvent) {
    e.preventDefault();
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
      abbrechen();
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
      setLoescheId(null);
    } catch {
      setFehler("Löschen fehlgeschlagen (Netzwerk).");
    }
  }

  // Lädt einen bestehenden Dienst zum Bearbeiten ins Formular.
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
  }

  function abbrechen() {
    setBearbeiteId(null);
    setFormular(LEER);
  }

  if (fehler && !daten) return <main style={{ padding: 24 }}>{fehler}</main>;
  if (!daten) return <main style={{ padding: 24 }}>Lädt …</main>;

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1>AK Assistance — Betriebs-Cockpit</h1>
      <p style={{ color: "var(--gedaempft)" }}>
        Schritt 1: Dienste verwalten (funktionale Vorschau, Design folgt).
      </p>

      {fehler && <p style={{ color: "#b00020" }}>{fehler}</p>}

      {/* Liste der Dienste */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid var(--rand)" }}>
            <th>Name</th>
            <th>Kategorie</th>
            <th>Abrechnung</th>
            <th>Betrag</th>
            <th>Status</th>
            <th>Fälligkeit</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {daten.dienste.map((d) => (
            <tr key={d.id} style={{ borderBottom: "1px solid var(--rand)" }}>
              <td>{d.name}</td>
              <td>{d.kategorie}</td>
              <td>{d.abrechnungsmodell}</td>
              <td className="betrag">
                {d.betrag === null ? "—" : `${d.betrag.toFixed(2)} ${d.waehrung}`}
              </td>
              <td>{d.statusAmpel}</td>
              <td className="mono">{d.naechsteFaelligkeit ?? "—"}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button onClick={() => bearbeiten(d)}>Bearbeiten</button>{" "}
                {loescheId === d.id ? (
                  <>
                    <button onClick={() => loeschen(d.id)} style={{ color: "#b00020" }}>
                      Wirklich?
                    </button>{" "}
                    <button onClick={() => setLoescheId(null)}>Nein</button>
                  </>
                ) : (
                  <button onClick={() => setLoescheId(d.id)}>Löschen</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Formular zum Anlegen / Bearbeiten */}
      <h2 style={{ marginTop: 32 }}>{bearbeiteId ? "Dienst bearbeiten" : "Neuen Dienst anlegen"}</h2>
      <form onSubmit={speichern} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
        <label>
          Name*
          <input
            required
            value={formular.name}
            onChange={(e) => setFormular({ ...formular, name: e.target.value })}
          />
        </label>
        <label>
          Kategorie*
          <input
            required
            value={formular.kategorie}
            onChange={(e) => setFormular({ ...formular, kategorie: e.target.value })}
          />
        </label>
        <label>
          Inhaber / Account
          <input
            value={formular.inhaber}
            onChange={(e) => setFormular({ ...formular, inhaber: e.target.value })}
          />
        </label>
        <label>
          Abrechnungsmodell
          <select
            value={formular.abrechnungsmodell}
            onChange={(e) =>
              setFormular({
                ...formular,
                abrechnungsmodell: e.target.value as DienstEingabe["abrechnungsmodell"],
              })
            }
          >
            <option value="monatlich">monatlich</option>
            <option value="jaehrlich">jährlich</option>
            <option value="verbrauch">verbrauch</option>
          </select>
        </label>
        <label>
          Betrag (leer lassen, wenn unbekannt)
          <input
            type="number"
            step="0.01"
            min="0"
            value={formular.betrag ?? ""}
            onChange={(e) =>
              setFormular({ ...formular, betrag: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </label>
        <label>
          Währung
          <select
            value={formular.waehrung}
            onChange={(e) => setFormular({ ...formular, waehrung: e.target.value as DienstEingabe["waehrung"] })}
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={formular.statusAmpel}
            onChange={(e) =>
              setFormular({ ...formular, statusAmpel: e.target.value as DienstEingabe["statusAmpel"] })
            }
          >
            <option value="ok">ok</option>
            <option value="beobachten">beobachten</option>
            <option value="handlung">Handlung nötig</option>
          </select>
        </label>
        <label>
          Nächste Fälligkeit
          <input
            type="date"
            value={formular.naechsteFaelligkeit ?? ""}
            onChange={(e) =>
              setFormular({ ...formular, naechsteFaelligkeit: e.target.value === "" ? null : e.target.value })
            }
          />
        </label>
        <label>
          Notiz / Token-Stand
          <textarea
            value={formular.notiz}
            onChange={(e) => setFormular({ ...formular, notiz: e.target.value })}
          />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">{bearbeiteId ? "Speichern" : "Anlegen"}</button>
          {bearbeiteId && (
            <button type="button" onClick={abbrechen}>
              Abbrechen
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
