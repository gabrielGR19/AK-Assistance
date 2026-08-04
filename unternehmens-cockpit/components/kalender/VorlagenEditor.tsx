"use client";

import { useEffect, useRef, useState } from "react";
import type { Label, LabelSchluessel } from "@/lib/kalender-typen";
import s from "./kalender.module.css";

export interface VorlageWerte {
  titel: string;
  label: LabelSchluessel;
  min: number;
}

interface Props {
  werte: VorlageWerte;
  labels: Label[];
  istNeu: boolean;
  fehler: string | null;
  beiSpeichern: (werte: VorlageWerte) => void;
  beiLoeschen: () => void;
  beiSchliessen: () => void;
}

// Anlegen/Bearbeiten einer Schnellvorlage — ersetzt die drei window.prompt-Fenster durch
// ein echtes Formular mit Label-Auswahl (Muster wie LabelEditor).
export function VorlagenEditor({ werte: start, labels, istNeu, fehler, beiSpeichern, beiLoeschen, beiSchliessen }: Props) {
  const [w, setW] = useState<VorlageWerte>(start);
  const titelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titelRef.current?.focus();
    titelRef.current?.select();
  }, []);

  function aendere<K extends keyof VorlageWerte>(feld: K, wert: VorlageWerte[K]) {
    setW((alt) => ({ ...alt, [feld]: wert }));
  }

  return (
    <div className={s.ueberlagerung} onPointerDown={beiSchliessen}>
      <div
        className={`${s.pop} ${s.popZentriert}`}
        role="dialog"
        aria-label={istNeu ? "Neue Vorlage" : "Vorlage bearbeiten"}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") beiSchliessen();
          if (e.key === "Enter") {
            e.preventDefault();
            beiSpeichern(w);
          }
        }}
      >
        <h3 className={s.popTitel}>{istNeu ? "Neue Vorlage" : "Vorlage"}</h3>

        <input
          ref={titelRef}
          type="text"
          className={s.popFeld}
          placeholder="Titel"
          value={w.titel}
          autoComplete="off"
          onChange={(e) => aendere("titel", e.target.value)}
        />

        <label className={s.popLabel} htmlFor="vl-label">
          Kalender
        </label>
        <select
          id="vl-label"
          className={s.popFeld}
          value={w.label}
          onChange={(e) => aendere("label", e.target.value)}
        >
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <label className={s.popLabel} htmlFor="vl-min">
          Dauer in Minuten
        </label>
        <input
          id="vl-min"
          type="number"
          className={s.popFeld}
          value={w.min}
          min={5}
          max={12 * 60}
          onChange={(e) => aendere("min", Number(e.target.value))}
        />

        {fehler && <p className={s.popFehler}>{fehler}</p>}

        <div className={s.popFuss}>
          {!istNeu && (
            <button className={s.popLoeschen} onClick={beiLoeschen}>
              Löschen
            </button>
          )}
          <button className={s.popFertig} onClick={() => beiSpeichern(w)}>
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}
