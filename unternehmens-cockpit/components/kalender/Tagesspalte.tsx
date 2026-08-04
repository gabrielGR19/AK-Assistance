"use client";

import type { Label, Termin } from "@/lib/kalender-typen";
import { labelAus } from "@/lib/kalender-labels";
import { ordneBloecke, type BlockPosition } from "./bloecke";
import { STUNDE_BIS, STUNDE_VON, SPUR, ausIso, minutenAmTag, uhr } from "./datum";
import { obenAus, hoeheAus, minuteAusPosition } from "./geometrie.ts";
import type { Zug, ZugStart } from "./useZiehen.ts";
import s from "./kalender.module.css";

interface Props {
  tagIso: string;
  eigene: Termin[];
  fremde: Termin[];
  offen: boolean;
  istHeute: boolean;
  jetztMinute: number;
  zug: Zug | null;
  beginne: (e: React.PointerEvent, start: ZugStart) => void;
  // Eine Schnellvorlage wurde auf diesem Tag abgelegt (Minute ab Mitternacht).
  beiVorlageAbgelegt: (tagIso: string, vonMin: number, nutzlast: string) => void;
  labels: Map<string, Label>;
}

// Eine Tagesspalte. Zugeklappt zeigt sie nur die eigenen Termine über die volle Breite;
// aufgeklappt teilt sie sich in "ich" links und die andere Person rechts.
//
// Nur die eigene Hälfte trägt `data-datum` — sie ist das Ziel beim Verschieben. Fremde
// Termine lassen sich gar nicht erst anfassen: der Server würde sie ohnehin ablehnen, und ein
// Block, der sich nicht bewegt, ist ehrlicher als eine Fehlermeldung nach dem Loslassen.
export function Tagesspalte({
  tagIso,
  eigene,
  fremde,
  offen,
  istHeute,
  jetztMinute,
  zug,
  beginne,
  beiVorlageAbgelegt,
  labels,
}: Props) {
  const jetztSichtbar = istHeute && jetztMinute >= STUNDE_VON * 60 && jetztMinute <= STUNDE_BIS * 60;

  return (
    <div className={`${s.tagspalte}${offen ? " " + s.tagspalteOffen : ""}`}>
      {Array.from({ length: STUNDE_BIS - STUNDE_VON + 1 }, (_, i) => STUNDE_VON + i).map((h) => (
        <div key={"h" + h} className={s.stunde} style={{ top: (h - STUNDE_VON) * SPUR }} />
      ))}
      {Array.from({ length: STUNDE_BIS - STUNDE_VON }, (_, i) => STUNDE_VON + i).map((h) => (
        <div key={"halb" + h} className={s.halbe} style={{ top: (h - STUNDE_VON) * SPUR + SPUR / 2 }} />
      ))}
      {jetztSichtbar && <div className={s.jetztlinie} style={{ top: obenAus(jetztMinute) }} />}

      {/* Eigene Hälfte: anfassbar, Ziel beim Verschieben und Aufziehen. */}
      <div
        className={s.haelfte}
        data-datum={tagIso}
        style={{ left: 0, width: offen ? "50%" : "100%" }}
        onPointerDown={(e) => {
          // Nur auf freier Fläche — ein Klick auf einen Block hat seinen eigenen Handler.
          if ((e.target as HTMLElement).closest(`.${s.block}`)) return;
          beginne(e, { art: "neu", terminId: null, datum: tagIso, vonMin: 0, bisMin: 0 });
        }}
        // Schnellvorlagen lassen sich hierher ziehen. Gemessen wird beim Ablegen an genau
        // dem Element, auf dem abgelegt wurde — nicht an einem gemerkten Rechteck.
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const nutzlast = e.dataTransfer.getData("text/plain");
          if (!nutzlast) return;
          const rechteck = e.currentTarget.getBoundingClientRect();
          const vonMin = minuteAusPosition(e.clientY + window.scrollY, {
            obenAbsolut: rechteck.top + window.scrollY,
            hoehe: rechteck.height,
          });
          beiVorlageAbgelegt(tagIso, vonMin, nutzlast);
        }}
      >
        {ordneBloecke(eigene).map((p) => (
          <Block key={p.termin.id} position={p} eigen zug={zug} beginne={beginne} tagIso={tagIso} labels={labels} />
        ))}

        {zug?.art === "neu" && zug.datum === tagIso && (
          <div className={s.geist} style={{ top: obenAus(zug.vonMin), height: hoeheAus(zug.vonMin, zug.bisMin) }} />
        )}
      </div>

      {/* Fremde Hälfte: nur im aufgeklappten Zustand, reine Anzeige. */}
      {offen && (
        <div className={`${s.haelfte} ${s.haelfteFremd}`} style={{ left: "50%", width: "50%" }}>
          {ordneBloecke(fremde).map((p) => (
            <Block key={p.termin.id} position={p} eigen={false} zug={null} beginne={beginne} tagIso={tagIso} labels={labels} />
          ))}
        </div>
      )}
    </div>
  );
}

function Block({
  position,
  eigen,
  zug,
  beginne,
  tagIso,
  labels,
}: {
  position: BlockPosition;
  eigen: boolean;
  zug: Zug | null;
  beginne: Props["beginne"];
  tagIso: string;
  labels: Map<string, Label>;
}) {
  const { termin, spur, anzahl } = position;
  const von = ausIso(termin.start);
  const bis = ausIso(termin.ende);
  const vonMin = minutenAmTag(von);
  const bisMin = minutenAmTag(bis);
  const hoehe = hoeheAus(vonMin, bisMin);
  const L = labelAus(labels, termin.label);
  const wirdGezogen = zug?.terminId === termin.id;

  return (
    <div
      className={`${s.block}${hoehe < 32 ? " " + s.blockKurz : ""}${eigen ? "" : " " + s.fremd}${
        wirdGezogen ? " " + s.zieht : ""
      }`}
      style={{
        top: obenAus(vonMin),
        height: hoehe,
        left: `calc(${(spur / anzahl) * 100}% + 1px)`,
        width: `calc(${100 / anzahl}% - 3px)`,
        borderLeftColor: L.farbe,
        background: L.farbe + "30",
        color: L.text,
      }}
      title={termin.notiz ? `${termin.titel}\n${termin.notiz}` : termin.titel}
      onPointerDown={
        eigen
          ? (e) => {
              const griff = (e.target as HTMLElement).classList.contains(s.griff);
              beginne(e, {
                art: griff ? "groesse" : "verschieben",
                terminId: termin.id,
                datum: tagIso,
                vonMin,
                bisMin,
              });
            }
          : undefined
      }
    >
      <div className={s.blockTitel}>{termin.titel}</div>
      <div className={s.blockZeit}>
        {uhr(von)}–{uhr(bis)}
      </div>
      {eigen && <div className={s.griff} />}
    </div>
  );
}
