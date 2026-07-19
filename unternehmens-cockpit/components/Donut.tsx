"use client";

import { useState } from "react";

export interface DonutSegment {
  label: string;
  wert: number;
}

// Feste kategoriale Reihenfolge (validierte Palette aus globals.css); "Sonstige" ist
// bewusst neutral grau und zählt nicht als eigene Serie.
const FARBEN = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const FARBE_SONSTIGE = "#9ca3af";
const MAX_SEGMENTE = 5;

interface TooltipZustand {
  x: number;
  y: number;
  text: string;
}

// Schlanker SVG-Donut ohne Chart-Bibliothek: 2px weiße Trennfugen zwischen den
// Segmenten, Hover-Tooltip, Legende mit Wert und Anteil. Mehr als 5 Kategorien
// werden in "Sonstige" gefaltet, damit die feste Farbreihenfolge hält.
export function Donut({
  segmente,
  formatWert,
  titel,
}: {
  segmente: DonutSegment[];
  formatWert: (wert: number) => string;
  titel: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipZustand | null>(null);

  const sortiert = [...segmente].filter((s) => s.wert > 0).sort((a, b) => b.wert - a.wert);
  const kopf = sortiert.slice(0, MAX_SEGMENTE);
  const rest = sortiert.slice(MAX_SEGMENTE);
  const daten =
    rest.length > 0
      ? [...kopf, { label: "Sonstige", wert: rest.reduce((acc, s) => acc + s.wert, 0) }]
      : kopf;
  const summe = daten.reduce((acc, s) => acc + s.wert, 0);

  if (summe <= 0) {
    return <p className="zzeile--leer">Keine Daten für {titel}.</p>;
  }

  // Kreisgeometrie: Ring mit dünnem Strich, Trennfugen über weißen Stroke.
  const R = 52;
  const DICKE = 18;
  const MITTE = 70;
  const umfang = 2 * Math.PI * R;

  let winkelOffset = -90; // bei 12 Uhr beginnen
  const boegen = daten.map((s, i) => {
    const anteil = s.wert / summe;
    const laenge = anteil * umfang;
    const farbe = s.label === "Sonstige" && rest.length > 0 ? FARBE_SONSTIGE : FARBEN[i % FARBEN.length];
    const rotation = winkelOffset;
    winkelOffset += anteil * 360;
    return { ...s, anteil, laenge, farbe, rotation };
  });

  return (
    <div className="donutblock">
      <svg
        width={MITTE * 2}
        height={MITTE * 2}
        viewBox={`0 0 ${MITTE * 2} ${MITTE * 2}`}
        role="img"
        aria-label={titel}
        onMouseLeave={() => setTooltip(null)}
      >
        {boegen.map((b) => (
          <circle
            key={b.label}
            cx={MITTE}
            cy={MITTE}
            r={R}
            fill="none"
            stroke={b.farbe}
            strokeWidth={DICKE}
            strokeDasharray={`${Math.max(b.laenge - 2, 0.5)} ${umfang - Math.max(b.laenge - 2, 0.5)}`}
            transform={`rotate(${b.rotation} ${MITTE} ${MITTE})`}
            style={{ cursor: "default" }}
            onMouseMove={(e) =>
              setTooltip({
                x: e.clientX,
                y: e.clientY,
                text: `${b.label}: ${formatWert(b.wert)} (${Math.round(b.anteil * 100)} %)`,
              })
            }
          />
        ))}
        <text
          x={MITTE}
          y={MITTE - 4}
          textAnchor="middle"
          style={{ font: "600 15px var(--font-mono)", fill: "var(--text)" }}
        >
          {formatWert(summe)}
        </text>
        <text
          x={MITTE}
          y={MITTE + 14}
          textAnchor="middle"
          style={{ font: "11px var(--font-sans)", fill: "var(--text-faint)" }}
        >
          gesamt
        </text>
      </svg>

      <div className="donut__legende">
        {boegen.map((b) => (
          <div className="donut__eintrag" key={b.label}>
            <span className="donut__farbe" style={{ background: b.farbe }} aria-hidden="true" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</span>
            <span className="donut__anteil">
              {formatWert(b.wert)} · {Math.round(b.anteil * 100)} %
            </span>
          </div>
        ))}
      </div>

      {tooltip && (
        <div className="donut__tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
