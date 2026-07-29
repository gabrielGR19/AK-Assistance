"use client";

import { LABELS, type LabelSchluessel, type Vorlage } from "@/lib/kalender-typen";
import { MiniMonat } from "./MiniMonat";
import s from "./kalender.module.css";

// Aufteilung wie im Prototyp: die drei Arbeitslabel der Firma oben, der Rest darunter.
const FIRMEN_LABELS: LabelSchluessel[] = ["vertrieb", "programmieren", "gruendung"];
const REST_LABELS: LabelSchluessel[] = ["claude", "lesen", "sport", "arzt"];

interface Props {
  ausgeblendet: ReadonlySet<LabelSchluessel>;
  beiLabelWechsel: (label: LabelSchluessel) => void;
  // Nur die eigenen Vorlagen — die des anderen gehen niemanden etwas an.
  vorlagen: Vorlage[];
  beiVorlageNeu: () => void;
  beiVorlageWeg: (id: string) => void;
  sichtbareTage: Date[];
  beiTagWaehlen: (d: Date) => void;
  beiNeuerTermin: () => void;
}

export function KalenderSeitenleiste({
  ausgeblendet,
  beiLabelWechsel,
  vorlagen,
  beiVorlageNeu,
  beiVorlageWeg,
  sichtbareTage,
  beiTagWaehlen,
  beiNeuerTermin,
}: Props) {
  const labelGruppe = (schluessel: LabelSchluessel[]) =>
    schluessel.map((k) => {
      const L = LABELS[k];
      const aus = ausgeblendet.has(k);
      return (
        <label key={k} className={`${s.kalEintrag}${aus ? " " + s.kalEintragAus : ""}`}>
          <input
            type="checkbox"
            checked={!aus}
            style={{ borderColor: L.farbe, background: aus ? "transparent" : L.farbe }}
            onChange={() => beiLabelWechsel(k)}
          />
          <span>{L.name}</span>
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
        {labelGruppe(FIRMEN_LABELS)}
        <div className={s.sbTitel}>Übrige</div>
        {labelGruppe(REST_LABELS)}

        <div className={s.sbTitel}>Schnellvorlagen</div>
        {vorlagen.map((v) => (
          <div
            key={v.id}
            className={s.vorlage}
            draggable
            title={`${v.titel} — ins Raster ziehen`}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", JSON.stringify({ titel: v.titel, label: v.label, min: v.min }));
              e.dataTransfer.effectAllowed = "copy";
            }}
          >
            <span className={s.vorlagePunkt} style={{ background: LABELS[v.label].farbe }} />
            <span>{v.titel}</span>
            <span className={s.vorlageDauer}>{v.min}′</span>
            <button className={s.vorlageWeg} title="Vorlage löschen" onClick={() => beiVorlageWeg(v.id)}>
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
