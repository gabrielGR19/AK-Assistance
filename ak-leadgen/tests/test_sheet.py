"""Test 4: Sheet-Header-Prüfung - abweichender Header führt zu Abbruch, kein Schreibversuch."""

from unittest.mock import Mock

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
