"""Google-Sheets-Anbindung. Ausschließlich append_rows - nie update/sort/delete."""

import gspread

SHEET_HEADER = [
    "Firma", "Branche", "Website", "Telefon", "Ort", "Bewertungen",
    "Erreicht", "Interesse", "Lead-E-Mail", "Termin", "Notiz",
    "Maps-Link", "Gefunden am", "place_id",
]

TABELLENBLATT_NAME = "Leads"


class SheetFehler(Exception):
    """Sheet nicht erreichbar oder Header weicht vom erwarteten Schema ab."""


def verbinden(umgebung):
    """Öffnet das Tabellenblatt 'Leads', legt es an, falls es fehlt."""
    client = gspread.service_account(filename=umgebung["GOOGLE_SERVICE_ACCOUNT_FILE"])
    tabelle = client.open_by_key(umgebung["SHEET_ID"])
    try:
        return tabelle.worksheet(TABELLENBLATT_NAME)
    except gspread.exceptions.WorksheetNotFound:
        return tabelle.add_worksheet(
            title=TABELLENBLATT_NAME, rows=1000, cols=len(SHEET_HEADER)
        )


def header_pruefen(worksheet):
    """Prüft die Header-Zeile gegen SHEET_HEADER. Legt sie an, falls leer.

    Bei Abweichung: SheetFehler mit der Angabe, welche Spalte nicht passt.
    Niemals blind schreiben.
    """
    zeile1 = worksheet.row_values(1)
    if not zeile1:
        worksheet.append_row(SHEET_HEADER, value_input_option="USER_ENTERED")
        return

    for i, erwartet in enumerate(SHEET_HEADER):
        gefunden = zeile1[i] if i < len(zeile1) else ""
        if gefunden != erwartet:
            raise SheetFehler(
                f"Spalte {i + 1}: erwartet '{erwartet}', gefunden '{gefunden}'. "
                "Abbruch - Sheet-Header entspricht nicht dem erwarteten Schema."
            )


def zeile_aus_lead(lead):
    """Mappt ein Lead-dict in die 14 Spalten A-N. G-K bleiben leer (Nutzereingabe)."""
    return [
        lead.get("firma", ""),
        lead.get("branche", ""),
        lead.get("website", "") or "",
        lead.get("telefon", "") or "",
        lead.get("ort", "") or "",
        lead.get("bewertungen", "") if lead.get("bewertungen") is not None else "",
        "",  # G Erreicht
        "",  # H Interesse
        "",  # I Lead-E-Mail
        "",  # J Termin
        "",  # K Notiz
        lead.get("maps_url", "") or "",
        lead.get("gefunden_am", ""),
        lead["place_id"],
    ]


def leads_anhaengen(worksheet, leads):
    """Hängt neue Leads ans Sheet an. Einziger Schreibzugriff im Modul."""
    if not leads:
        return
    worksheet.append_rows(
        [zeile_aus_lead(lead) for lead in leads], value_input_option="USER_ENTERED"
    )


def zeilen_lesen(worksheet):
    """Liest Spalten G-K + place_id für den Rücksync (sync-status)."""
    ergebnis = []
    for zeile in worksheet.get_all_records():
        ergebnis.append({
            "place_id": zeile.get("place_id"),
            "erreicht": zeile.get("Erreicht"),
            "interesse": zeile.get("Interesse"),
            "lead_email": zeile.get("Lead-E-Mail"),
            "termin": zeile.get("Termin"),
            "notiz": zeile.get("Notiz"),
        })
    return ergebnis
