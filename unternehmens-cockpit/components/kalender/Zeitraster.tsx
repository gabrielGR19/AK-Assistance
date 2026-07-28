"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PERSONEN, type PersonId, type Termin } from "@/lib/kalender-typen";
import type { KalenderDaten } from "./KalenderAnsicht";
import { WOCHENTAG, ausIso, iso, minutenAmTag } from "./datum";
import { RASTER_HOEHE, alsUhrzeit } from "./geometrie.ts";
import { Tagesspalte } from "./Tagesspalte";
import { Reflexionszeile } from "./Reflexionszeile";
import { pensumAm, stundenText } from "./pensum.ts";
import { useZiehen, type Zug, type ZugStart } from "./useZiehen.ts";
import { STUNDE_BIS, STUNDE_VON, SPUR } from "./datum";
import s from "./kalender.module.css";

export interface ZugErgebnis {
  terminId: string | null;
  datum: string;
  start: string; // "HH:MM"
  ende: string; // "HH:MM"
  neu: boolean;
}

interface Props {
  tage: Date[];
  daten: KalenderDaten;
  // Ein Zug ist zu Ende und soll gespeichert werden.
  beiZugFertig: (e: ZugErgebnis) => void;
  // Klick ohne Bewegung auf einen bestehenden Termin: Editor öffnen.
  beiKlick: (terminId: string | null, punkt: { x: number; y: number }) => void;
  // Meldet, ob gerade gezogen wird — währenddessen pausiert das Daten-Polling.
  beiZiehtWechsel: (zieht: boolean) => void;
  // Ein Tagesabschluss wurde gesetzt oder geändert.
  beiReflexion: (datum: string, ab: boolean, notiz: string) => void;
  // Eine Schnellvorlage wurde im Raster abgelegt.
  beiVorlageAbgelegt: (tagIso: string, vonMin: number, nutzlast: string) => void;
}

// Der gezogene Termin wird während der Bewegung mit den Vorschauwerten dargestellt und
// erscheint bei einem Tageswechsel sofort in der neuen Spalte.
function mitVorschau(termine: Termin[], zug: Zug | null): Termin[] {
  if (!zug || !zug.terminId) return termine;
  return termine.map((t) =>
    t.id === zug.terminId
      ? { ...t, start: `${zug.datum}T${alsUhrzeit(zug.vonMin)}`, ende: `${zug.datum}T${alsUhrzeit(zug.bisMin)}` }
      : t,
  );
}

// Tag-/Wochenansicht: Kopfzeile mit Aufklapp-Schalter, Ganztags-Zeile, Stundenraster mit
// Terminblöcken und nachgeführter Jetzt-Linie. 06:00–24:00, 84px pro Stunde.
export function Zeitraster({
  tage,
  daten,
  beiZugFertig,
  beiKlick,
  beiZiehtWechsel,
  beiReflexion,
  beiVorlageAbgelegt,
}: Props) {
  const [jetzt, setJetzt] = useState(() => new Date());
  // Tage, für die die Spalte der anderen Person aufgeklappt ist — bewusst pro Tag und nicht
  // global: eine Woche mit einem offenen Tag hat 8 Spalten und bleibt lesbar.
  const [offeneTage, setOffeneTage] = useState<Set<string>>(() => new Set());
  const rasterRef = useRef<HTMLDivElement>(null);

  // Eigene, leichte Uhr für die Jetzt-Linie — unabhängig vom Daten-Polling.
  useEffect(() => {
    const timer = setInterval(() => setJetzt(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const beiFertig = useCallback(
    (z: Zug) => {
      beiZugFertig({
        terminId: z.terminId,
        datum: z.datum,
        start: alsUhrzeit(z.vonMin),
        ende: alsUhrzeit(z.bisMin),
        neu: z.art === "neu",
      });
    },
    [beiZugFertig],
  );

  const zeigerRef = useRef({ x: 0, y: 0 });
  const klick = useCallback(
    (terminId: string | null) => {
      beiKlick(terminId, zeigerRef.current);
    },
    [beiKlick],
  );

  const { zug, beginne } = useZiehen({
    rasterEl: () => rasterRef.current,
    beiFertig,
    beiKlick: klick,
  });

  useEffect(() => {
    beiZiehtWechsel(zug !== null);
  }, [zug, beiZiehtWechsel]);

  // Merkt sich, wo zuletzt gedrückt wurde — der Editor öffnet dort statt in der Bildmitte.
  const beginneMitPunkt = useCallback(
    (e: React.PointerEvent, start: ZugStart) => {
      zeigerRef.current = { x: e.clientX, y: e.clientY };
      beginne(e, start);
    },
    [beginne],
  );

  const heuteIso = iso(new Date());
  const jetztMinute = minutenAmTag(jetzt);
  const andere: PersonId = daten.ich === "gabriel" ? "moritz" : "gabriel";
  const termineMitVorschau = mitVorschau(daten.termine, zug);

  // Aufgeklappte Tage bekommen doppelte Breite, damit beide Hälften nutzbar bleiben.
  const vorlage = `56px ${tage.map((d) => (offeneTage.has(iso(d)) ? "2fr" : "1fr")).join(" ")}`;
  const breite = 100 / tage.length;

  function umschalten(tagIso: string) {
    setOffeneTage((alt) => {
      const neu = new Set(alt);
      if (neu.has(tagIso)) neu.delete(tagIso);
      else neu.add(tagIso);
      return neu;
    });
  }

  return (
    <div>
      {/* Kopfzeile */}
      <div className={s.kopfzeile} style={{ gridTemplateColumns: vorlage }}>
        <div />
        {tage.map((d) => {
          const tagIso = iso(d);
          const offen = offeneTage.has(tagIso);
          const ist = pensumAm(daten.termine, daten.ich, tagIso);
          const soll = daten.pensumSoll[daten.ich];
          const voll = soll > 0 && ist >= soll;
          const abgeschlossen = daten.reflexionen[daten.ich][tagIso]?.ab ?? false;
          return (
            <div key={tagIso} className={`${s.kopfTag}${tagIso === heuteIso ? " " + s.kopfTagHeute : ""}`}>
              <span className={s.kopfName}>
                {WOCHENTAG[(d.getDay() + 6) % 7]}. {d.getDate()}.
                {abgeschlossen && (
                  <span className={s.haken} title="Tag durchgezogen">
                    ✓
                  </span>
                )}
              </span>
              {/* Tagespensum: wie viel Arbeitszeit steht schon im Tag? */}
              <span className={s.pensum}>
                <span className={s.pensumBar}>
                  <i
                    className={voll ? s.pensumVoll : undefined}
                    style={{ width: `${Math.min(100, soll ? (ist / soll) * 100 : 0)}%` }}
                  />
                </span>
                <span className={`${s.pensumZahl}${voll ? " " + s.pensumZahlVoll : ""}`}>
                  {stundenText(ist)} / {stundenText(soll)} h
                </span>
              </span>
              <button
                className={s.aufklappen}
                aria-expanded={offen}
                title={offen ? `${PERSONEN[andere].name} ausblenden` : `${PERSONEN[andere].name} einblenden`}
                onClick={() => umschalten(tagIso)}
              >
                {offen ? `${PERSONEN[andere].name} ✕` : `+ ${PERSONEN[andere].name}`}
              </button>
              {offen && (
                <span className={s.haelftenKopf}>
                  <span>{PERSONEN[daten.ich].name}</span>
                  <span>{PERSONEN[andere].name}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Ganztägige Einträge — beide Personen, damit Urlaubszeiten immer sichtbar sind. */}
      <div className={s.ganztags} style={{ gridTemplateColumns: vorlage }}>
        <div className={s.gtLabel}>ganztägig</div>
        <div className={s.gtFlaeche}>
          {daten.ganztags.map((e) => {
            const von = ausIso(e.von);
            const bis = ausIso(e.bis);
            const a = tage.findIndex((d) => iso(d) >= iso(von));
            const b = [...tage].reverse().findIndex((d) => iso(d) <= iso(bis));
            if (a === -1 || b === -1) return null;
            const bisIdx = tage.length - 1 - b;
            if (bisIdx < a) return null;
            if (iso(tage[bisIdx]) < iso(von) || iso(tage[a]) > iso(bis)) return null;
            const fremd = e.besitzer !== daten.ich;
            return (
              <div
                key={e.id}
                className={`${s.gtBlock}${fremd ? " " + s.fremd : ""}`}
                style={{ left: `${a * breite}%`, width: `${(bisIdx - a + 1) * breite}%` }}
                title={e.notiz || e.titel}
              >
                {fremd ? `${PERSONEN[e.besitzer].name}: ` : ""}
                {e.titel}
              </div>
            );
          })}
        </div>
      </div>

      {/* Raster */}
      <div className={s.raster} ref={rasterRef} style={{ gridTemplateColumns: vorlage, height: RASTER_HOEHE }}>
        <div className={s.zeitspalte}>
          {Array.from({ length: STUNDE_BIS - STUNDE_VON + 1 }, (_, i) => STUNDE_VON + i).map((h) => (
            <span key={h} className={s.zeitmarke} style={{ top: (h - STUNDE_VON) * SPUR }}>
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </div>

        {tage.map((tag) => {
          const tagIso = iso(tag);
          const desTages = termineMitVorschau.filter((t) => t.start.slice(0, 10) === tagIso);
          return (
            <Tagesspalte
              key={tagIso}
              tagIso={tagIso}
              eigene={desTages.filter((t) => t.besitzer === daten.ich)}
              fremde={desTages.filter((t) => t.besitzer !== daten.ich)}
              offen={offeneTage.has(tagIso)}
              istHeute={tagIso === heuteIso}
              jetztMinute={jetztMinute}
              zug={zug}
              beginne={beginneMitPunkt}
              beiVorlageAbgelegt={beiVorlageAbgelegt}
            />
          );
        })}
      </div>

      {/* Tagesabschluss unter dem Raster — der eigene Rückblick, wie im Prototyp. */}
      <Reflexionszeile
        tage={tage}
        reflexionen={daten.reflexionen[daten.ich]}
        spalten={vorlage}
        beiAenderung={beiReflexion}
      />
    </div>
  );
}
