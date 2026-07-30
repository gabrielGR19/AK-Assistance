"""Google-Sheets-Anbindung. Ausschließlich append_rows - nie update/sort/delete."""

import gspread

SHEET_HEADER = [
    "Firma", "Branche", "Website", "Telefon", "Ort", "Bewertungen",
    "Erreicht", "Interesse", "Lead-E-Mail", "Termin", "Notiz",
    "Maps-Link", "Gefunden am", "place_id",
]

TABELLENBLATT_NAME = "Leads"
META_TABELLENBLATT_NAME = "Meta"
META_HEADER = ["Monat", "API-Calls", "Aktualisiert am"]


class SheetFehler(Exception):
    """Sheet nicht erreichbar oder Header weicht vom erwarteten Schema ab."""


def _tabelle_oeffnen(umgebung):
    """Öffnet die Google-Spreadsheet-Datei (Anker für alle Tabellenblätter)."""
    client = gspread.service_account(filename=umgebung["GOOGLE_SERVICE_ACCOUNT_FILE"])
    return client.open_by_key(umgebung["SHEET_ID"])


def verbinden(umgebung):
    """Öffnet das Tabellenblatt 'Leads', legt es an, falls es fehlt."""
    tabelle = _tabelle_oeffnen(umgebung)
    try:
        return tabelle.worksheet(TABELLENBLATT_NAME)
    except gspread.exceptions.WorksheetNotFound:
        return tabelle.add_worksheet(
            title=TABELLENBLATT_NAME, rows=1000, cols=len(SHEET_HEADER)
        )


def meta_verbinden(umgebung):
    """Öffnet das Tabellenblatt 'Meta' (Monatsverbrauch fürs Cockpit), legt es an, falls es fehlt."""
    tabelle = _tabelle_oeffnen(umgebung)
    try:
        worksheet = tabelle.worksheet(META_TABELLENBLATT_NAME)
    except gspread.exceptions.WorksheetNotFound:
        worksheet = tabelle.add_worksheet(
            title=META_TABELLENBLATT_NAME, rows=100, cols=len(META_HEADER)
        )
    if not worksheet.row_values(1):
        worksheet.append_row(META_HEADER, value_input_option="USER_ENTERED")
    return worksheet


def meta_calls_aktualisieren(worksheet, monat, calls, zeitstempel):
    """Schreibt die Monats-Calls-Zahl für 'monat' - Update statt Append. Weicht bewusst vom
    Append-only-Prinzip der Leads ab: hier steht ein kumulativer Zählerstand pro Monat,
    keine unveränderliche Einzelbeobachtung."""
    monatsspalte = worksheet.col_values(1)
    for i, wert in enumerate(monatsspalte):
        if wert == monat:
            zeile = i + 1
            worksheet.update(
                [[monat, calls, zeitstempel]], f"A{zeile}:C{zeile}",
                value_input_option="USER_ENTERED",
            )
            return
    worksheet.append_row([monat, calls, zeitstempel], value_input_option="USER_ENTERED")


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
