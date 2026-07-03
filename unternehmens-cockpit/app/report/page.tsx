import Link from "next/link";
import { ladeDaten } from "@/lib/db";
import { berechneKosten } from "@/lib/costs";
import { berechneWarnungen } from "@/lib/checks";
import { herkunftAnzeige } from "@/lib/herkunft";
import { formatEur, formatBetrag, formatDatum } from "@/lib/format";
import type { StatusAmpel } from "@/lib/types";
import stil from "./report.module.css";

// Server-Component: keine Interaktivität nötig, damit die Seite ohne Client-JS
// sauber druckbar ist (Cmd+P → PDF). Daten werden direkt aus der DB geladen.
export const dynamic = "force-dynamic"; // immer frische Zahlen, nie aus Cache

const STATUS_WORT: Record<StatusAmpel, string> = {
  ok: "OK",
  beobachten: "Beobachten",
  handlung: "Handlung nötig",
};

const MODELL_WORT: Record<string, string> = {
  monatlich: "monatlich",
  jaehrlich: "jährlich",
  verbrauch: "Verbrauch",
};

export default async function Report() {
  const daten = await ladeDaten();
  const kosten = berechneKosten(daten);
  const warnungen = berechneWarnungen(daten);
  const kostenIndex = new Map(kosten.proDienst.map((k) => [k.id, k]));

  const heute = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Kostenkonzentration rein aus den Daten ableiten (kein Werturteil erfinden):
  // Anteil des teuersten Einzeldiensts und Verteilung nach Kategorie an den bekannten Monatskosten.
  const summe = kosten.monatEur;
  const proDienstSortiert = daten.dienste
    .map((d) => ({ name: d.name, monat: kostenIndex.get(d.id)?.monatEur ?? null }))
    .filter((x): x is { name: string; monat: number } => x.monat != null && x.monat > 0)
    .sort((a, b) => b.monat - a.monat);
  const topDienst = proDienstSortiert[0] ?? null;

  const proKategorie = new Map<string, number>();
  for (const d of daten.dienste) {
    const m = kostenIndex.get(d.id)?.monatEur;
    if (m != null && m > 0) proKategorie.set(d.kategorie, (proKategorie.get(d.kategorie) ?? 0) + m);
  }
  const kategorien = Array.from(proKategorie.entries()).sort((a, b) => b[1] - a[1]);

  const anteil = (wert: number) => (summe > 0 ? `${Math.round((wert / summe) * 100)} %` : "—");
  const konzentrationAussagekraeftig = summe > 0 && !kosten.unvollstaendig && !kosten.kursFehlt;

  return (
    <main className={stil.seite}>
      <header className={stil.kopf}>
        <div>
          <h1 className={stil.titel}>AK Assistance — Betriebsübersicht</h1>
          <p className={stil.untertitel}>Interne Kosten- und Statusübersicht aller Dienste</p>
        </div>
        <div className={stil.stand}>Stand {heute}</div>
      </header>

      <div className={stil.werkzeug}>
        <Link href="/" className={stil.link}>
          ← Zurück zum Cockpit
        </Link>
        <a href="/api/export" className={stil.link}>
          JSON-Export (Backup)
        </a>
      </div>

      <section className={stil.abschnitt}>
        <h2 className={stil.abschnitt__titel}>Gesamtkosten</h2>
        <div className={stil.summe}>
          <div className={stil.summe__block}>
            <span className={stil.summe__label}>pro Monat</span>
            <span className={stil.summe__zahl}>{formatEur(kosten.monatEur)}</span>
          </div>
          <div className={stil.summe__block}>
            <span className={stil.summe__label}>pro Jahr</span>
            <span className={stil.summe__zahl}>{formatEur(kosten.jahrEur)}</span>
          </div>
        </div>
        {kosten.unvollstaendig && (
          <p className={stil.hinweis}>
            Nicht alle Dienste haben einen Betrag — die Summe ist unvollständig.
          </p>
        )}
        {kosten.kursFehlt && (
          <p className={stil.hinweis}>
            USD-Posten ohne gepflegten Wechselkurs sind nicht in EUR eingerechnet.
          </p>
        )}
      </section>

      <section className={stil.abschnitt}>
        <h2 className={stil.abschnitt__titel}>Offene Warnungen</h2>
        {warnungen.length === 0 ? (
          <p className={stil.ruhig}>Keine offenen Warnungen.</p>
        ) : (
          <ul className={stil.warnliste}>
            {warnungen.map((w, i) => (
              <li key={`${w.dienstId}-${i}`} className={stil.warnzeile}>
                <div className={`${stil.warnzeile__titel} ${stil[`warnzeile__titel--${w.schwere}`]}`}>
                  {w.titel}
                </div>
                <div className={stil.warnzeile__detail}>{w.detail}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={stil.abschnitt}>
        <h2 className={stil.abschnitt__titel}>Alle Dienste</h2>
        <table className={stil.tabelle}>
          <thead>
            <tr>
              <th>Dienst</th>
              <th>Kategorie</th>
              <th>Abrechnung</th>
              <th className={stil.rechts}>Betrag</th>
              <th className={stil.rechts}>≈ / Monat</th>
              <th>Status</th>
              <th>Fällig</th>
              <th>Stand</th>
            </tr>
          </thead>
          <tbody>
            {daten.dienste.map((d) => {
              const k = kostenIndex.get(d.id);
              const h = herkunftAnzeige(d);
              return (
                <tr key={d.id}>
                  <td className={stil.dienst}>
                    {d.name}
                    {d.inhaber ? ` (${d.inhaber})` : ""}
                  </td>
                  <td>{d.kategorie}</td>
                  <td>{MODELL_WORT[d.abrechnungsmodell] ?? d.abrechnungsmodell}</td>
                  <td className={stil.rechts}>
                    {d.betrag == null ? (
                      <span className={stil.leer}>—</span>
                    ) : (
                      formatBetrag(d.betrag, d.waehrung)
                    )}
                  </td>
                  <td className={stil.rechts}>
                    {k && k.monatEur != null ? (
                      <>
                        {formatEur(k.monatEur)}
                        {k.umgerechnet ? " *" : ""}
                      </>
                    ) : (
                      <span className={stil.leer}>—</span>
                    )}
                  </td>
                  <td className={stil[`status--${d.statusAmpel}`]}>{STATUS_WORT[d.statusAmpel]}</td>
                  <td>
                    {d.naechsteFaelligkeit ? (
                      formatDatum(d.naechsteFaelligkeit)
                    ) : (
                      <span className={stil.leer}>—</span>
                    )}
                  </td>
                  <td className={stil.stand__zelle}>
                    {h.text}
                    {h.pruefen ? " · bitte prüfen" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className={stil.abschnitt}>
        <h2 className={stil.abschnitt__titel}>Kostenkonzentration (Klumpenrisiko)</h2>
        {!konzentrationAussagekraeftig ? (
          <p className={stil.hinweis}>
            Aussagekräftig erst, wenn alle Beträge gepflegt und USD-Posten umgerechnet sind. Ein
            hoher Anteil eines einzelnen Diensts an den Gesamtkosten ist ein Klumpenrisiko und sollte
            im Team bewertet werden.
          </p>
        ) : (
          <>
            {topDienst && (
              <p style={{ marginTop: 0 }}>
                Größter Einzelposten: <strong>{topDienst.name}</strong> mit{" "}
                <strong>{anteil(topDienst.monat)}</strong> der Monatskosten (
                {formatEur(topDienst.monat)}).
              </p>
            )}
            <table className={stil.tabelle}>
              <thead>
                <tr>
                  <th>Kategorie</th>
                  <th className={stil.rechts}>≈ / Monat</th>
                  <th className={stil.rechts}>Anteil</th>
                </tr>
              </thead>
              <tbody>
                {kategorien.map(([kat, wert]) => (
                  <tr key={kat}>
                    <td>{kat}</td>
                    <td className={stil.rechts}>{formatEur(wert)}</td>
                    <td className={stil.rechts}>{anteil(wert)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <footer className={stil.fuss}>
        Herkunft je Dienst in Spalte „Stand": „manuell" = von Hand gepflegt, „live" = automatisch
        abgerufen, „veraltet/Abruf fehlgeschlagen" = Wert nicht bestätigt. „bitte prüfen" =
        manueller Wert älter als 90 Tage. Mit „*" markierte Monatswerte sind aus USD zum gepflegten
        Kurs umgerechnet. Restguthaben-Angaben sind Schätzungen.
      </footer>
    </main>
  );
}
