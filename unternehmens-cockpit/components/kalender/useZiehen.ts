"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  minuteAusPosition,
  neueEndMinute,
  neueStartMinute,
  neuerZeitraum,
  pageYMitScroll,
  spalteAusPosition,
  RASTER_MIN,
  type RasterMass,
  type SpaltenMass,
} from "./geometrie.ts";

export type ZugArt = "verschieben" | "groesse" | "neu";

// Laufender Zug samt Vorschauwerten. Solange er läuft, zeigt das Raster diese Werte an;
// gespeichert wird erst beim Loslassen.
export interface Zug {
  art: ZugArt;
  terminId: string | null;
  datum: string;
  vonMin: number;
  bisMin: number;
  bewegt: boolean;
}

export interface ZugStart {
  art: ZugArt;
  terminId: string | null;
  datum: string;
  vonMin: number;
  bisMin: number;
}

interface Optionen {
  // Element, das die Tagesspalten enthält. Wird beim Drücken EINMAL vermessen.
  rasterEl: () => HTMLElement | null;
  // Der Bereich, in dem das Raster scrollt. Von ihm wird während des Zugs nur `scrollTop`
  // gelesen — ein Zahlenwert eines stabilen Elements, keine Geometrie.
  scrollEl: () => HTMLElement | null;
  // Wird beim Loslassen aufgerufen, wenn wirklich gezogen wurde.
  beiFertig: (zug: Zug) => void;
  // Wird beim Loslassen aufgerufen, wenn sich nichts bewegt hat (reiner Klick).
  beiKlick: (terminId: string | null) => void;
}

/**
 * Ziehen, Größe ändern und Aufziehen im Zeitraster.
 *
 * Der entscheidende Punkt: Rasterfläche und Spaltengrenzen werden **einmalig beim Drücken**
 * der Maustaste vermessen und für die Dauer des Zugs festgehalten. Während der Bewegung wird
 * nichts mehr aus dem DOM gelesen. Genau dort lag der Fehler des Vorgängers — der las die
 * Position aus einem Element, das ein zwischenzeitliches Neuzeichnen ersetzt hatte, bekam
 * lauter Nullen zurück und schob Termine dadurch auf 05:30 aus dem sichtbaren Bereich.
 *
 * Aus demselben Grund gibt es kein setPointerCapture: Wird das erfassende Element ersetzt,
 * geht die Erfassung verloren und das Loslassen kommt nie an. Listener auf `window` bekommen
 * jede Bewegung, auch außerhalb des Fensters.
 */
export function useZiehen({ rasterEl, scrollEl, beiFertig, beiKlick }: Optionen) {
  const [zug, setZug] = useState<Zug | null>(null);

  // Alles, was während eines Zugs unveränderlich bleibt.
  const mass = useRef<{
    raster: RasterMass;
    spalten: SpaltenMass[];
    griffMin: number;
    ur: ZugStart;
    scrollBeimStart: number;
  } | null>(null);
  // Der Zug auch als Ref, damit die window-Handler ihn ohne Neuregistrierung lesen können.
  const zugRef = useRef<Zug | null>(null);
  const setzeZug = useCallback((z: Zug | null) => {
    zugRef.current = z;
    setZug(z);
  }, []);

  const beginne = useCallback(
    (e: React.PointerEvent, start: ZugStart) => {
      // Nur die linke Maustaste zieht; Rechtsklick und Mittelklick bleiben unberührt.
      if (e.button !== 0) return;

      const el = rasterEl();
      if (!el) return;

      const rect = el.getBoundingClientRect();
      // Dokumentkoordinaten statt Fensterkoordinaten: so bleibt die Rechnung korrekt,
      // wenn während des Ziehens gescrollt wird.
      const raster: RasterMass = { obenAbsolut: rect.top + window.scrollY, hoehe: rect.height };

      const spalten: SpaltenMass[] = Array.from(el.querySelectorAll<HTMLElement>("[data-datum]")).map((sp) => {
        const r = sp.getBoundingClientRect();
        return {
          datum: sp.dataset.datum as string,
          linksAbsolut: r.left + window.scrollX,
          rechtsAbsolut: r.right + window.scrollX,
        };
      });

      const griffMin = minuteAusPosition(e.pageY, raster);
      mass.current = { raster, spalten, griffMin, ur: start, scrollBeimStart: scrollEl()?.scrollTop ?? 0 };

      setzeZug({ ...start, bewegt: false });
      e.preventDefault();
    },
    [rasterEl, scrollEl, setzeZug],
  );

  useEffect(() => {
    if (!zug) return;

    function beiBewegung(e: PointerEvent) {
      const m = mass.current;
      const aktuell = zugRef.current;
      if (!m || !aktuell) return;

      const zeigerMin = minuteAusPosition(
        pageYMitScroll(e.pageY, m.scrollBeimStart, scrollEl()?.scrollTop ?? m.scrollBeimStart),
        m.raster,
      );

      if (m.ur.art === "neu") {
        const { von, bis } = neuerZeitraum(m.griffMin, zeigerMin);
        setzeZug({ ...aktuell, vonMin: von, bisMin: bis, bewegt: Math.abs(zeigerMin - m.griffMin) >= RASTER_MIN });
        return;
      }

      const bewegt = aktuell.bewegt || Math.abs(zeigerMin - m.griffMin) >= RASTER_MIN;

      if (m.ur.art === "groesse") {
        // Beim Größenziehen bleibt der Tag fest — nur das Ende folgt dem Zeiger.
        const bis = neueEndMinute(m.ur.vonMin, m.ur.bisMin, m.griffMin, zeigerMin);
        setzeZug({ ...aktuell, vonMin: m.ur.vonMin, bisMin: bis, bewegt });
        return;
      }

      const von = neueStartMinute(m.ur.vonMin, m.ur.bisMin, m.griffMin, zeigerMin);
      const datum = spalteAusPosition(e.pageX, m.spalten) ?? m.ur.datum;
      const bewegtGesamt = bewegt || datum !== m.ur.datum;
      setzeZug({ ...aktuell, datum, vonMin: von, bisMin: von + (m.ur.bisMin - m.ur.vonMin), bewegt: bewegtGesamt });
    }

    function beiLoslassen() {
      const fertig = zugRef.current;
      const m = mass.current;
      setzeZug(null);
      mass.current = null;
      if (!fertig || !m) return;

      if (fertig.art === "neu" || fertig.bewegt) {
        beiFertig(fertig);
      } else {
        // Kein Versatz: der Termin bleibt exakt liegen, es öffnet sich nur der Editor.
        beiKlick(fertig.terminId);
      }
    }

    // Abbruch (Systemgeste, verlorener Zeiger, Escape) verwirft die Vorschau, ohne zu speichern.
    function abbrechen() {
      setzeZug(null);
      mass.current = null;
    }
    function beiTaste(e: KeyboardEvent) {
      if (e.key === "Escape") abbrechen();
    }

    window.addEventListener("pointermove", beiBewegung);
    window.addEventListener("pointerup", beiLoslassen);
    window.addEventListener("pointercancel", abbrechen);
    window.addEventListener("keydown", beiTaste);
    return () => {
      window.removeEventListener("pointermove", beiBewegung);
      window.removeEventListener("pointerup", beiLoslassen);
      window.removeEventListener("pointercancel", abbrechen);
      window.removeEventListener("keydown", beiTaste);
    };
    // Absichtlich nur an "läuft ein Zug?" gebunden: die Handler lesen den aktuellen Stand
    // über zugRef, damit sie nicht bei jeder Mausbewegung neu registriert werden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zug !== null, beiFertig, beiKlick, setzeZug, scrollEl]);

  return { zug, beginne };
}
