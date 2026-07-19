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

# Operatoren, die in Bash auf einen Schreib-/Löschzugriff hindeuten
SCHREIB_OP = re.compile(r"(?:>{1,2}|\btee\b|\bcp\b|\bmv\b|\brm\b|\bsed\s+(-\S*\s+)*-i\b|\btruncate\b|\bln\b)")


def geschuetzt(pfad: str) -> bool:
    name = os.path.basename(pfad.rstrip("/")).casefold()
    return any(fnmatch.fnmatch(name, m) for m in MUSTER)


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
    if SCHREIB_OP.search(kommando):
        try:
            tokens = shlex.split(kommando)
        except ValueError:
            tokens = kommando.split()
        for t in tokens:
            if geschuetzt(t):
                blockieren(f"Bash-Kommando schreibt/löscht mutmaßlich '{os.path.basename(t)}'.")
else:
    for feld in ("file_path", "notebook_path"):
        pfad = tool_input.get(feld, "")
        if pfad and geschuetzt(pfad):
            blockieren(f"'{os.path.basename(pfad)}' ist eine geschützte Datei.")
