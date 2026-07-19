"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Alert, CockpitData } from "@/lib/types";
import { berechneKosten } from "@/lib/costs";
import { berechneWarnungen } from "@/lib/checks";
import { WarnBand } from "@/components/WarnBand";
import { Donut } from "@/components/Donut";
import { formatEur, formatDatum } from "@/lib/format";

interface KundenEintrag {
  agentId: string;
  agentName: string;
  anzahlCalls: number;
  minuten: number;
  kostenUsd: number;
}

const USD = new Intl.NumberFormat("de-DE", { style: "currency", currency: "USD" });
const ZEIT = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const SCHWERE_PUNKT: Record<Alert["schwere"], string> = {
  hoch: "var(--handlung-dot)",
  mittel: "var(--beobachten-dot)",
  niedrig: "var(--border-strong)",
};

const AMPEL_PUNKT: Record<string, string> = {
  ok: "var(--ok-dot)",
  beobachten: "var(--beobachten-dot)",
  handlung: "var(--handlung-dot)",
};

// Übersicht: alles Wichtige aus allen Bereichen auf einen Blick — Warnband,
// Kennzahlen, Kosten-Donut, daneben Fälligkeiten und offene Alerts als Vorschau.
export default function Uebersicht() {
  const [daten, setDaten] = useState<CockpitData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [kunden, setKunden] = useState<KundenEintrag[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    let aktiv = true;
    async function laden() {
      try {
        const [dRes, aRes, kRes] = await Promise.all([
          fetch("/api/dienste"),
          fetch("/api/alerts"),
          fetch("/api/retell/kunden"),
        ]);
        if (!aktiv) return;
        if (dRes.ok) setDaten(await dRes.json());
        else setFehler("Daten konnten nicht geladen werden.");
        if (aRes.ok) setAlerts(((await aRes.json()).alerts ?? []) as Alert[]);
        if (kRes.ok) setKunden(((await kRes.json()).kunden ?? []) as KundenEintrag[]);
      } catch {
        if (aktiv) setFehler("Daten konnten nicht geladen werden.");
      }
    }
    void laden();
    return () => {
      aktiv = false;
    };
  }, []);

  const kosten = useMemo(() => (daten ? berechneKosten(daten) : null), [daten]);
  const warnungen = useMemo(() => (daten ? berechneWarnungen(daten) : []), [daten]);

  const offeneAlerts = useMemo(
    () =>
      alerts
        .filter((a) => a.status !== "erledigt")
        .sort((a, b) => Date.parse(b.letztesAuftreten) - Date.parse(a.letztesAuftreten)),
    [alerts],
  );
  const kritische = offeneAlerts.filter((a) => a.schwere === "hoch").length;

  const claudeRest = useMemo(() => {
    const d = daten?.dienste.find((x) => x.claude);
    return d?.claude?.restguthabenGeschaetztUsd ?? null;
  }, [daten]);

  // Fälligkeiten: nach Dringlichkeit (Datum aufsteigend, ohne Datum ans Ende), Top 5.
  const faelligkeiten = useMemo(() => {
    if (!daten) return [];
    return [...daten.dienste]
      .sort((a, b) => {
        if (a.naechsteFaelligkeit && b.naechsteFaelligkeit)
          return a.naechsteFaelligkeit.localeCompare(b.naechsteFaelligkeit);
        if (a.naechsteFaelligkeit) return -1;
        if (b.naechsteFaelligkeit) return 1;
        return (b.betrag ?? 0) - (a.betrag ?? 0);
      })
      .slice(0, 5);
  }, [daten]);

  // Donut: Monatskosten (EUR) nach Kategorie aggregiert.
  const kostenNachKategorie = useMemo(() => {
    if (!daten || !kosten) return [];
    const index = new Map(kosten.proDienst.map((k) => [k.id, k]));
    const summen = new Map<string, number>();
    for (const d of daten.dienste) {
      const wert = index.get(d.id)?.monatEur;
      if (wert == null) continue;
      summen.set(d.kategorie, (summen.get(d.kategorie) ?? 0) + wert);
    }
    return Array.from(summen.entries()).map(([label, wert]) => ({ label, wert }));
  }, [daten, kosten]);

  if (fehler && !daten) return <main className="shell lade">{fehler}</main>;
  if (!daten || !kosten) return <main className="shell lade">Cockpit lädt …</main>;

  const heute = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <main className="shell">
      <header className="seitenkopf">
        <h1 className="seitenkopf__titel">Übersicht</h1>
        <div className="seitenkopf__meta">
          <a className="btn btn--klein" href="/report">Report / Druckansicht</a>
          <span>Stand {heute}</span>
        </div>
      </header>

      <WarnBand warnungen={warnungen} />

      <div className="metricreihe">
        <div className="metric">
          <div className="metric__label">Kosten / Monat</div>
          <div className="metric__wert">{formatEur(kosten.monatEur)}</div>
          <div className="metric__fuss">{formatEur(kosten.jahrEur)} pro Jahr</div>
        </div>
        <div className="metric">
          <div className="metric__label">Claude-Guthaben</div>
          <div className="metric__wert">{claudeRest != null ? USD.format(claudeRest) : "—"}</div>
          <div className="metric__fuss">geschätzt verbleibend</div>
        </div>
        <div className="metric">
          <div className="metric__label">Aktive Agenten</div>
          <div className="metric__wert">{kunden ? kunden.length : "—"}</div>
          <div className="metric__fuss">mit Calls im laufenden Monat</div>
        </div>
        <div className="metric">
          <div className="metric__label">Offene Alerts</div>
          <div className={`metric__wert${kritische > 0 ? " metric__wert--kritisch" : ""}`}>{offeneAlerts.length}</div>
          <div className="metric__fuss">{kritische > 0 ? `davon ${kritische} kritisch` : "keine kritischen"}</div>
        </div>
      </div>

      <div className="vorschau">
        <section aria-label="Kostenverteilung">
          <div className="vorschau__kopf">
            <span className="vorschau__titel">Kosten nach Kategorie</span>
            <Link className="vorschau__link" href="/kosten">Alle Kosten →</Link>
          </div>
          <div className="panel">
            <Donut segmente={kostenNachKategorie} formatWert={(w) => formatEur(w)} titel="Kosten nach Kategorie" />
          </div>
        </section>

        <section aria-label="Fälligkeiten">
          <div className="vorschau__kopf">
            <span className="vorschau__titel">Fälligkeiten &amp; Status</span>
            <Link className="vorschau__link" href="/kosten">Verwalten →</Link>
          </div>
          <div className="panel">
            <ul className="zliste">
              {faelligkeiten.length === 0 && <li className="zzeile--leer">Keine Dienste erfasst.</li>}
              {faelligkeiten.map((d) => (
                <li className="zzeile" key={d.id}>
                  <span className="zzeile__punkt" style={{ background: AMPEL_PUNKT[d.statusAmpel] }} aria-hidden="true" />
                  <span className="zzeile__name">{d.name}</span>
                  <span className="zzeile__kontext">
                    {d.naechsteFaelligkeit ? `fällig am ${formatDatum(d.naechsteFaelligkeit)}` : d.kategorie}
                  </span>
                  <span className="zzeile__wert">
                    {d.betrag != null ? `${d.betrag.toFixed(2).replace(".", ",")} ${d.waehrung === "USD" ? "$" : "€"}` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="vorschau">
        <section aria-label="Offene Alerts">
          <div className="vorschau__kopf">
            <span className="vorschau__titel">Offene Alerts</span>
            <Link className="vorschau__link" href="/alerts">Alle Alerts →</Link>
          </div>
          <div className="panel">
            <ul className="zliste">
              {offeneAlerts.length === 0 && <li className="zzeile--leer">Keine offenen Alerts — alles ruhig.</li>}
              {offeneAlerts.slice(0, 5).map((a) => (
                <li className="zzeile" key={a.id}>
                  <span className="zzeile__punkt" style={{ background: SCHWERE_PUNKT[a.schwere] }} aria-hidden="true" />
                  <span className="zzeile__name">{a.titel}</span>
                  <span className="zzeile__kontext">{a.agentName}</span>
                  <span className="zzeile__wert">{ZEIT.format(new Date(a.letztesAuftreten))}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-label="Kunden-Verbrauch">
          <div className="vorschau__kopf">
            <span className="vorschau__titel">Kunden-Verbrauch (Monat)</span>
            <Link className="vorschau__link" href="/kunden">Details &amp; CSV →</Link>
          </div>
          <div className="panel">
            <ul className="zliste">
              {(!kunden || kunden.length === 0) && <li className="zzeile--leer">Noch keine Calls in diesem Monat.</li>}
              {(kunden ?? []).slice(0, 5).map((k) => (
                <li className="zzeile" key={k.agentId}>
                  <span className="zzeile__punkt" style={{ background: "var(--ok-dot)" }} aria-hidden="true" />
                  <span className="zzeile__name">{k.agentName}</span>
                  <span className="zzeile__kontext">{k.anzahlCalls} Calls · {k.minuten.toFixed(1).replace(".", ",")} Min.</span>
                  <span className="zzeile__wert">{USD.format(k.kostenUsd)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
