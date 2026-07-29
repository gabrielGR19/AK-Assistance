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
