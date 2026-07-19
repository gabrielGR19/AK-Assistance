#!/usr/bin/env python3
# Produktions-Schutz-Hook (PreToolUse, Bash): erzwingt eine Bestätigung ("ask")
# für destruktive Befehle Richtung Live-Systeme und für lokal irreversible
# Aktionen. Blockiert nichts — Gabriel sieht den Befehl immer und entscheidet.
#
# Hintergrund: Incident 2026-07-18 — rsync + rm -rf auf den Hetzner-
# Produktionsserver ohne Server-Stand-Prüfung; uncommitteter Server-Code
# (lib/retell.ts) wurde überschrieben. Siehe Memory: incident_2026-07-18_cockpit-deploy.
#
# Abdeckung ("ask", nie stiller Durchlauf):
# - ssh/scp mit destruktiver Remote-Aktion (rm, sed -i, tee, >, mv, truncate,
#   dd, mkfs, pm2/systemctl-Mutationen, DROP TABLE, Deploy-Skripte)
# - rsync/scp mit Remote-Ziel ohne --dry-run/-n
# - rm -r/-f außerhalb sicherer Pfade (auch via xargs)
# - git push --force, git reset --hard, git clean -f
# Grenzen: Versehens-Schutz, kein Sandbox-Ersatz — exotische Umgehungen
# (Subshells, Variablen-Indirektion) fängt er nicht.
import json
import os
import re
import shlex
import sys


def frage(grund: str):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason": (
                f"Produktions-Schutz: {grund} — Deploy-Regeln beachten "
                "(Server-Stand prüfen, Backup, Diff zeigen, Bestätigung)."
            ),
        }
    }))
    sys.exit(0)


# Destruktive Aktionen innerhalb eines ssh/scp-Kommandos
SSH_DESTRUKTIV = re.compile(
    r"\brm\b|\bsed\s+(-\S*\s+)*-i\b|\btee\b|>{1,2}|\bmv\b|\btruncate\b"
    r"|\bdd\b|\bmkfs\b|\bdrop\s+(table|database)\b"
    r"|\bpm2\s+(delete|del|stop|restart|reload|kill|flush)\b"
    r"|\bsystemctl\s+(stop|restart|disable|mask|daemon-reload)\b"
    r"|[\w.\-]*deploy[\w.\-]*\.(sh|py)\b|\bnpm\s+run\s+(build|deploy)\b",
    re.IGNORECASE,
)

# Harmloses vor der Prüfung entfernen (Stderr-Umleitungen etc.)
HARMLOSE_REDIRECTS = re.compile(r"2>&1|>&2|1>&2|&?>{1,2}\s*/dev/null")

SICHERE_RM_PREFIXE = ("/tmp/", "/private/tmp/", "/var/folders/", "$TMPDIR")
SICHERE_RM_NAMEN = {"node_modules", ".next", "dist", "build", "out",
                    "__pycache__", ".cache", "coverage"}


def rm_ziel_sicher(pfad: str) -> bool:
    p = os.path.expanduser(pfad)
    if any(p.startswith(pre) for pre in SICHERE_RM_PREFIXE):
        return True
    if "/scratchpad" in p:
        return True
    return os.path.basename(p.rstrip("/")) in SICHERE_RM_NAMEN


def tokens_von(text: str):
    try:
        return shlex.split(text)
    except ValueError:
        return text.split()


def ist_remote_ziel(tok: str) -> bool:
    # user@host:pfad oder host:pfad (aber keine URLs wie https://)
    if tok.startswith("-") or "://" in tok:
        return False
    return bool(re.match(r"^\S+@\S+:", tok) or re.match(r"^[\w.\-]+:[/~]", tok))


try:
    daten = json.load(sys.stdin)
except Exception:
    # Fail-safe: kaputter Input → nachfragen statt still durchlassen
    frage("Hook-Input nicht lesbar — Befehl bitte manuell prüfen.")

if daten.get("tool_name") != "Bash":
    sys.exit(0)

kommando = daten.get("tool_input", {}).get("command", "") or ""
bereinigt = HARMLOSE_REDIRECTS.sub("", kommando)
toks = tokens_von(kommando)

# 1) ssh/scp mit destruktiver Remote-Aktion
if re.search(r"(?:^|[\s(;&|])(ssh|scp)\s", bereinigt) and SSH_DESTRUKTIV.search(bereinigt):
    frage("SSH/SCP-Befehl mit potenziell destruktiver Aktion auf einem Remote-System.")

# 2) rsync/scp mit Remote-Ziel ohne Dry-Run
if "rsync" in toks and any(ist_remote_ziel(t) for t in toks):
    dry = any(t == "--dry-run" or re.match(r"^-[a-z]*n[a-z]*$", t, re.IGNORECASE)
              for t in toks)
    if not dry:
        frage("rsync auf ein Remote-Ziel ohne --dry-run — überschreibt Dateien auf dem Server.")
if "scp" in toks and any(ist_remote_ziel(t) for t in toks):
    frage("scp kopiert Dateien auf/von einem Remote-System und überschreibt das Ziel.")

# 3) Irreversible Git-Aktionen
if re.search(r"\bgit\b[^\n]*\bpush\b[^\n]*(--force(-with-lease)?\b|\s-f\b)", kommando):
    frage("git push --force überschreibt Historie auf dem Remote.")
if re.search(r"\bgit\b[^\n]*\breset\b[^\n]*--hard", kommando):
    frage("git reset --hard verwirft lokale Änderungen unwiederbringlich.")
if re.search(r"\bgit\b[^\n]*\bclean\b[^\n]*\s-[a-z]*[fdx]", kommando):
    frage("git clean -f löscht ungetrackte Dateien unwiederbringlich.")

# 4) rm -r/-f außerhalb sicherer Pfade (auch via xargs)
if re.search(r"\bxargs\b[^\n|;&]*\brm\b", kommando):
    frage("rm über xargs — Löschumfang ist vorab nicht sichtbar.")

for seg in re.split(r"&&|\|\||;", kommando):
    seg_toks = tokens_von(seg)
    while seg_toks and seg_toks[0] in ("sudo", "env", "command"):
        seg_toks = seg_toks[1:]
    if not seg_toks or seg_toks[0] != "rm":
        continue
    flags = [t for t in seg_toks[1:] if t.startswith("-")]
    args = [t for t in seg_toks[1:] if not t.startswith("-")]
    gefaehrlich = ("--recursive" in flags or "--force" in flags or
                   any(not f.startswith("--") and ("r" in f or "f" in f) for f in flags))
    if not gefaehrlich:
        continue
    if args and all(rm_ziel_sicher(a) for a in args):
        continue
    frage(f"rm mit -r/-f außerhalb sicherer Pfade: {' '.join(args)[:120] or '(Ziel unklar)'}.")

sys.exit(0)
