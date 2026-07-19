import s from "./styleguide.module.css";

// Reine Vorschau-Route für das geplante helle Design-System — isoliert per CSS-Modul,
// berührt nichts am produktiven (noch dunklen) Cockpit. Dient als Diskussionsgrundlage
// vor dem eigentlichen Umbau; wird nach Freigabe entweder entfernt oder zur echten
// Referenz-Route.
export default function Styleguide() {
  return (
    <div className={s.sg}>
      <div className={s.intro}>
        <span className={s.badge}>Vorschau · noch nicht live</span>
        <h1>Cockpit — Helles Design-System</h1>
        <p>
          Zielbild für den Umbau: reines Weiß als Basis für Seite und Karten, Abgrenzung ausschließlich
          über eine feine Border statt Schatten oder Grauton, eine Akzentfarbe (Orange, wie bisher),
          Ampel-Status als kleiner Punkt statt große Fläche. Die Sidebar hebt sich als einzige Fläche
          minimal grau ab, um Navigation vom Inhalt zu trennen. Alle Werte unten sind Vorschläge —
          nichts hiervon ist bereits im echten Cockpit aktiv.
        </p>
      </div>

      <section className={s.abschnitt}>
        <h2 className={s.abschnittTitel}>Farbpalette</h2>
        <div className={s.swatchGrid}>
          {[
            ["Seite & Karte", "#ffffff", "--page / --surface"],
            ["Sunken (Tabellenkopf, Hover)", "#f7f7f8", "--surface-sunken"],
            ["Border", "#e4e4e7", "--border"],
            ["Border stark", "#d4d4d8", "--border-strong"],
            ["Text", "#18181b", "--text"],
            ["Text gedämpft", "#6b7280", "--text-muted"],
            ["Text schwach", "#9ca3af", "--text-faint"],
            ["Akzent (Orange)", "#f47321", "--accent"],
            ["Ampel: OK", "#22c55e", "--ok-dot"],
            ["Ampel: Beobachten", "#f59e0b", "--beobachten-dot"],
            ["Ampel: Handlung", "#ef4444", "--handlung-dot"],
          ].map(([name, hex, varname]) => (
            <div className={s.swatch} key={varname}>
              <div className={s.swatchFarbe} style={{ background: hex }} />
              <div className={s.swatchLabel}>
                <div className={s.swatchName}>{name}</div>
                <div className={s.swatchHex}>{varname}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={s.abschnitt}>
        <h2 className={s.abschnittTitel}>Typografie-Skala</h2>
        <div>
          <div className={s.typoZeile}>
            <span className={s.typoLabel}>Display (Kennzahl)</span>
            <span className={`${s.typoDisplay} ${s.mono}`}>18.420 €</span>
          </div>
          <div className={s.typoZeile}>
            <span className={s.typoLabel}>H1 · Seitentitel</span>
            <span className={s.typoH1}>Kosten &amp; Fälligkeiten</span>
          </div>
          <div className={s.typoZeile}>
            <span className={s.typoLabel}>H2 · Sektionstitel</span>
            <span className={s.typoH2}>Dienste &amp; Accounts</span>
          </div>
          <div className={s.typoZeile}>
            <span className={s.typoLabel}>Body</span>
            <span className={s.typoBody}>Retell.ai — Voice-Agent-Plattform, verbrauchsbasiert.</span>
          </div>
          <div className={s.typoZeile}>
            <span className={s.typoLabel}>Meta / Zeitstempel</span>
            <span className={s.typoMeta}>Stand 18. Juli 2026, 09:23 Uhr</span>
          </div>
        </div>
      </section>

      <section className={s.abschnitt}>
        <h2 className={s.abschnittTitel}>Ampel-Status</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
          Zwei Varianten: dezenter Punkt+Text für Tabellenzeilen (links), Pill-Badge für Kennzahlen-Kontext (rechts).
        </p>
        <div className={s.pillReihe} style={{ marginBottom: 16 }}>
          <span className={s.ampel}><span className={`${s.ampelPunkt} ${s["ampelPunkt--ok"]}`} /><span className={s["ampelText--ok"]}>OK</span></span>
          <span className={s.ampel}><span className={`${s.ampelPunkt} ${s["ampelPunkt--beobachten"]}`} /><span className={s["ampelText--beobachten"]}>Beobachten</span></span>
          <span className={s.ampel}><span className={`${s.ampelPunkt} ${s["ampelPunkt--handlung"]}`} /><span className={s["ampelText--handlung"]}>Handlung nötig</span></span>
        </div>
        <div className={s.pillReihe}>
          <span className={`${s.pill} ${s["pill--ok"]}`}><span className={s.pillPunkt} />3 Agenten aktiv</span>
          <span className={`${s.pill} ${s["pill--beobachten"]}`}><span className={s.pillPunkt} />2 Rückrufe warten</span>
          <span className={`${s.pill} ${s["pill--handlung"]}`}><span className={s.pillPunkt} />1 Workflow inaktiv</span>
        </div>
      </section>

      <section className={s.abschnitt}>
        <h2 className={s.abschnittTitel}>Kennzahlen-Karten</h2>
        <div className={s.metricGrid}>
          <div className={s.metricCard}>
            <div className={s.metricLabel}>Laufende Kosten</div>
            <div className={`${s.metricWert} ${s.mono}`}>1.240 €</div>
            <div className={s.metricFuss}>pro Monat</div>
          </div>
          <div className={s.metricCard}>
            <div className={s.metricLabel}>Claude-Guthaben</div>
            <div className={`${s.metricWert} ${s.mono}`}>84,20 $</div>
            <div className={s.metricFuss}>geschätzt verbleibend</div>
          </div>
          <div className={s.metricCard}>
            <div className={s.metricLabel}>Aktive Agenten</div>
            <div className={`${s.metricWert} ${s.mono}`}>3 / 5</div>
            <div className={s.metricFuss}>Voice-Agenten mit Calls (30 Tage)</div>
          </div>
          <div className={s.metricCard}>
            <div className={s.metricLabel}>Offene Alerts</div>
            <div className={`${s.metricWert} ${s.mono}`} style={{ color: "var(--handlung-text)" }}>2</div>
            <div className={s.metricFuss}>davon 2 kritisch</div>
          </div>
        </div>
      </section>

      <section className={s.abschnitt}>
        <h2 className={s.abschnittTitel}>Listenzeilen (hohe Dichte, klare Spalten)</h2>
        <div className={s.karte}>
          <div className={s.zeile}>
            <span className={s.zeilePunkt} style={{ background: "var(--ok-dot)" }} />
            <span className={s.zeileName}>Retell.ai</span>
            <span className={s.zeileKontext}>fällig in 12 Tagen</span>
            <span className={s.zeileWert}>142,80 €</span>
          </div>
          <div className={s.zeile}>
            <span className={s.zeilePunkt} style={{ background: "var(--handlung-dot)" }} />
            <span className={s.zeileName}>n8n Cloud</span>
            <span className={s.zeileKontext}>überfällig seit 3 Tagen</span>
            <span className={s.zeileWert}>29,00 €</span>
          </div>
          <div className={s.zeile}>
            <span className={s.zeilePunkt} style={{ background: "var(--handlung-dot)" }} />
            <span className={s.zeileName}>Reinigungsservice Müller — Workflow inaktiv</span>
            <span className={s.zeileKontext}>seit 18.07., 09:23 Uhr</span>
            <span className={s.zeileWert}>hoch</span>
          </div>
          <div className={s.zeile}>
            <span className={s.zeilePunkt} style={{ background: "var(--beobachten-dot)" }} />
            <span className={s.zeileName}>AK-assistance V2 — Rückruf wartet</span>
            <span className={s.zeileKontext}>vor 40 Min.</span>
            <span className={s.zeileWert}>mittel</span>
          </div>
        </div>
      </section>

      <section className={s.abschnitt}>
        <h2 className={s.abschnittTitel}>Filter &amp; Buttons</h2>
        <div className={s.pillReihe} style={{ marginBottom: 14 }}>
          <span className={`${s.chip} ${s["chip--aktiv"]}`}>Alle</span>
          <span className={s.chip}>Voice-Agent</span>
          <span className={s.chip}>Software</span>
          <span className={s.chip}>API</span>
        </div>
        <div className={s.btnReihe}>
          <button className={`${s.btn} ${s["btn--primaer"]}`}>Dienst hinzufügen</button>
          <button className={s.btn}>Bearbeiten</button>
          <button className={`${s.btn} ${s["btn--klein"]}`}>Live abrufen</button>
          <button className={`${s.btn} ${s["btn--gefahr"]}`}>Löschen</button>
        </div>
      </section>

      <section className={s.abschnitt}>
        <h2 className={s.abschnittTitel}>Layout-Mock: Sidebar + kombinierte Übersicht</h2>
        <div className={s.mockShell}>
          <div className={s.mockSidebar}>
            <div className={s.mockMarke}>
              <span className={s.mockMarkePunkt} />
              <span className={s.mockMarkeName}>AK Assistance</span>
            </div>
            <div className={`${s.mockNavItem} ${s["mockNavItem--aktiv"]}`}>Übersicht</div>
            <div className={s.mockNavItem}>Kosten</div>
            <div className={s.mockNavItem}>Kunden-Verbrauch</div>
            <div className={s.mockNavItem}>
              Alerts <span className={s.mockNavZaehler}>2</span>
            </div>
          </div>
          <div className={s.mockContent}>
            <div className={s.mockWarnband}>2 Warnungen — n8n Cloud überfällig, 1 Voice-Agent-Workflow inaktiv</div>
            <div className={s.metricGrid}>
              <div className={s.metricCard}>
                <div className={s.metricLabel}>Kosten / Monat</div>
                <div className={`${s.metricWert} ${s.mono}`} style={{ fontSize: 20 }}>1.240 €</div>
              </div>
              <div className={s.metricCard}>
                <div className={s.metricLabel}>Claude-Guthaben</div>
                <div className={`${s.metricWert} ${s.mono}`} style={{ fontSize: 20 }}>84,20 $</div>
              </div>
              <div className={s.metricCard}>
                <div className={s.metricLabel}>Aktive Agenten</div>
                <div className={`${s.metricWert} ${s.mono}`} style={{ fontSize: 20 }}>3 / 5</div>
              </div>
              <div className={s.metricCard}>
                <div className={s.metricLabel}>Offene Alerts</div>
                <div className={`${s.metricWert} ${s.mono}`} style={{ fontSize: 20, color: "var(--handlung-text)" }}>2</div>
              </div>
            </div>
            <div className={s.mockZweiSpalten}>
              <div>
                <div className={s.mockSpaltenTitel}>Kosten &amp; Fälligkeiten</div>
                <div className={s.karte}>
                  <div className={s.zeile}>
                    <span className={s.zeilePunkt} style={{ background: "var(--handlung-dot)" }} />
                    <span className={s.zeileName}>n8n Cloud</span>
                    <span className={s.zeileKontext}>überfällig</span>
                    <span className={s.zeileWert}>29,00 €</span>
                  </div>
                  <div className={s.zeile}>
                    <span className={s.zeilePunkt} style={{ background: "var(--ok-dot)" }} />
                    <span className={s.zeileName}>Retell.ai</span>
                    <span className={s.zeileKontext}>in 12 Tagen</span>
                    <span className={s.zeileWert}>142,80 €</span>
                  </div>
                </div>
              </div>
              <div>
                <div className={s.mockSpaltenTitel}>Alerts</div>
                <div className={s.karte}>
                  <div className={s.zeile}>
                    <span className={s.zeilePunkt} style={{ background: "var(--handlung-dot)" }} />
                    <span className={s.zeileName}>Müller — Workflow inaktiv</span>
                    <span className={s.zeileKontext}>heute, 09:23</span>
                    <span className={s.zeileWert}>hoch</span>
                  </div>
                  <div className={s.zeile}>
                    <span className={s.zeilePunkt} style={{ background: "var(--beobachten-dot)" }} />
                    <span className={s.zeileName}>V2 — Rückruf wartet</span>
                    <span className={s.zeileKontext}>vor 40 Min.</span>
                    <span className={s.zeileWert}>mittel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
