"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  autoScrollSchritt,
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
    // Ober- und Unterkante des Scrollbereichs in Fensterkoordinaten, ebenfalls einmalig beim
    // Drücken gemessen. Der Bereich verschiebt sich während eines Zugs nicht — nur sein
    // scrollTop ändert sich, und das ist eine Zahl, keine Geometrie.
    sichtOben: number;
    sichtUnten: number;
  } | null>(null);
  // Letzte bekannte Zeigerposition. Beim automatischen Mitscrollen bewegt sich die Maus
  // nicht, es kommen also keine pointermove-Ereignisse mehr — gerechnet wird dann mit
  // diesen Werten weiter.
  const zeiger = useRef({ pageX: 0, pageY: 0, fensterY: 0 });
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
      const scrollBereich = scrollEl();
      const sicht = scrollBereich?.getBoundingClientRect();
      mass.current = {
        raster,
        spalten,
        griffMin,
        ur: start,
        scrollBeimStart: scrollBereich?.scrollTop ?? 0,
        sichtOben: sicht?.top ?? 0,
        sichtUnten: sicht?.bottom ?? 0,
      };
      zeiger.current = { pageX: e.pageX, pageY: e.pageY, fensterY: e.clientY };

      setzeZug({ ...start, bewegt: false });
      e.preventDefault();
    },
    [rasterEl, scrollEl, setzeZug],
  );

  useEffect(() => {
    if (!zug) return;

    // Rechnet die Vorschau aus der zuletzt bekannten Zeigerposition neu. Wird sowohl bei
    // jeder Mausbewegung aufgerufen als auch von der Scroll-Schleife, wenn der Bereich unter
    // dem stillstehenden Zeiger weiterwandert.
    function aktualisiere() {
      const m = mass.current;
      const aktuell = zugRef.current;
      if (!m || !aktuell) return;

      const zeigerMin = minuteAusPosition(
        pageYMitScroll(zeiger.current.pageY, m.scrollBeimStart, scrollEl()?.scrollTop ?? m.scrollBeimStart),
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
      const datum = spalteAusPosition(zeiger.current.pageX, m.spalten) ?? m.ur.datum;
      const bewegtGesamt = bewegt || datum !== m.ur.datum;
      setzeZug({ ...aktuell, datum, vonMin: von, bisMin: von + (m.ur.bisMin - m.ur.vonMin), bewegt: bewegtGesamt });
    }

    function beiBewegung(e: PointerEvent) {
      zeiger.current = { pageX: e.pageX, pageY: e.pageY, fensterY: e.clientY };
      aktualisiere();
    }

    // Läuft für die Dauer des Zugs mit und rückt den Scrollbereich nach, solange der Zeiger
    // im Randstreifen steht.
    //
    // Gerechnet wird mit der tatsächlich vergangenen Zeit, nicht je Bild — sonst hinge die
    // Geschwindigkeit an der Bildwiederholrate des Monitors. `rest` sammelt den Bruchteil
    // unter einem Pixel auf, sonst verschluckt das Abrunden bei langsamem Ziehen jede
    // Bewegung. Neu gerechnet wird nur, wenn sich scrollTop wirklich geändert hat — am
    // Anschlag bliebe es sonst bei einem Neuzeichnen je Bild ohne jede Wirkung.
    let bild = 0;
    let letzteZeit = 0;
    let rest = 0;
    function schleife(zeit: number) {
      const m = mass.current;
      const bereich = scrollEl();
      const dt = letzteZeit ? Math.min(zeit - letzteZeit, 100) : 0; // Sprung nach Tabwechsel deckeln
      letzteZeit = zeit;

      if (m && bereich && dt > 0) {
        const proSekunde = autoScrollSchritt(zeiger.current.fensterY, m.sichtOben, m.sichtUnten);
        if (proSekunde === 0) {
          rest = 0;
        } else {
          rest += (proSekunde * dt) / 1000;
          const ganze = Math.trunc(rest);
          if (ganze !== 0) {
            rest -= ganze;
            const vorher = bereich.scrollTop;
            bereich.scrollTop = vorher + ganze;
            if (bereich.scrollTop !== vorher) aktualisiere();
          }
        }
      }
      bild = requestAnimationFrame(schleife);
    }
    bild = requestAnimationFrame(schleife);

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
      cancelAnimationFrame(bild);
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
