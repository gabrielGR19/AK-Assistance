"""Tests für store.py: Dedupe und Telefonnormalisierung."""

from leadgen import store


def _lead(place_id, telefon="0911 123456"):
    return {
        "place_id": place_id,
        "firma": "Testfirma GmbH",
        "branche": "Schlüsseldienst",
        "website": None,
        "telefon": telefon,
        "ort": "Nürnberg",
        "sterne": 4.5,
        "bewertungen": 10,
        "region": "Nürnberg",
        "maps_url": "https://maps.google.com/?cid=123",
        "gefunden_am": "2026-07-29T10:00:00",
    }


def test_dedupe_gleicher_lead_zweimal_nur_eine_zeile():
    conn = store.verbindung_oeffnen(":memory:")

    ergebnis1 = store.lead_einfuegen(conn, _lead("place-1"))
    ergebnis2 = store.lead_einfuegen(conn, _lead("place-1"))
    conn.commit()

    assert ergebnis1 == "neu"
    assert ergebnis2 == "duplikat"
    anzahl = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
    assert anzahl == 1


def test_telefonnormalisierung_deutsche_nummer():
    assert store.normalisiere_telefon("0911 123456") == "+49911123456"


def test_telefonnormalisierung_ungueltige_nummer_gibt_none():
    assert store.normalisiere_telefon("keine-telefonnummer") is None
    assert store.normalisiere_telefon(None) is None


def _lauf_einfuegen(conn, gestartet_am, api_calls):
    conn.execute(
        "INSERT INTO runs (gestartet_am, beendet_am, api_calls, gefunden, gefiltert, duplikate, neu) "
        "VALUES (?, ?, ?, 0, 0, 0, 0)",
        (gestartet_am, gestartet_am, api_calls),
    )


def test_calls_dieser_monat_summiert_nur_den_angefragten_monat():
    conn = store.verbindung_oeffnen(":memory:")
    _lauf_einfuegen(conn, "2026-07-05 08:00:00", 10)
    _lauf_einfuegen(conn, "2026-07-20 08:00:00", 15)
    _lauf_einfuegen(conn, "2026-08-01 08:00:00", 99)
    conn.commit()

    assert store.calls_dieser_monat(conn, "2026-07") == 25
    assert store.calls_dieser_monat(conn, "2026-08") == 99


def test_calls_dieser_monat_ohne_laeufe_gibt_null():
    conn = store.verbindung_oeffnen(":memory:")
    assert store.calls_dieser_monat(conn, "2026-07") == 0
