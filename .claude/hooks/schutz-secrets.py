#!/usr/bin/env python3
# Schutz-Hook (PreToolUse): blockiert Schreibzugriffe auf Dateien mit Secrets.
# Exit 2 = Tool-Aufruf wird blockiert, Meldung geht an Claude.
#
# Abdeckung:
# - Edit/Write (file_path) und NotebookEdit (notebook_path)
# - Bash: nur wenn eine geschützte Datei UND ein Schreib-/Löschoperator
#   im Kommando vorkommen (Lesen wie `cat .env` bleibt erlaubt)
# Grenzen: bewusst ein Schutz gegen Versehen, kein Sandbox-Ersatz —
# exotische Umgehungen (Subshells, Variablen-Indirektion) fängt er nicht.
import fnmatch
import json
import os
import re
import shlex
import sys

# Geschützte Dateinamen (Match auf Basename, case-insensitiv)
MUSTER = [
    ".env", ".env.*", "*.env",
    "settings.local.json", ".mcp.json", "mcp.json",
    "*.pem", "*.key", "*.p12", "*.pfx",
    "id_rsa*", "id_ed25519*", "id_ecdsa*",
    ".netrc", ".pgpass", ".npmrc", ".htpasswd", ".git-credentials",
    "credentials", "credentials.json", "serviceaccount*.json",
]

# Vorlagen-Dateien sind keine Secrets: sie dokumentieren nur Variablennamen
# und liegen bewusst im Git. Echte Werte gehören trotzdem nie hinein —
# das fängt der Git-Secrets-Check vor dem Commit.
AUSNAHMEN = ["*.example", "*.sample", "*.template"]

# Operatoren, die in Bash auf einen Schreib-/Löschzugriff hindeuten.
# ">(?!&)" nimmt Stream-Duplikation wie 2>&1 aus (schreibt keine Datei);
# "2> datei" bleibt erfasst.
SCHREIB_OP = re.compile(r"(?:>{1,2}(?!&)|\btee\b|\bcp\b|\bmv\b|\brm\b|\bsed\s+(-\S*\s+)*-i\b|\btruncate\b|\bln\b)")

# Quoted-Abschnitte ('…' oder "…") — Operatoren darin sind Daten (z.B.
# grep-Muster wie "^[<>ch]"), keine Shell-Operatoren.
QUOTED = re.compile(r"'[^']*'|\"[^\"]*\"")


def geschuetzt(pfad: str) -> bool:
    name = os.path.basename(pfad.rstrip("/")).casefold()
    if any(fnmatch.fnmatch(name, a) for a in AUSNAHMEN):
        return False
    return any(fnmatch.fnmatch(name, m) for m in MUSTER)


def relevante_tokens(tokens: list) -> list:
    # Argumente von --exclude/--exclude-from überspringen: ein Exclude
    # schützt die Datei vor dem Zugriff, statt sie zu schreiben.
    ergebnis = []
    ueberspringen = False
    for t in tokens:
        if ueberspringen:
            ueberspringen = False
            continue
        if t in ("--exclude", "--exclude-from"):
            ueberspringen = True
            continue
        if t.startswith("--exclude=") or t.startswith("--exclude-from="):
            continue
        ergebnis.append(t)
    return ergebnis


def blockieren(grund: str):
    print(
        f"Blockiert durch Schutz-Hook: {grund} "
        "Diese Datei kann Secrets enthalten und darf nicht von Claude "
        "geändert werden. Gabriel ändert sie bei Bedarf selbst.",
        file=sys.stderr,
    )
    sys.exit(2)


try:
    daten = json.load(sys.stdin)
except Exception:
    # Fail-closed: kaputter Input → im Zweifel blockieren
    blockieren("Hook-Input nicht lesbar (fail-closed).")

tool = daten.get("tool_name", "")
tool_input = daten.get("tool_input", {})

if tool == "Bash":
    kommando = tool_input.get("command", "")
    if SCHREIB_OP.search(QUOTED.sub(" ", kommando)):
        try:
            tokens = shlex.split(kommando)
        except ValueError:
            tokens = kommando.split()
        for t in relevante_tokens(tokens):
            if geschuetzt(t):
                blockieren(f"Bash-Kommando schreibt/löscht mutmaßlich '{os.path.basename(t)}'.")
else:
    for feld in ("file_path", "notebook_path"):
        pfad = tool_input.get(feld, "")
        if pfad and geschuetzt(pfad):
            blockieren(f"'{os.path.basename(pfad)}' ist eine geschützte Datei.")
