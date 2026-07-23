---
name: abnahme
description: Pflicht-Abnahme nach JEDEM Feature/Bugfix — App real starten, den echten Nutzer-Flow durchspielen (inkl. Randfälle wie heutiges Datum), Ergebnis in Grün/Rot/Selbst-testen einteilen. IMMER verwenden, bevor eine Bauaufgabe als "fertig" gemeldet wird — auch wenn Gabriel nur "bau X" oder "fixe Y" sagt, ohne Abnahme zu erwähnen. Build grün + Code-Review reichen NICHT als Fertig-Meldung.
---

# Abnahme: der echte Nutzer-Flow entscheidet, nicht der Build

Warum: Am 21.07.2026 gaben 5 Reviews "Freigabe JA" — und Gabriels erster
echter Klick im Cockpit schlug trotzdem fehl (Datums-Randfall + verwirrende
Doppel-Aktion im UI). Code-Korrektheit ist notwendig, aber nicht
hinreichend. Fertig ist eine Aufgabe erst nach dieser Abnahme.

## Schritte

### 1. App real starten

Nicht nur bauen — laufen lassen, wie Gabriel sie nutzt:

- Cockpit / Web-App: `npm run dev` (bzw. Build + Start), dann gegen die
  laufende Instanz testen — nie nur gegen Funktionen im Testrunner.
- Skript/CLI: wirklich ausführen, mit echten (oder realistisch kopierten)
  Eingabedaten.
- n8n-Workflow: Testlauf über den n8n-Testmechanismus (kein Publish).
- Vorher Datenstände sichern, die der Test verändert
  (z. B. `data/*.json` → Scratchpad), danach zurückspielen.

### 2. Nutzer-Flow durchspielen

Den Ablauf gehen, den **Gabriel** real ausführen wird — Schritt für
Schritt, in seiner Reihenfolge: einloggen → navigieren → eintragen →
speichern → Ergebnis ansehen. Per curl/Browser-Tools ausführen, jede
Station mit sichtbarem Ergebnis. Wenn das UI zwei ähnliche Aktionen hat
(z. B. "Speichern" vs. "Live abrufen"): beide Wege testen — Verwechslung
ist ein Befund, kein Nutzerfehler.

### 3. Randfall-Checkliste (immer, keine Auswahl)

- **Heutiges Datum / Zeitgrenzen** (der Cockpit-Klassiker: APIs lehnen
  "heute" teils ab)
- **Leere oder falsche Eingabe** (Feld leer, Text statt Zahl, negativer Wert)
- **Erste Nutzung** (leerer Datenbestand, fehlende optionale Felder)
- **Doppelter Klick / doppelter Aufruf** (Idempotenz)
- **Seite neu laden / Prozess neu starten** (bleibt der Zustand korrekt?)

### 4. Ergebnis in genau drei Kategorien

```
## Abnahme <Feature>

### Grün (selbst verifiziert)
- <Schritt> → <Beleg: Ausgabe/Statuscode>

### Rot (kaputt)
- <Schritt> → <was passiert> → <Reproduktion in 1 Zeile>

### Musst du selbst testen
- <was ich technisch nicht kann — z. B. Telegram-Push auf deinem Handy,
  echter Anruf, Optik im Browser>
```

Regeln: Nichts als Grün melden ohne Beleg. "Musst du selbst testen" darf
nie leer sein, wenn es Außenwirkung (Nachrichten, Anrufe, Deploys) oder
visuelle Aspekte gibt. Bei Rot: erst Ursache benennen, dann Fix
vorschlagen — nicht stillschweigend weiterbauen.
