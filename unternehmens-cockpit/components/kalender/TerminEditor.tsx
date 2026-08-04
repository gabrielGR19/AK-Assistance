"use client";

import { useEffect, useRef, useState } from "react";
import type { Label, LabelSchluessel, Wochentag } from "@/lib/kalender-typen";
import s from "./kalender.module.css";

export type Wiederholungswahl = "nie" | "taeglich" | "wochentage";

export interface EditorWerte {
  titel: string;
  label: LabelSchluessel;
  notiz: string;
  datum: string;
  start: string;
  ende: string;
  wiederholung: Wiederholungswahl;
  tage: Wochentag[];
  endDatum: string;
}

interface Props {
  werte: EditorWerte;
  labels: Label[];
  // Neuer Termin: Serienfelder sichtbar, Löschen versteckt.
  istNeu: boolean;
  // Gehört der Eintrag zu einer Serie? Dann fragen Speichern/Löschen nach dem Umfang.
  ausSerie: boolean;
  position: { links: number; oben: number };
  fehler: string | null;
  beiSpeichern: (werte: EditorWerte, umfang: "einzeln" | "serie") => void;
  beiLoeschen: (umfang: "einzeln" | "serie") => void;
  beiSchliessen: () => void;
}

const WOCHENTAGE: { wert: Wochentag; kurz: string }[] = [
  { wert: 1, kurz: "Mo" },
  { wert: 2, kurz: "Di" },
  { wert: 3, kurz: "Mi" },
  { wert: 4, kurz: "Do" },
  { wert: 5, kurz: "Fr" },
  { wert: 6, kurz: "Sa" },
  { wert: 7, kurz: "So" },
];

// Bearbeiten eines Termins. Bei Serien-Vorkommen erscheint zusätzlich die Frage, ob die
// Änderung nur diesen Tag oder die ganze Serie betreffen soll.
export function TerminEditor({
  werte: start,
  labels,
  istNeu,
  ausSerie,
  position,
  fehler,
  beiSpeichern,
  beiLoeschen,
  beiSchliessen,
}: Props) {
  const [w, setW] = useState<EditorWerte>(start);
  const [frage, setFrage] = useState<"speichern" | "loeschen" | null>(null);
  const titelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setW(start);
    setFrage(null);
  }, [start]);

  useEffect(() => {
    titelRef.current?.focus();
    titelRef.current?.select();
  }, []);

  function aendere<K extends keyof EditorWerte>(feld: K, wert: EditorWerte[K]) {
    setW((alt) => ({ ...alt, [feld]: wert }));
  }

  function speichern() {
    if (ausSerie) setFrage("speichern");
    else beiSpeichern(w, "einzeln");
  }

  function loeschen() {
    if (ausSerie) setFrage("loeschen");
    else beiLoeschen("einzeln");
  }

  return (
    <div
      className={s.pop}
      role="dialog"
      aria-label={istNeu ? "Neuer Termin" : "Termin bearbeiten"}
      style={{ left: position.links, top: position.oben }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") beiSchliessen();
        if (e.key === "Enter" && e.currentTarget.contains(e.target as Node)) {
          const ziel = e.target as HTMLElement;
          if (ziel.tagName !== "TEXTAREA" && !frage) {
            e.preventDefault();
            speichern();
          }
        }
      }}
    >
      {frage ? (
        <div className={s.popFrage}>
          <h3 className={s.popTitel}>
            {frage === "loeschen" ? "Was soll gelöscht werden?" : "Was soll geändert werden?"}
          </h3>
          <p className={s.popHinweis}>Dieser Termin gehört zu einer Serie.</p>
          <div className={s.popFrageKnoepfe}>
            <button
              className="btn"
              onClick={() => (frage === "loeschen" ? beiLoeschen("einzeln") : beiSpeichern(w, "einzeln"))}
            >
              Nur diesen Termin
            </button>
            <button
              className="btn"
              onClick={() => (frage === "loeschen" ? beiLoeschen("serie") : beiSpeichern(w, "serie"))}
            >
              Ganze Serie
            </button>
            <button className={s.popAbbruch} onClick={() => setFrage(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className={s.popTitel}>{istNeu ? "Neuer Termin" : "Termin"}</h3>

          <input
            ref={titelRef}
            type="text"
            className={s.popFeld}
            placeholder="Titel"
            value={w.titel}
            autoComplete="off"
            onChange={(e) => aendere("titel", e.target.value)}
          />

          <label className={s.popLabel} htmlFor="ed-label">
            Kalender
          </label>
          <select
            id="ed-label"
            className={s.popFeld}
            value={w.label}
            onChange={(e) => aendere("label", e.target.value as LabelSchluessel)}
          >
            {labels.map((L) => (
              <option key={L.id} value={L.id}>
                {L.name}
              </option>
            ))}
          </select>

          <label className={s.popLabel}>Zeit</label>
          <input
            type="date"
            className={s.popFeld}
            value={w.datum}
            onChange={(e) => aendere("datum", e.target.value)}
          />
          <div className={s.popZeile}>
            <input
              type="time"
              className={s.popFeld}
              step={300}
              value={w.start}
              onChange={(e) => aendere("start", e.target.value)}
            />
            <input
              type="time"
              className={s.popFeld}
              step={300}
              value={w.ende}
              onChange={(e) => aendere("ende", e.target.value)}
            />
          </div>

          {/* Wiederholung nur beim Anlegen und beim Bearbeiten einer bestehenden Serie —
              ein einzelner Altbestand-Termin lässt sich nicht nachträglich zur Serie machen. */}
          {(istNeu || ausSerie) && (
            <>
              <label className={s.popLabel} htmlFor="ed-wdh">
                Wiederholen
              </label>
              <select
                id="ed-wdh"
                className={s.popFeld}
                value={w.wiederholung}
                onChange={(e) => aendere("wiederholung", e.target.value as Wiederholungswahl)}
              >
                <option value="nie">nie</option>
                <option value="taeglich">jeden Tag</option>
                <option value="wochentage">an bestimmten Wochentagen</option>
              </select>

              {w.wiederholung === "wochentage" && (
                <div className={s.tageWahl}>
                  {WOCHENTAGE.map((t) => {
                    const an = w.tage.includes(t.wert);
                    return (
                      <button
                        key={t.wert}
                        type="button"
                        className={`${s.tagKnopf}${an ? " " + s.tagKnopfAn : ""}`}
                        aria-pressed={an}
                        onClick={() =>
                          aendere(
                            "tage",
                            an ? w.tage.filter((x) => x !== t.wert) : [...w.tage, t.wert].sort((a, b) => a - b),
                          )
                        }
                      >
                        {t.kurz}
                      </button>
                    );
                  })}
                </div>
              )}

              {w.wiederholung !== "nie" && (
                <>
                  <label className={s.popLabel} htmlFor="ed-ende">
                    Bis (leer = unbefristet)
                  </label>
                  <input
                    id="ed-ende"
                    type="date"
                    className={s.popFeld}
                    value={w.endDatum}
                    onChange={(e) => aendere("endDatum", e.target.value)}
                  />
                </>
              )}
            </>
          )}

          <label className={s.popLabel} htmlFor="ed-notiz">
            Notiz
          </label>
          <textarea
            id="ed-notiz"
            className={`${s.popFeld} ${s.popNotiz}`}
            placeholder="Worauf zahlt das ein?"
            value={w.notiz}
            onChange={(e) => aendere("notiz", e.target.value)}
          />

          {fehler && <p className={s.popFehler}>{fehler}</p>}

          <div className={s.popFuss}>
            {!istNeu && (
              <button className={s.popLoeschen} onClick={loeschen}>
                Löschen
              </button>
            )}
            <button className={s.popFertig} onClick={speichern}>
              Fertig
            </button>
          </div>
        </>
      )}
    </div>
  );
}
