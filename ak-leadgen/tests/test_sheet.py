"""Test 4: Sheet-Header-Prüfung - abweichender Header führt zu Abbruch, kein Schreibversuch."""

from unittest.mock import Mock, patch

import pytest

from leadgen import sheet


def test_abweichender_header_bricht_ab_ohne_schreibversuch():
    worksheet = Mock()
    worksheet.row_values.return_value = ["Firma", "Branche", "FALSCHE_SPALTE"]

    with pytest.raises(sheet.SheetFehler, match="Spalte 3"):
        sheet.header_pruefen(worksheet)

    worksheet.append_row.assert_not_called()
    worksheet.update.assert_not_called()


def test_leerer_header_wird_angelegt():
    worksheet = Mock()
    worksheet.row_values.return_value = []

    sheet.header_pruefen(worksheet)

    worksheet.append_row.assert_called_once_with(
        sheet.SHEET_HEADER, value_input_option="USER_ENTERED"
    )


def test_passender_header_bricht_nicht_ab():
    worksheet = Mock()
    worksheet.row_values.return_value = sheet.SHEET_HEADER

    sheet.header_pruefen(worksheet)  # darf keine Exception werfen

    worksheet.append_row.assert_not_called()


def test_meta_verbinden_legt_blatt_und_header_an_wenn_es_fehlt():
    worksheet = Mock()
    worksheet.row_values.return_value = []
    tabelle = Mock()
    tabelle.worksheet.side_effect = sheet.gspread.exceptions.WorksheetNotFound()
    tabelle.add_worksheet.return_value = worksheet
    client = Mock()
    client.open_by_key.return_value = tabelle

    with patch("leadgen.sheet.gspread.service_account", return_value=client):
        ergebnis = sheet.meta_verbinden({"GOOGLE_SERVICE_ACCOUNT_FILE": "x", "SHEET_ID": "y"})

    tabelle.add_worksheet.assert_called_once_with(
        title=sheet.META_TABELLENBLATT_NAME, rows=100, cols=len(sheet.META_HEADER)
    )
    worksheet.append_row.assert_called_once_with(
        sheet.META_HEADER, value_input_option="USER_ENTERED"
    )
    assert ergebnis is worksheet


def test_meta_calls_aktualisieren_legt_neue_zeile_an_wenn_monat_fehlt():
    worksheet = Mock()
    worksheet.col_values.return_value = ["Monat", "2026-06"]

    sheet.meta_calls_aktualisieren(worksheet, "2026-07", 42, "2026-07-30T10:00:00")

    worksheet.append_row.assert_called_once_with(
        ["2026-07", 42, "2026-07-30T10:00:00"], value_input_option="USER_ENTERED"
    )
    worksheet.update.assert_not_called()


def test_meta_calls_aktualisieren_ueberschreibt_bestehende_zeile():
    worksheet = Mock()
    worksheet.col_values.return_value = ["Monat", "2026-06", "2026-07"]

    sheet.meta_calls_aktualisieren(worksheet, "2026-07", 42, "2026-07-30T10:00:00")

    worksheet.update.assert_called_once_with(
        [["2026-07", 42, "2026-07-30T10:00:00"]], "A3:C3",
        value_input_option="USER_ENTERED",
    )
    worksheet.append_row.assert_not_called()
