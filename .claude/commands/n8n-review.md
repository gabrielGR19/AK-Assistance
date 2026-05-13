# n8n-review — Baut n8n-Workflows und überprüft sie aus unabhängiger Perspektive

## Trigger

Verwende diesen Skill automatisch, wenn der Nutzer eine Aufgabe beschreibt, die das Erstellen, Erweitern oder Debuggen eines n8n-Workflows betrifft.

## Ablauf (immer in dieser Reihenfolge)

### Phase 1 — BUILD: Workflow konstruieren

1. Analysiere die Aufgabenstellung vollständig, bevor du etwas baust.
2. Identifiziere alle benötigten n8n-Nodes, Trigger, Credentials und Datenflüsse.
3. Baue den Workflow Schritt für Schritt:
   - Definiere den Trigger-Node (Webhook, Schedule, etc.)
   - Verbinde alle Nodes in der richtigen Reihenfolge
   - Konfiguriere Expressions, Mappings und Error-Handling korrekt
   - Achte auf korrekte Datentypen (String, Number, JSON, Array)
4. Dokumentiere jeden Node kurz: was er tut und warum er so konfiguriert ist.
5. Gib den fertigen Workflow als JSON aus (importierbar in n8n).

### Phase 2 — REVIEW: Unabhängige Qualitätsprüfung

Wechsle jetzt mental in eine unvoreingenommene Reviewer-Rolle. Stell dir vor, du siehst den Workflow zum ersten Mal.

Prüfe systematisch:

**Funktionalität**
- [ ] Löst der Workflow die gestellte Aufgabe vollständig?
- [ ] Sind alle Edge Cases berücksichtigt (leere Daten, fehlende Felder, API-Fehler)?
- [ ] Stimmt die Reihenfolge der Nodes logisch?

**Korrektheit**
- [ ] Sind alle Expressions (`{{ $json.field }}`) syntaktisch korrekt?
- [ ] Werden Daten zwischen Nodes korrekt weitergegeben?
- [ ] Sind Credentials-Referenzen vorhanden und richtig benannt?

**Robustheit**
- [ ] Gibt es Error-Handling (Error Trigger, Try/Catch-ähnliche Strukturen)?
- [ ] Werden Timeouts oder Rate-Limits der verwendeten APIs berücksichtigt?
- [ ] Gibt es Logging oder Benachrichtigung bei Fehlern?

**n8n-Best-Practices**
- [ ] Werden Set-Nodes genutzt, um Daten sauber zu strukturieren?
- [ ] Ist der Workflow nicht unnötig komplex (zu viele Function-Nodes statt nativer Nodes)?
- [ ] Sind Workflow-Name und Node-Namen aussagekräftig?

### Phase 3 — ERGEBNIS

Gib nach dem Review eine klare Zusammenfassung:

```
REVIEW-ERGEBNIS
───────────────
✅ Funktioniert: [was korrekt ist]
⚠️  Verbesserungen: [was optimiert werden sollte]
❌ Fehler: [was behoben werden muss]

FINALE BEWERTUNG: [Bereit zum Einsatz / Needs Fix / Grundlegend überarbeiten]
```

Falls Fehler oder Verbesserungen gefunden wurden: korrigiere den Workflow sofort und liefere die bereinigte JSON-Version.

## Wichtige n8n-Regeln

- Expressions beginnen immer mit `{{` und enden mit `}}`
- Auf vorherige Node-Daten zugreifen: `{{ $node["NodeName"].json.field }}`  
- Auf aktuellen Input zugreifen: `{{ $json.field }}`
- Arrays iterieren mit SplitInBatches oder dem Item-Konzept
- HTTP Request Nodes brauchen immer Method + URL, Auth ist optional
- Webhook-Nodes: unterscheide zwischen Test-URL und Production-URL
- Zeitpläne (Schedule Trigger) in Cron-Syntax oder mit n8n-UI konfigurieren

## Ausgabeformat

1. Kurze Bestätigung, was gebaut wird
2. Phase 1: Workflow-JSON (vollständig, importierbar)
3. Phase 2: Review-Checkliste mit Ergebnis pro Punkt
4. Phase 3: Zusammenfassung + ggf. korrigierter Workflow
