"use client";

import type { DienstEingabe } from "@/lib/types";

// Controlled-Formular zum Anlegen und Bearbeiten eines Dienstes.
export function DienstFormular({
  wert,
  onChange,
  onSpeichern,
  onAbbrechen,
  istBearbeitung,
}: {
  wert: DienstEingabe;
  onChange: (wert: DienstEingabe) => void;
  onSpeichern: () => void;
  onAbbrechen: () => void;
  istBearbeitung: boolean;
}) {
  const setze = <K extends keyof DienstEingabe>(feld: K, v: DienstEingabe[K]) =>
    onChange({ ...wert, [feld]: v });

  return (
    <form
      className="panel formular"
      onSubmit={(e) => {
        e.preventDefault();
        onSpeichern();
      }}
    >
      <div className="formular__gitter">
        <label>
          Name
          <input required value={wert.name} onChange={(e) => setze("name", e.target.value)} />
        </label>
        <label>
          Kategorie
          <input required value={wert.kategorie} onChange={(e) => setze("kategorie", e.target.value)} />
        </label>
        <label>
          Inhaber / Account
          <input value={wert.inhaber} onChange={(e) => setze("inhaber", e.target.value)} />
        </label>
        <label>
          Abrechnungsmodell
          <select
            value={wert.abrechnungsmodell}
            onChange={(e) => setze("abrechnungsmodell", e.target.value as DienstEingabe["abrechnungsmodell"])}
          >
            <option value="monatlich">monatlich</option>
            <option value="jaehrlich">jährlich</option>
            <option value="verbrauch">Verbrauch (monatl. Schätzwert)</option>
          </select>
        </label>
        <label>
          Betrag <span style={{ color: "var(--ink-faint)" }}>(leer, wenn unbekannt)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={wert.betrag ?? ""}
            onChange={(e) => setze("betrag", e.target.value === "" ? null : Number(e.target.value))}
          />
        </label>
        <label>
          Währung
          <select value={wert.waehrung} onChange={(e) => setze("waehrung", e.target.value as DienstEingabe["waehrung"])}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={wert.statusAmpel}
            onChange={(e) => setze("statusAmpel", e.target.value as DienstEingabe["statusAmpel"])}
          >
            <option value="ok">OK</option>
            <option value="beobachten">Beobachten</option>
            <option value="handlung">Handlung nötig</option>
          </select>
        </label>
        <label>
          Nächste Fälligkeit
          <input
            type="date"
            value={wert.naechsteFaelligkeit ?? ""}
            onChange={(e) => setze("naechsteFaelligkeit", e.target.value === "" ? null : e.target.value)}
          />
        </label>
        <label className="formular__breit">
          Notiz / Token-Stand
          <textarea value={wert.notiz} onChange={(e) => setze("notiz", e.target.value)} />
        </label>
      </div>

      <div className="formular__aktionen">
        <button type="submit" className="btn btn--primaer">
          {istBearbeitung ? "Änderungen speichern" : "Dienst anlegen"}
        </button>
        {istBearbeitung && (
          <button type="button" className="btn" onClick={onAbbrechen}>
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
