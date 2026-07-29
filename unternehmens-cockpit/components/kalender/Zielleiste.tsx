"use client";

import { useState } from "react";
import { iso } from "./datum";
import {
  MEILENSTEINE,
  MEILENSTEIN_HINWEIS,
  ZIEL_DATUM,
  ZIEL_NACHSATZ,
  ZIEL_SATZ,
  ZIEL_ZUSTAENDE,
} from "./ziele";
import s from "./kalender.module.css";

// Zielleiste über dem Kalender: zugeklappt eine Zeile, aufgeklappt die zehn messbaren
// Zustände und die Meilensteine rückwärts. Der Meilenstein der laufenden Woche ist
// hervorgehoben — das ist der einzige bewegliche Teil, alles andere steht fest.
export function Zielleiste() {
  const [offen, setOffen] = useState(false);
  const heute = iso(new Date());

  return (
    <section className={s.ziel}>
      <button className={s.zielKopf} aria-expanded={offen} onClick={() => setOffen((o) => !o)}>
        <span className={s.zielMarke}>ZIEL {ZIEL_DATUM}</span>
        <span className={s.zielSatz}>{ZIEL_SATZ}</span>
        <span className={`${s.zielPfeil}${offen ? " " + s.zielPfeilOffen : ""}`}>▶</span>
      </button>

      {offen && (
        <div className={s.zielPanel}>
          <div className={s.zielSpalte}>
            <h4>Woran wir es messen — zehn Zustände</h4>
            <ul className={s.zielListe}>
              {ZIEL_ZUSTAENDE.map((z) => (
                <li key={z}>{z}</li>
              ))}
            </ul>
            <p className={s.zielNachsatz}>{ZIEL_NACHSATZ}</p>
          </div>

          <div className={s.zielSpalte}>
            <h4>Meilensteine rückwärts</h4>
            {MEILENSTEINE.map((m) => {
              const jetzt = heute >= m.von && heute <= m.bis;
              return (
                <div key={m.kw} className={`${s.msZeile}${jetzt ? " " + s.msZeileJetzt : ""}`}>
                  <span className={s.msKw}>{m.kw}</span>
                  <span>{m.text}</span>
                </div>
              );
            })}
            <p className={s.zielFussnote}>{MEILENSTEIN_HINWEIS}</p>
          </div>
        </div>
      )}
    </section>
  );
}
