"""SQLite-Speicher für Leads und Läufe. Keine Netzwerkabhängigkeit."""

import sqlite3
from pathlib import Path

import phonenumbers

SCHEMA = """
CREATE TABLE IF NOT EXISTS leads (
  place_id      TEXT PRIMARY KEY,
  firma         TEXT NOT NULL,
  branche       TEXT,
  website       TEXT,
  telefon       TEXT,
  telefon_norm  TEXT,
  ort           TEXT,
  sterne        REAL,
  bewertungen   INTEGER,
  region        TEXT,
  maps_url      TEXT,
  gefunden_am   TEXT NOT NULL,
  exportiert_am TEXT,
  erreicht      TEXT,
  interesse     TEXT,
  lead_email    TEXT,
  termin        TEXT,
  notiz         TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tel ON leads(telefon_norm)
  WHERE telefon_norm IS NOT NULL;

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gestartet_am TEXT,
  beendet_am TEXT,
  api_calls INTEGER,
  gefunden INTEGER,
  gefiltert INTEGER,
  duplikate INTEGER,
  neu INTEGER
);
"""


def verbindung_oeffnen(pfad):
    """Öffnet die SQLite-Datenbank unter pfad und legt das Schema an, falls nötig."""
    pfad = Path(pfad)
    pfad.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(pfad))
    conn.executescript(SCHEMA)
    conn.commit()
    return conn


def normalisiere_telefon(roh):
    """Normalisiert eine deutsche Telefonnummer nach E.164. None bei Ungültigkeit."""
    if not roh:
        return None
    try:
        nummer = phonenumbers.parse(roh, "DE")
    except phonenumbers.NumberParseException:
        return None
    if not phonenumbers.is_valid_number(nummer):
        return None
    return phonenumbers.format_number(nummer, phonenumbers.PhoneNumberFormat.E164)


def lead_einfuegen(conn, lead):
    """Fügt einen Lead ein. Gibt 'neu' oder 'duplikat' zurück.

    Duplikat-Erkennung läuft über INSERT OR IGNORE gegen place_id (Primärschlüssel)
    und telefon_norm (Unique-Index) gemeinsam - die Ursache wird nicht unterschieden,
    die Zusammenfassung braucht nur die Zahl.
    """
    telefon_norm = normalisiere_telefon(lead.get("telefon"))
    cur = conn.execute(
        """
        INSERT OR IGNORE INTO leads
          (place_id, firma, branche, website, telefon, telefon_norm,
           ort, sterne, bewertungen, region, maps_url, gefunden_am)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            lead["place_id"],
            lead["firma"],
            lead.get("branche"),
            lead.get("website"),
            lead.get("telefon"),
            telefon_norm,
            lead.get("ort"),
            lead.get("sterne"),
            lead.get("bewertungen"),
            lead.get("region"),
            lead.get("maps_url"),
            lead["gefunden_am"],
        ),
    )
    return "neu" if cur.rowcount == 1 else "duplikat"


def lauf_starten(conn):
    """Legt einen neuen Run-Eintrag an und gibt dessen ID zurück."""
    cur = conn.execute(
        "INSERT INTO runs (gestartet_am) VALUES (datetime('now'))"
    )
    return cur.lastrowid


def lauf_beenden(conn, lauf_id, api_calls, gefunden, gefiltert, duplikate, neu):
    """Schreibt die Abschlussdaten eines Laufs in die Runs-Tabelle."""
    conn.execute(
        """
        UPDATE runs
           SET beendet_am = datetime('now'),
               api_calls = ?, gefunden = ?, gefiltert = ?,
               duplikate = ?, neu = ?
         WHERE id = ?
        """,
        (api_calls, gefunden, gefiltert, duplikate, neu, lauf_id),
    )


def als_exportiert_markieren(conn, place_ids):
    """Setzt exportiert_am für die übergebenen place_ids auf jetzt."""
    if not place_ids:
        return
    conn.executemany(
        "UPDATE leads SET exportiert_am = datetime('now') WHERE place_id = ?",
        [(pid,) for pid in place_ids],
    )


def status_zuruecksynchronisieren(conn, sheet_zeilen):
    """Schreibt Spalten G-K aus dem Sheet zurück in die DB (Rücksync über place_id).

    Zeilen mit unbekannter place_id werden übersprungen und gezählt statt den
    Sync abzubrechen. Gibt (aktualisiert, uebersprungen) zurück.
    """
    aktualisiert = 0
    uebersprungen = 0
    for zeile in sheet_zeilen:
        cur = conn.execute(
            """
            UPDATE leads
               SET erreicht = ?, interesse = ?, lead_email = ?,
                   termin = ?, notiz = ?
             WHERE place_id = ?
            """,
            (
                zeile.get("erreicht"),
                zeile.get("interesse"),
                zeile.get("lead_email"),
                zeile.get("termin"),
                zeile.get("notiz"),
                zeile["place_id"],
            ),
        )
        if cur.rowcount == 1:
            aktualisiert += 1
        else:
            uebersprungen += 1
    return aktualisiert, uebersprungen


def statistik(conn):
    """Liefert die Anzahl Leads je Branche und Region."""
    cur = conn.execute(
        """
        SELECT branche, region, COUNT(*)
          FROM leads
         GROUP BY branche, region
         ORDER BY branche, region
        """
    )
    return cur.fetchall()
