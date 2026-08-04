"use client";

import type { Label, LabelSchluessel, Vorlage } from "@/lib/kalender-typen";
import { labelAus, labelKarte } from "@/lib/kalender-labels";
import { MiniMonat } from "./MiniMonat";
import s from "./kalender.module.css";

interface Props {
  // Geteilte Liste — Reihenfolge wie gespeichert, gruppiert nach label.gruppe.
  labels: Label[];
  ausgeblendet: ReadonlySet<LabelSchluessel>;
  beiLabelWechsel: (label: LabelSchluessel) => void;
  beiLabelNeu: () => void;
  beiLabelBearbeiten: (label: Label) => void;
  // Nur die eigenen Vorlagen — die des anderen gehen niemanden etwas an.
  vorlagen: Vorlage[];
  beiVorlageNeu: () => void;
  beiVorlageBearbeiten: (vorlage: Vorlage) => void;
  beiVorlageWeg: (id: string) => void;
  sichtbareTage: Date[];
  beiTagWaehlen: (d: Date) => void;
  beiNeuerTermin: () => void;
}

export function KalenderSeitenleiste({
  labels,
  ausgeblendet,
  beiLabelWechsel,
  beiLabelNeu,
  beiLabelBearbeiten,
  vorlagen,
  beiVorlageNeu,
  beiVorlageBearbeiten,
  beiVorlageWeg,
  sichtbareTage,
  beiTagWaehlen,
  beiNeuerTermin,
}: Props) {
  const karte = labelKarte(labels);
  const labelGruppe = (gruppe: Label["gruppe"]) =>
    labels
      .filter((l) => l.gruppe === gruppe)
      .map((L) => {
        const aus = ausgeblendet.has(L.id);
        return (
          <label key={L.id} className={`${s.kalEintrag}${aus ? " " + s.kalEintragAus : ""}`}>
            <input
              type="checkbox"
              checked={!aus}
              style={{ borderColor: L.farbe, background: aus ? "transparent" : L.farbe }}
              onChange={() => beiLabelWechsel(L.id)}
            />
            <span>{L.name}</span>
            <button
              type="button"
              className={s.kalEintragBearbeiten}
              title="Label bearbeiten"
              onClick={(e) => {
                e.preventDefault();
                beiLabelBearbeiten(L);
              }}
            >
              ✎
            </button>
          </label>
        );
      });

  return (
    <aside className={s.sidebar}>
      <div className={s.sbTop}>
        <button className={s.sbNeu} title="Neuer Termin" onClick={beiNeuerTermin}>
          +
        </button>
        <strong>Arbeitskalender</strong>
      </div>

      <div className={s.sbScroll}>
        <div className={s.sbTitel}>AK Assistance</div>
        {labelGruppe("firma")}
        <div className={s.sbTitel}>Übrige</div>
        {labelGruppe("uebrige")}
        <button className={s.vorlageNeu} onClick={beiLabelNeu}>
          + Label anlegen
        </button>

        <div className={s.sbTitel}>Schnellvorlagen</div>
        {vorlagen.map((v) => (
          <div
            key={v.id}
            className={s.vorlage}
            draggable
            title={`${v.titel} — ins Raster ziehen, oder bearbeiten`}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", JSON.stringify({ titel: v.titel, label: v.label, min: v.min }));
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => beiVorlageBearbeiten(v)}
          >
            <span className={s.vorlagePunkt} style={{ background: labelAus(karte, v.label).farbe }} />
            <span>{v.titel}</span>
            <span className={s.vorlageDauer}>{v.min}′</span>
            <button
              className={s.vorlageWeg}
              title="Vorlage löschen"
              onClick={(e) => {
                e.stopPropagation();
                beiVorlageWeg(v.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button className={s.vorlageNeu} onClick={beiVorlageNeu}>
          + Vorlage anlegen
        </button>
      </div>

      <MiniMonat sichtbareTage={sichtbareTage} beiTagWaehlen={beiTagWaehlen} />
    </aside>
  );
}
