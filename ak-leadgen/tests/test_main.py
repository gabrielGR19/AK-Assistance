"""Test: Monatsbremse (Sicherheitsabstand zum Places-API-Freikontingent)."""

from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from leadgen import main, store

MINIMAL_CONFIG = {
    "regionen": [{"name": "Nürnberg", "lat": 49.4521, "lng": 11.0767, "radius_km": 25}],
    "suchbloecke": [{"begriff": "Schlüsseldienst", "anzahl": 20}],
    "filter": {
        "min_bewertungen": 5, "min_sterne": 3.0,
        "telefon_pflicht": True, "website_pflicht": False,
    },
    "max_neue_leads_pro_lauf": 100,
    "max_api_calls_pro_lauf": 300,
    "sprache": "de",
    "region_code": "DE",
}
UMGEBUNG = {"GOOGLE_MAPS_API_KEY": "x", "GOOGLE_SERVICE_ACCOUNT_FILE": "x", "SHEET_ID": "x"}


def _db_mit_calls_diesen_monat(tmp_path, calls):
    db_pfad = tmp_path / "leads.db"
    conn = store.verbindung_oeffnen(db_pfad)
    monat_start = datetime.now().strftime("%Y-%m-01 00:00:00")
    conn.execute(
        "INSERT INTO runs (gestartet_am, beendet_am, api_calls, gefunden, gefiltert, duplikate, neu) "
        "VALUES (?, ?, ?, 0, 0, 0, 0)",
        (monat_start, monat_start, calls),
    )
    conn.commit()
    conn.close()
    return db_pfad


def test_monatslimit_erreicht_bricht_ab_vor_jedem_api_call(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DB_PFAD", _db_mit_calls_diesen_monat(tmp_path, 900))
    args = SimpleNamespace(dry_run=False, block=None)

    with patch("leadgen.main.sheet.verbinden") as sheet_verbinden, \
         patch("leadgen.main.places.suche_alle_seiten") as suche:
        with pytest.raises(main.MonatslimitFehler, match="900/900"):
            main.befehl_run(args, MINIMAL_CONFIG, UMGEBUNG)

    sheet_verbinden.assert_not_called()
    suche.assert_not_called()


def test_monatslimit_knapp_unterschritten_laeuft_normal_weiter(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DB_PFAD", _db_mit_calls_diesen_monat(tmp_path, 899))
    args = SimpleNamespace(dry_run=True, block=None)

    worksheet = object()
    with patch("leadgen.main.sheet.verbinden", return_value=worksheet), \
         patch("leadgen.main.sheet.header_pruefen"), \
         patch("leadgen.main.places.suche_alle_seiten", return_value=([], 1)) as suche:
        main.befehl_run(args, MINIMAL_CONFIG, UMGEBUNG)

    suche.assert_called_once()
