"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Alert } from "@/lib/types";

const NAV = [
  { href: "/", label: "Übersicht" },
  { href: "/kosten", label: "Kosten" },
  { href: "/kunden", label: "Kunden-Verbrauch" },
  { href: "/alerts", label: "Alerts" },
];

// Feste Seitenleiste mit Navigation, Alert-Zähler und globalem Kritisch-Indikator.
// Auf Mobil eingeklappt, öffnet über den Hamburger-Button.
export function Sidebar() {
  const pfad = usePathname();
  const [offen, setOffen] = useState(false);
  const [offeneAlerts, setOffeneAlerts] = useState(0);
  const [kritisch, setKritisch] = useState(false);

  useEffect(() => {
    let aktiv = true;
    async function laden() {
      try {
        const res = await fetch("/api/alerts");
        if (!res.ok) return;
        const antwort = (await res.json()) as { alerts?: Alert[] };
        const offene = (antwort.alerts ?? []).filter((a) => a.status !== "erledigt");
        if (!aktiv) return;
        setOffeneAlerts(offene.length);
        setKritisch(offene.some((a) => a.schwere === "hoch"));
      } catch {
        // Zähler bleibt einfach leer — kein kritischer Fehler.
      }
    }
    void laden();
    const timer = setInterval(laden, 120_000);
    return () => {
      aktiv = false;
      clearInterval(timer);
    };
  }, []);

  // Bei Navigationswechsel auf Mobil das Menü schließen.
  useEffect(() => {
    setOffen(false);
  }, [pfad]);

  return (
    <>
      <button className="burger" aria-label="Navigation öffnen" onClick={() => setOffen(true)}>
        <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.6" strokeLinecap="round">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
      </button>

      <aside className={`sidebar${offen ? " sidebar--offen" : ""}`}>
        <button className="sidebar__zu" aria-label="Navigation schließen" onClick={() => setOffen(false)}>
          ×
        </button>
        <div className="sidebar__marke">
          <span className="sidebar__punkt" aria-hidden="true" />
          <span className="sidebar__name">AK Assistance</span>
          {kritisch && <span className="sidebar__alarm" title="Mindestens ein kritischer Alert offen" />}
        </div>

        <nav aria-label="Hauptnavigation">
          {NAV.map((n) => {
            const aktivItem = n.href === "/" ? pfad === "/" : pfad.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`nav__item${aktivItem ? " nav__item--aktiv" : ""}`}>
                {n.label}
                {n.href === "/alerts" && offeneAlerts > 0 && (
                  <span className={`nav__zaehler${kritisch ? " nav__zaehler--kritisch" : ""}`}>{offeneAlerts}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__fuss">Betriebs-Cockpit</div>
      </aside>
    </>
  );
}
