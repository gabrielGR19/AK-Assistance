---
name: n8n-review
description: Pflicht-Workflow für JEDE n8n-Aufgabe — erst bauen, dann aus unabhängiger Perspektive reviewen, dann Ergebnis liefern. IMMER verwenden, wenn ein n8n-Workflow erstellt, erweitert, umgebaut oder gedebuggt wird — auch wenn Gabriel nur "bau mir einen Workflow" oder "fix den Workflow" sagt, ohne Review zu erwähnen. Nie nur bauen ohne Review-Schritt.
---

# n8n-Review: Bauen → unabhängig reviewen → liefern

Warum: Ein Workflow, der "aussieht als ob er läuft", ist in n8n schnell
gebaut — Fehler zeigen sich erst in Produktion (n8n.ak-assistance.de läuft
live für Blog/Telefon). Der unabhängige Review-Schritt fängt das ab, bevor
etwas deployed wird.

## Phase 1 — BUILD

1. Workflow bauen bzw. ändern (n8n-MCP: `search_nodes`, `get_node`,
   `n8n_create_workflow` / `n8n_update_partial_workflow`).
2. Technisch validieren: `n8n_validate_workflow` (bzw. `validate_node` bei
   Einzelnodes) — Fehler beheben, bevor es in den Review geht.
3. Credentials nie neu anlegen, ohne vorher live zu prüfen, ob passende
   existieren (`n8n_manage_credentials` list — Globalregel Verifikation).

## Phase 2 — REVIEW (unabhängige Perspektive)

Den Review an den `pruefer`-Agent delegieren (nicht selbst reviewen — wer
gebaut hat, übersieht die eigenen Annahmen). Dem Agent das Workflow-JSON
plus den Auftrag geben. Review-Checkliste:

- **Funktionalität:** Erfüllt der Workflow den Auftrag? Alle Pfade
  (Success, Error, Edge-Cases wie leere Ergebnisse) abgedeckt?
- **Fehlerbehandlung:** Was passiert bei API-Fehlern, Timeouts, leeren
  Antworten? Gibt es Error-Branches / sinnvolle Retries?
- **Sicherheit:** Keine Secrets im JSON (nur Credential-Referenzen),
  keine ungeprüften Eingaben in kritische Nodes.
- **Korrektheit der Verdrahtung:** Node-Verbindungen, Expressions,
  Feldnamen zwischen Nodes konsistent?
- **Einfachheit:** Geht es mit weniger Nodes? (Karpathy)

## Phase 3 — ERGEBNIS

1. Befunde aus dem Review bewerten und berechtigte Punkte einarbeiten;
   erneut validieren.
2. Gabriel kompakt berichten: was gebaut, was der Review fand, was
   geändert wurde.
3. Finales JSON nach `n8n-workflows/` exportieren und committen
   (Projektregel: Workflow-Änderungen versionieren).
4. **Nie selbst aktivieren/publishen** — Aktivierung (n8n v2.0:
   "Publish"-Button) macht Gabriel nach expliziter Bestätigung
   (Globalregel Deployments).
