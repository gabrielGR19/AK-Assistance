"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Ganztags, PersonId, Serie, Termin } from "@/lib/kalender-typen";
import { MONATE, WOCHENTAG, iso, montagVon, plusTage } from "./datum";
import { Zeitraster, type ZugErgebnis } from "./Zeitraster";
import { MonatsAnsicht } from "./MonatsAnsicht";
import { TerminEditor, type EditorWerte } from "./TerminEditor";
import * as api from "./kalenderApi.ts";
import s from "./kalender.module.css";

export type Ansicht = "tag" | "woche" | "monat";

export interface KalenderDaten {
  ich: PersonId;
  aenderungszaehler: number;
  termine: Termin[];
  ganztags: Ganztags[];
  serien: Serie[];
}

const POLL_MS = 8000;

export function tageDerAnsicht(ansicht: Ansicht, anker: Date): Date[] {
  if (ansicht === "tag") return [new Date(anker.getFullYear(), anker.getMonth(), anker.getDate())];
  const montag = montagVon(anker);
  return Array.from({ length: 7 }, (_, i) => plusTage(montag, i));
}

function zeitraum(ansicht: Ansicht, anker: Date): { von: string; bis: string } {
  if (ansicht === "monat") {
    const erster = new Date(anker.getFullYear(), anker.getMonth(), 1);
    const start = montagVon(erster);
    return { von: iso(start), bis: iso(plusTage(start, 41)) };
  }
  const tage = tageDerAnsicht(ansicht, anker);
  return { von: iso(tage[0]), bis: iso(tage[tage.length - 1]) };
}

function titelText(ansicht: Ansicht, anker: Date): string {
  if (ansicht === "monat") return `${MONATE[anker.getMonth()]} ${anker.getFullYear()}`;
  if (ansicht === "tag") {
    return `${WOCHENTAG[(anker.getDay() + 6) % 7]}, ${anker.getDate()}. ${MONATE[anker.getMonth()]} ${anker.getFullYear()}`;
  }
  const tage = tageDerAnsicht(ansicht, anker);
  const [a, b] = [tage[0], tage[6]];
  return a.getMonth() === b.getMonth()
    ? `${MONATE[a.getMonth()]} ${a.getFullYear()}`
    : `${MONATE[a.getMonth()].slice(0, 3)}–${MONATE[b.getMonth()]} ${b.getFullYear()}`;
}

interface EditorZustand {
  werte: EditorWerte;
  istNeu: boolean;
  terminId: string | null;
  serieId: string | null; // gesetzt, wenn der Eintrag zu einer Serie gehört
  vorkommenDatum: string | null;
  position: { links: number; oben: number };
  fehler: string | null;
}

export function KalenderAnsicht() {
  const [ansicht, setAnsicht] = useState<Ansicht>("woche");
  const [anker, setAnker] = useState(() => new Date());
  const [daten, setDaten] = useState<KalenderDaten | null>(null);
  const [editor, setEditor] = useState<EditorZustand | null>(null);
  const [meldung, setMeldung] = useState<string | null>(null);
  const zaehlerRef = useRef<number | null>(null);
  const ziehtRef = useRef(false);
  const ladenRef = useRef<(() => void) | null>(null);

  const { von, bis } = zeitraum(ansicht, anker);

  useEffect(() => {
    let aktiv = true;
    const laden = (erste: boolean) => {
      fetch(`/api/kalender?von=${von}&bis=${bis}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((antwort: KalenderDaten | null) => {
          if (!aktiv || !antwort) return;
          if (erste || antwort.aenderungszaehler !== zaehlerRef.current) {
            zaehlerRef.current = antwort.aenderungszaehler;
            setDaten(antwort);
          }
        })
        .catch(() => {
          // Nächster Poll versucht es erneut — kein Absturz der Ansicht.
        });
    };
    ladenRef.current = () => laden(true);
    laden(true);
    const timer = setInterval(() => {
      // Während eines Zugs nicht nachladen: ein Datenwechsel mitten in der Bewegung würde
      // die Vorschau unter dem Zeiger wegziehen.
      if (!ziehtRef.current) laden(false);
    }, POLL_MS);
    return () => {
      aktiv = false;
      clearInterval(timer);
    };
  }, [von, bis]);

  const neuLaden = useCallback(() => ladenRef.current?.(), []);

  function zeigeFehler(err: unknown) {
    setMeldung(err instanceof Error ? err.message : "Die Änderung hat nicht geklappt.");
    setTimeout(() => setMeldung(null), 4000);
    neuLaden();
  }

  // Ein Zug ist zu Ende: genau einen Eintrag schreiben.
  const beiZugFertig = useCallback(
    async (e: ZugErgebnis) => {
      if (!daten) return;
      const eingabe = (titel: string, label: Termin["label"], notiz: string) => ({
        titel,
        label,
        notiz,
        start: `${e.datum}T${e.start}`,
        ende: `${e.datum}T${e.ende}`,
      });

      try {
        if (e.neu) {
          const { termin } = await api.legeTerminAn(eingabe("Neuer Termin", "gruendung", ""));
          neuLaden();
          oeffneEditorFuer(termin, daten, { x: innerWidth / 2, y: innerHeight / 3 }, true);
          return;
        }

        const alt = daten.termine.find((t) => t.id === e.terminId);
        if (!alt) return;

        if (alt.ausSerie && alt.id.startsWith("serie:")) {
          // Ein Serien-Vorkommen verschieben betrifft nur diesen Tag — wie bei Apple.
          await api.aendereVorkommen(
            alt.ausSerie.serieId,
            alt.ausSerie.datum,
            eingabe(alt.titel, alt.label, alt.notiz),
          );
        } else {
          await api.aendereTermin(alt.id, eingabe(alt.titel, alt.label, alt.notiz));
        }
        neuLaden();
      } catch (err) {
        zeigeFehler(err);
      }
    },
    [daten, neuLaden],
  );

  function oeffneEditorFuer(t: Termin, d: KalenderDaten, punkt: { x: number; y: number }, istNeu: boolean) {
    const serie = t.ausSerie ? d.serien.find((x) => x.id === t.ausSerie?.serieId) : undefined;
    setEditor({
      istNeu,
      terminId: t.id.startsWith("serie:") ? null : t.id,
      serieId: t.ausSerie?.serieId ?? null,
      vorkommenDatum: t.ausSerie?.datum ?? null,
      position: {
        links: Math.max(12, Math.min(punkt.x + 12, innerWidth - 310)),
        oben: Math.max(12, Math.min(punkt.y - 20, innerHeight - 420)),
      },
      fehler: null,
      werte: {
        titel: t.titel,
        label: t.label,
        notiz: t.notiz,
        datum: t.start.slice(0, 10),
        start: t.start.slice(11, 16),
        ende: t.ende.slice(11, 16),
        wiederholung: serie ? (serie.wiederholung.art === "taeglich" ? "taeglich" : "wochentage") : "nie",
        tage: serie && serie.wiederholung.art === "wochentage" ? serie.wiederholung.tage : [1, 2, 3, 4, 5],
        endDatum: serie?.endDatum ?? "",
      },
    });
  }

  // Klick ohne Bewegung auf einen bestehenden Termin: Editor öffnen, Termin bleibt liegen.
  const beiKlick = useCallback(
    (terminId: string | null, punkt: { x: number; y: number }) => {
      if (!daten) return;
      const t = daten.termine.find((x) => x.id === terminId);
      if (t) oeffneEditorFuer(t, daten, punkt, false);
    },
    [daten],
  );

  const beiZiehtWechsel = useCallback((zieht: boolean) => {
    ziehtRef.current = zieht;
  }, []);

  async function speichern(w: EditorWerte, umfang: "einzeln" | "serie") {
    if (!editor) return;
    const termin = {
      titel: w.titel.trim() || "Ohne Titel",
      label: w.label,
      notiz: w.notiz,
      start: `${w.datum}T${w.start}`,
      ende: `${w.datum}T${w.ende}`,
    };

    try {
      if (umfang === "serie" && editor.serieId) {
        await api.aendereSerie(editor.serieId, {
          titel: termin.titel,
          label: w.label,
          notiz: w.notiz,
          startDatum: w.datum,
          endDatum: w.endDatum || null,
          startZeit: w.start,
          endeZeit: w.ende,
          wiederholung: w.wiederholung === "wochentage" ? { art: "wochentage", tage: w.tage } : { art: "taeglich" },
        });
      } else if (editor.serieId && editor.vorkommenDatum && !editor.terminId) {
        // Virtuelles Vorkommen: als eigenständiger Termin herauslösen.
        await api.aendereVorkommen(editor.serieId, editor.vorkommenDatum, termin);
      } else if (editor.terminId) {
        await api.aendereTermin(editor.terminId, termin);
        // Aus einem frisch angelegten Einzeltermin eine Serie machen.
        if (w.wiederholung !== "nie" && !editor.serieId) {
          await api.legeSerieAn({
            titel: termin.titel,
            label: w.label,
            notiz: w.notiz,
            startDatum: w.datum,
            endDatum: w.endDatum || null,
            startZeit: w.start,
            endeZeit: w.ende,
            wiederholung: w.wiederholung === "wochentage" ? { art: "wochentage", tage: w.tage } : { art: "taeglich" },
          });
          await api.loescheTermin(editor.terminId);
        }
      }
      setEditor(null);
      neuLaden();
    } catch (err) {
      setEditor((e) => (e ? { ...e, fehler: err instanceof Error ? err.message : "Speichern fehlgeschlagen." } : e));
    }
  }

  async function loeschen(umfang: "einzeln" | "serie") {
    if (!editor) return;
    try {
      if (umfang === "serie" && editor.serieId) await api.loescheSerie(editor.serieId);
      else if (editor.serieId && editor.vorkommenDatum && !editor.terminId) {
        await api.aendereVorkommen(editor.serieId, editor.vorkommenDatum);
      } else if (editor.terminId) await api.loescheTermin(editor.terminId);
      setEditor(null);
      neuLaden();
    } catch (err) {
      setEditor((e) => (e ? { ...e, fehler: err instanceof Error ? err.message : "Löschen fehlgeschlagen." } : e));
    }
  }

  function blaettern(richtung: 1 | -1) {
    setAnker((a) => {
      if (ansicht === "tag") return plusTage(a, richtung);
      if (ansicht === "woche") return plusTage(a, 7 * richtung);
      return new Date(a.getFullYear(), a.getMonth() + richtung, 1);
    });
  }

  useEffect(() => {
    function aufTaste(e: KeyboardEvent) {
      const ziel = e.target as HTMLElement | null;
      if (ziel?.matches("input, textarea, select")) return;
      if (e.key === "ArrowLeft") {
        blaettern(-1);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        blaettern(1);
        e.preventDefault();
      } else if (e.key === "t" || e.key === "T") setAnsicht("tag");
      else if (e.key === "w" || e.key === "W") setAnsicht("woche");
      else if (e.key === "m" || e.key === "M") setAnsicht("monat");
    }
    document.addEventListener("keydown", aufTaste);
    return () => document.removeEventListener("keydown", aufTaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ansicht]);

  return (
    <main className="shell" onPointerDown={() => editor && setEditor(null)}>
      <header className="seitenkopf">
        <h1 className="seitenkopf__titel">Kalender</h1>
      </header>

      {/* Der Kalender bringt sein eigenes, dunkles Erscheinungsbild mit (wie der Prototyp)
          und steht deshalb in einem eigenen Kasten innerhalb der hellen Cockpit-Seite. */}
      <div className={s.kalender}>
        <div className={s.werkzeugleiste}>
          <div className={s.segment} role="group" aria-label="Ansicht">
            {(["tag", "woche", "monat"] as const).map((a) => (
              <button key={a} className={s.segmentBtn} aria-pressed={ansicht === a} onClick={() => setAnsicht(a)}>
                {a === "tag" ? "Tag" : a === "woche" ? "Woche" : "Monat"}
              </button>
            ))}
          </div>
        </div>

        <div className={s.titelzeile}>
          <h2 className={s.titel}>{titelText(ansicht, anker)}</h2>
          <div className={s.nav}>
            <button aria-label="Zurück" onClick={() => blaettern(-1)}>
              ‹
            </button>
            <button onClick={() => setAnker(new Date())}>Heute</button>
            <button aria-label="Vor" onClick={() => blaettern(1)}>
              ›
            </button>
          </div>
        </div>

        {!daten && <p className={s.laedt}>Lade Kalender …</p>}

        {daten && ansicht !== "monat" && (
          <Zeitraster
            tage={tageDerAnsicht(ansicht, anker)}
            daten={daten}
            beiZugFertig={beiZugFertig}
            beiKlick={beiKlick}
            beiZiehtWechsel={beiZiehtWechsel}
          />
        )}

        {daten && ansicht === "monat" && (
          <MonatsAnsicht
            anker={anker}
            daten={daten}
            onTagWaehlen={(d) => {
              setAnker(d);
              setAnsicht("tag");
            }}
          />
        )}
      </div>

      {editor && (
        <TerminEditor
          werte={editor.werte}
          istNeu={editor.istNeu}
          ausSerie={editor.serieId !== null}
          position={editor.position}
          fehler={editor.fehler}
          beiSpeichern={speichern}
          beiLoeschen={loeschen}
          beiSchliessen={() => setEditor(null)}
        />
      )}

      {meldung && <div className={s.hinweis}>{meldung}</div>}
    </main>
  );
}
