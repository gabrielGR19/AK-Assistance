"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Ganztags, LabelSchluessel, PersonId, Reflexion, Serie, Termin, Vorlage } from "@/lib/kalender-typen";
import { LABELS, istLabel } from "@/lib/kalender-typen";
import { MONATE, WOCHENTAG, iso, montagVon, plusTage } from "./datum";
import { Zeitraster, type ZugErgebnis } from "./Zeitraster";
import { alsUhrzeit } from "./geometrie.ts";
import { KalenderSeitenleiste } from "./KalenderSeitenleiste";
import { MonatsAnsicht } from "./MonatsAnsicht";
import { TerminEditor, type EditorWerte } from "./TerminEditor";
import { stundenText } from "./pensum.ts";
import { Zielleiste } from "./Zielleiste";
import { Miniziel } from "./Miniziel";
import * as api from "./kalenderApi.ts";
import s from "./kalender.module.css";

export type Ansicht = "tag" | "woche" | "monat";

export interface KalenderDaten {
  ich: PersonId;
  aenderungszaehler: number;
  termine: Termin[];
  ganztags: Ganztags[];
  serien: Serie[];
  // Tagesabschlüsse und Pensum-Soll beider Personen; angezeigt wird jeweils das eigene.
  reflexionen: Record<PersonId, Record<string, Reflexion>>;
  pensumSoll: Record<PersonId, number>;
  vorlagen: Vorlage[];
}

// Was die Route tatsächlich liefert: `ich` ist dort `PersonId | null`. Null bedeutet, dass
// der Basic-Auth-Benutzername keiner Kalenderperson entspricht (COCKPIT_BENUTZERNAMEN
// enthält einen Namen ausser gabriel/moritz). Dieser Fall wird beim Laden abgefangen —
// unterhalb davon rechnet die Ansicht mit einer echten Person, sonst würde jeder Zugriff
// auf reflexionen[null] die ganze Seite abstürzen lassen.
type KalenderAntwort = Omit<KalenderDaten, "ich"> & { ich: PersonId | null };

const POLL_MS = 8000;

// Nur Ansichtszustand dieses Browsers, keine geteilten Daten.
const SPEICHER_LABEL = "kalender-ausgeblendet";

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
  // Startdatum der Serie, wie es gespeichert ist. Muss mitgeführt werden, weil der Editor
  // immer das Datum des ANGEKLICKTEN Vorkommens zeigt: würde man das beim Ändern der ganzen
  // Serie als neues Startdatum schicken, verschwänden alle früheren Vorkommen.
  serieStartDatum: string | null;
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
  // Ausgeblendete Label sind reiner Ansichtszustand dieses Browsers — sie gehören nicht in
  // die geteilte Datei, sonst blendet Gabriel Moritz etwas aus.
  const [ausgeblendet, setAusgeblendet] = useState<Set<LabelSchluessel>>(() => new Set());
  // Anmeldename gehört zu keiner Kalenderperson — dann gibt es nichts anzuzeigen.
  const [keinZugang, setKeinZugang] = useState(false);
  const zaehlerRef = useRef<number | null>(null);
  const ziehtRef = useRef(false);
  const ladenRef = useRef<(() => void) | null>(null);
  const dateiRef = useRef<HTMLInputElement>(null);

  const { von, bis } = zeitraum(ansicht, anker);

  // Erst nach dem ersten Rendern lesen: auf dem Server gibt es kein localStorage, und ein
  // abweichender erster Aufbau würde die Hydration zerschießen.
  useEffect(() => {
    try {
      const roh = localStorage.getItem(SPEICHER_LABEL);
      if (roh) setAusgeblendet(new Set((JSON.parse(roh) as string[]).filter(istLabel)));
    } catch {
      // Unlesbarer Eintrag: dann eben alles sichtbar.
    }
  }, []);

  function labelUmschalten(k: LabelSchluessel) {
    setAusgeblendet((alt) => {
      const neu = new Set(alt);
      if (neu.has(k)) neu.delete(k);
      else neu.add(k);
      try {
        localStorage.setItem(SPEICHER_LABEL, JSON.stringify([...neu]));
      } catch {
        // Kein Speicher (privater Modus): die Auswahl gilt dann nur für diese Sitzung.
      }
      return neu;
    });
  }

  useEffect(() => {
    let aktiv = true;
    const laden = (erste: boolean) => {
      fetch(`/api/kalender?von=${von}&bis=${bis}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((antwort: KalenderAntwort | null) => {
          if (!aktiv || !antwort) return;
          if (antwort.ich === null) {
            setKeinZugang(true);
            return;
          }
          if (erste || antwort.aenderungszaehler !== zaehlerRef.current) {
            zaehlerRef.current = antwort.aenderungszaehler;
            // Neu aufbauen statt durchreichen: so weiss TypeScript, dass `ich` hier gesetzt ist.
            setDaten({ ...antwort, ich: antwort.ich });
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

  // Ausgeblendete Label werden einmal zentral herausgefiltert — danach rechnen Raster,
  // Monatsansicht und Pensum alle mit derselben Menge.
  const sichtbar = useMemo(
    () => (daten ? { ...daten, termine: daten.termine.filter((t) => !ausgeblendet.has(t.label)) } : null),
    [daten, ausgeblendet],
  );

  const eigeneVorlagen = useMemo(
    () => (daten ? daten.vorlagen.filter((v) => v.besitzer === daten.ich) : []),
    [daten],
  );

  function melde(text: string) {
    setMeldung(text);
    setTimeout(() => setMeldung(null), 4000);
  }

  function zeigeFehler(err: unknown) {
    melde(err instanceof Error ? err.message : "Die Änderung hat nicht geklappt.");
    neuLaden();
  }

  // Tagesabschluss: erst lokal setzen, dann schreiben. Ohne das lokale Vorziehen springt
  // der Haken kurz zurück, bis die Antwort da ist.
  const beiReflexion = useCallback(
    async (datum: string, ab: boolean, notiz: string) => {
      setDaten((d) =>
        d
          ? {
              ...d,
              reflexionen: { ...d.reflexionen, [d.ich]: { ...d.reflexionen[d.ich], [datum]: { ab, notiz } } },
            }
          : d,
      );
      try {
        await api.setzeReflexion(datum, ab, notiz);
        neuLaden();
      } catch (err) {
        zeigeFehler(err);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [neuLaden],
  );

  // Eine Schnellvorlage wurde im Raster abgelegt: Termin mit der hinterlegten Dauer anlegen.
  const beiVorlageAbgelegt = useCallback(
    async (tagIso: string, vonMin: number, nutzlast: string) => {
      let v: { titel?: unknown; label?: unknown; min?: unknown };
      try {
        v = JSON.parse(nutzlast);
      } catch {
        return; // Etwas anderes als eine Vorlage — ignorieren.
      }
      if (typeof v.titel !== "string" || !istLabel(v.label)) return;
      const dauer = typeof v.min === "number" && v.min > 0 ? Math.round(v.min) : 60;
      // So weit nach oben schieben, dass der Termin am selben Tag endet.
      const start = Math.max(0, Math.min(vonMin, 24 * 60 - dauer));

      try {
        await api.legeTerminAn({
          titel: v.titel,
          label: v.label,
          notiz: "",
          start: `${tagIso}T${alsUhrzeit(start)}`,
          ende: `${tagIso}T${alsUhrzeit(start + dauer)}`,
        });
        neuLaden();
      } catch (err) {
        zeigeFehler(err);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [neuLaden],
  );

  async function vorlageAnlegen() {
    const titel = window.prompt("Titel der Vorlage:");
    if (!titel?.trim()) return;
    const dauer = Number(window.prompt("Dauer in Minuten:", "60")?.trim());
    const label = window.prompt(`Label — ${Object.keys(LABELS).join(", ")}`, "gruendung")?.trim();
    if (!istLabel(label)) {
      melde("Unbekanntes Label.");
      return;
    }
    try {
      await api.legeVorlageAn({
        titel: titel.trim(),
        label,
        min: Number.isFinite(dauer) && dauer > 0 ? Math.round(dauer) : 60,
      });
      neuLaden();
    } catch (err) {
      zeigeFehler(err);
    }
  }

  async function vorlageLoeschen(id: string) {
    try {
      await api.loescheVorlage(id);
      neuLaden();
    } catch (err) {
      zeigeFehler(err);
    }
  }

  // "+" in der Seitenleiste: neuer Termin um 10:00 am ersten sichtbaren Tag, Editor auf.
  async function neuerTermin() {
    if (!daten) return;
    const tag = iso(tageDerAnsicht(ansicht === "monat" ? "tag" : ansicht, anker)[0]);
    try {
      const { termin } = await api.legeTerminAn({
        titel: "Neuer Termin",
        label: "gruendung",
        notiz: "",
        start: `${tag}T10:00`,
        ende: `${tag}T11:00`,
      });
      neuLaden();
      oeffneEditorFuer(termin, daten, { x: innerWidth / 2, y: innerHeight / 3 }, true);
    } catch (err) {
      zeigeFehler(err);
    }
  }

  // Sicherung herunterladen.
  function exportieren() {
    // Der Browser holt die Datei über die Route — Content-Disposition setzt den Dateinamen.
    window.location.href = "/api/kalender/export";
  }

  // Sicherung einspielen. Ersetzt nur die eigenen Einträge, siehe app/api/kalender/import.
  async function importieren(datei: File) {
    if (
      !window.confirm(
        `"${datei.name}" einspielen?\n\nDeine bisherigen Termine, Serien, ganztägigen Einträge und Vorlagen ` +
          `werden dabei ersetzt — und falls die Datei Tagesabschlüsse oder ein Tagespensum enthält, ` +
          `auch diese. Die Einträge der anderen Person bleiben unberührt.`,
      )
    ) {
      return;
    }
    try {
      const inhalt = JSON.parse(await datei.text());
      const bericht = await api.importiere(inhalt);
      neuLaden();
      melde(
        `Eingespielt: ${bericht.termine} Termine, ${bericht.serien} Serien, ${bericht.ganztags} ganztägig, ` +
          `${bericht.vorlagen} Vorlagen, ${bericht.reflexionen} Tagesabschlüsse` +
          (bericht.uebersprungen ? ` — ${bericht.uebersprungen} Einträge übersprungen.` : "."),
      );
    } catch (err) {
      melde(err instanceof Error ? err.message : "Die Datei konnte nicht gelesen werden.");
    }
  }

  // Tagespensum ändern — Eingabe in Stunden, gespeichert wird in Minuten.
  async function pensumAendern() {
    if (!daten) return;
    const eingabe = window.prompt("Tagespensum in Stunden:", stundenText(daten.pensumSoll[daten.ich]));
    if (eingabe === null) return;
    const stunden = Number(eingabe.trim().replace(",", "."));
    if (!Number.isFinite(stunden) || stunden < 0 || stunden > 24) {
      melde("Bitte eine Stundenzahl zwischen 0 und 24 eingeben.");
      return;
    }
    const minuten = Math.round(stunden * 60);
    setDaten((d) => (d ? { ...d, pensumSoll: { ...d.pensumSoll, [d.ich]: minuten } } : d));
    try {
      await api.setzePensum(minuten);
      neuLaden();
    } catch (err) {
      zeigeFehler(err);
    }
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
      // Nur wenn es die Serie noch gibt: ein herausgelöster Termin überlebt das Löschen
      // seiner Serie und ist danach ein ganz normaler Einzeltermin — die Auswahl
      // "nur dieser / ganze Serie" wäre dann eine Falle.
      serieId: serie ? serie.id : null,
      serieStartDatum: serie ? serie.startDatum : null,
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
          // Das bestehende Startdatum der Serie beibehalten — w.datum ist das Datum des
          // angeklickten Vorkommens und würde alle früheren Vorkommen abschneiden.
          startDatum: editor.serieStartDatum ?? w.datum,
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

  // Steht nach allen Hooks, damit die Aufrufreihenfolge über alle Renderdurchläufe gleich bleibt.
  if (keinZugang) {
    return (
      <main className="shell">
        <header className="seitenkopf">
          <h1 className="seitenkopf__titel">Kalender</h1>
        </header>
        <p>
          Dein Anmeldename gehört zu keiner Kalenderperson. Der Kalender kennt nur „gabriel" und
          „moritz" — melde dich mit einem dieser Namen an.
        </p>
      </main>
    );
  }

  return (
    <main className="shell shell--randlos" onPointerDown={() => editor && setEditor(null)}>
      {/* Kein Seitenkopf: die Navigation links zeigt bereits, wo man ist, und der Kalender
          bringt seine eigene Kopfzeile mit (Export/Import, Tag/Woche/Monat, Pensum). Eine
          zusätzliche Überschrift „Kalender" kostete nur Höhe — der Prototyp hat auch keine.
          Der Kalender bringt sein eigenes, dunkles Erscheinungsbild mit und füllt die
          Fläche neben der Navigation vollständig aus. */}
      <div className={s.kalender}>
        <KalenderSeitenleiste
          ausgeblendet={ausgeblendet}
          beiLabelWechsel={labelUmschalten}
          vorlagen={eigeneVorlagen}
          beiVorlageNeu={vorlageAnlegen}
          beiVorlageWeg={vorlageLoeschen}
          sichtbareTage={tageDerAnsicht(ansicht === "monat" ? "woche" : ansicht, anker)}
          beiTagWaehlen={(d) => {
            setAnker(d);
            setAnsicht("tag");
          }}
          beiNeuerTermin={neuerTermin}
        />

        <div className={s.hauptbereich}>
        <div className={s.werkzeugleiste}>
          <div className={s.werkzeug}>
            <button className={s.werkzeugBtn} title="Kalender als JSON sichern" onClick={exportieren}>
              Export
            </button>
            <button
              className={s.werkzeugBtn}
              title="Sicherung einspielen"
              onClick={() => dateiRef.current?.click()}
            >
              Import
            </button>
            <input
              ref={dateiRef}
              type="file"
              accept="application/json"
              hidden
              aria-label="Sicherung einspielen"
              onChange={(e) => {
                const datei = e.target.files?.[0];
                e.target.value = ""; // dieselbe Datei soll erneut wählbar sein
                if (datei) importieren(datei);
              }}
            />
          </div>
          <div className={s.segment} role="group" aria-label="Ansicht">
            {(["tag", "woche", "monat"] as const).map((a) => (
              <button key={a} className={s.segmentBtn} aria-pressed={ansicht === a} onClick={() => setAnsicht(a)}>
                {a === "tag" ? "Tag" : a === "woche" ? "Woche" : "Monat"}
              </button>
            ))}
          </div>
          {daten && (
            <button className={s.werkzeugBtn} title="Tagespensum ändern" onClick={pensumAendern}>
              Pensum: {stundenText(daten.pensumSoll[daten.ich])} h
            </button>
          )}
        </div>

        <Zielleiste />
        {daten && <Miniziel reflexionen={daten.reflexionen[daten.ich]} />}

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

        {!sichtbar && <p className={s.laedt}>Lade Kalender …</p>}

        {sichtbar && ansicht !== "monat" && (
          <Zeitraster
            tage={tageDerAnsicht(ansicht, anker)}
            daten={sichtbar}
            beiZugFertig={beiZugFertig}
            beiKlick={beiKlick}
            beiZiehtWechsel={beiZiehtWechsel}
            beiReflexion={beiReflexion}
            beiVorlageAbgelegt={beiVorlageAbgelegt}
          />
        )}

        {sichtbar && ansicht === "monat" && (
          <MonatsAnsicht
            anker={anker}
            daten={sichtbar}
            onTagWaehlen={(d) => {
              setAnker(d);
              setAnsicht("tag");
            }}
          />
        )}
        </div>
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
