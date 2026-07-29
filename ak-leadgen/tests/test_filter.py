"""Test 2: Filter-Logik nach config.yaml-Schema."""

from leadgen.main import filtere_lead


FILTER_CFG = {
    "min_bewertungen": 5,
    "min_sterne": 3.0,
    "telefon_pflicht": True,
    "website_pflicht": False,
}


def test_lead_mit_zu_wenig_bewertungen_faellt_raus():
    lead = {
        "telefon": "0911 123456",
        "website": None,
        "bewertungen": 3,
        "sterne": 4.5,
    }
    assert filtere_lead(lead, FILTER_CFG) is False


def test_lead_der_alle_kriterien_erfuellt_besteht():
    lead = {
        "telefon": "0911 123456",
        "website": None,
        "bewertungen": 10,
        "sterne": 4.0,
    }
    assert filtere_lead(lead, FILTER_CFG) is True
