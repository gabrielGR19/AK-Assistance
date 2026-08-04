"use client";

import { useEffect, useRef, useState } from "react";
import type { Label } from "@/lib/kalender-typen";
import s from "./kalender.module.css";

export interface LabelWerte {
  name: string;
  farbe: string;
  arbeit: boolean;
  gruppe: Label["gruppe"];
}

interface Props {
  werte: LabelWerte;
  istNeu: boolean;
  fehler: string | null;
  beiSpeichern: (werte: LabelWerte) => void;
  beiLoeschen: () => void;
  beiSchliessen: () => void;
}

// Anlegen/Bearbeiten eines Labels — als zentrierter Dialog statt an einer Klickposition
// verankert, weil er aus der Seitenleiste kommt und keinen Bezugspunkt im Raster hat.
export function LabelEditor({ werte: start, istNeu, fehler, beiSpeichern, beiLoeschen, beiSchliessen }: Props) {
  const [w, setW] = useState<LabelWerte>(start);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  function aendere<K extends keyof LabelWerte>(feld: K, wert: LabelWerte[K]) {
    setW((alt) => ({ ...alt, [feld]: wert }));
  }

  return (
    <div className={s.ueberlagerung} onPointerDown={beiSchliessen}>
      <div
        className={`${s.pop} ${s.popZentriert}`}
        role="dialog"
        aria-label={istNeu ? "Neues Label" : "Label bearbeiten"}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") beiSchliessen();
          if (e.key === "Enter") {
            e.preventDefault();
            beiSpeichern(w);
          }
        }}
      >
        <h3 className={s.popTitel}>{istNeu ? "Neues Label" : "Label"}</h3>

        <input
          ref={nameRef}
          type="text"
          className={s.popFeld}
          placeholder="Name"
          value={w.name}
          autoComplete="off"
          onChange={(e) => aendere("name", e.target.value)}
        />

        <label className={s.popLabel} htmlFor="lb-farbe">
          Farbe
        </label>
        <input
          id="lb-farbe"
          type="color"
          className={s.popFeld}
          value={w.farbe}
          onChange={(e) => aendere("farbe", e.target.value)}
        />

        <label className={s.popLabel} htmlFor="lb-gruppe">
          Gruppe
        </label>
        <select
          id="lb-gruppe"
          className={s.popFeld}
          value={w.gruppe}
          onChange={(e) => aendere("gruppe", e.target.value as Label["gruppe"])}
        >
          <option value="firma">AK Assistance</option>
          <option value="uebrige">Übrige</option>
        </select>

        <label className={s.popLabel} htmlFor="lb-arbeit">
          <input
            id="lb-arbeit"
            type="checkbox"
            checked={w.arbeit}
            onChange={(e) => aendere("arbeit", e.target.checked)}
          />{" "}
          Zählt aufs Tagespensum
        </label>

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
