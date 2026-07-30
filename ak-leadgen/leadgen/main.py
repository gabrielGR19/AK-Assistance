"""CLI und Ablaufsteuerung für ak-leadgen."""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

import yaml
from dotenv import load_dotenv

from leadgen import places, sheet, store

BASIS_VERZEICHNIS = Path(__file__).resolve().parent.parent
DB_PFAD = BASIS_VERZEICHNIS / "data" / "leads.db"
CONFIG_PFAD = BASIS_VERZEICHNIS / "config.yaml"

PFLICHT_UMGEBUNGSVARIABLEN = [
    "GOOGLE_MAPS_API_KEY",
    "GOOGLE_SERVICE_ACCOUNT_FILE",
    "SHEET_ID",
]


class KonfigurationsFehler(Exception):
    """Config fehlt, ist unvollständig oder unplausibel."""


class UmgebungsFehler(Exception):
    """'.env' fehlt oder Pflichtvariablen sind nicht gesetzt."""


def lade_und_pruefe_umgebung(basis_verzeichnis=BASIS_VERZEICHNIS):
    """Lädt .env und prüft alle Pflichtvariablen. Bricht verständlich ab, kein Traceback."""
    env_pfad = Path(basis_verzeichnis) / ".env"
    if not env_pfad.exists():
        raise UmgebungsFehler(
            f"'.env' fehlt unter {env_pfad}. Bitte '.env.example' nach '.env' "
            "kopieren und ausfüllen."
        )
    load_dotenv(env_pfad)

    fehlende = [name for name in PFLICHT_UMGEBUNGSVARIABLEN if not os.environ.get(name)]
    if fehlende:
        raise UmgebungsFehler(
            "Folgende Variablen fehlen oder sind leer in '.env': " + ", ".join(fehlende)
        )

    umgebung = {name: os.environ[name] for name in PFLICHT_UMGEBUNGSVARIABLEN}

    service_account_pfad = Path(umgebung["GOOGLE_SERVICE_ACCOUNT_FILE"])
    if not service_account_pfad.is_absolute():
        service_account_pfad = Path(basis_verzeichnis) / service_account_pfad
    if not service_account_pfad.exists():
        raise UmgebungsFehler(
            f"Service-Account-Datei nicht gefunden unter: {service_account_pfad}"
        )
    umgebung["GOOGLE_SERVICE_ACCOUNT_FILE"] = str(service_account_pfad)

    return umgebung


def lade_config(pfad):
    """Lädt config.yaml und validiert sie."""
    with open(pfad, "r", encoding="utf-8") as datei:
        config = yaml.safe_load(datei)
    validiere_config(config)
    return config


def validiere_config(config):
    """Prüft die Config auf fehlende/unplausible Werte. Bricht beim ersten Problem ab."""
    if not config:
        raise KonfigurationsFehler("config.yaml ist leer oder ungültig.")

    regionen = config.get("regionen") or []
    if not regionen:
        raise KonfigurationsFehler("config.yaml: 'regionen' darf nicht leer sein.")
    for region in regionen:
        for pflichtfeld in ("name", "lat", "lng", "radius_km"):
            if pflichtfeld not in region:
                raise KonfigurationsFehler(
                    f"Region {region.get('name', '?')}: Feld '{pflichtfeld}' fehlt."
                )
        if region["radius_km"] > 50:
            raise KonfigurationsFehler(
                f"Region '{region['name']}': radius_km={region['radius_km']} > 50 (nicht plausibel)."
            )
        if region["radius_km"] <= 0:
            raise KonfigurationsFehler(
                f"Region '{region['name']}': radius_km muss größer als 0 sein."
            )

    suchbloecke = config.get("suchbloecke") or []
    if not suchbloecke:
        raise KonfigurationsFehler("config.yaml: 'suchbloecke' darf nicht leer sein.")
    gesehene_begriffe = set()
    for block in suchbloecke:
        for pflichtfeld in ("begriff", "anzahl"):
            if pflichtfeld not in block:
                raise KonfigurationsFehler(
                    f"Suchblock {block.get('begriff', '?')}: Feld '{pflichtfeld}' fehlt."
                )
        begriff_normiert = block["begriff"].strip().lower()
        if begriff_normiert in gesehene_begriffe:
            raise KonfigurationsFehler(
                f"Suchbegriff '{block['begriff']}' ist doppelt in 'suchbloecke'."
            )
        gesehene_begriffe.add(begriff_normiert)
        if not (1 <= block["anzahl"] <= 60):
            raise KonfigurationsFehler(
                f"Suchblock '{block['begriff']}': anzahl={block['anzahl']} "
                "muss zwischen 1 und 60 liegen."
            )

    filter_cfg = config.get("filter") or {}
    for pflichtfeld in ("min_bewertungen", "min_sterne", "telefon_pflicht", "website_pflicht"):
        if pflichtfeld not in filter_cfg:
            raise KonfigurationsFehler(f"config.yaml: 'filter.{pflichtfeld}' fehlt.")
    if filter_cfg["min_bewertungen"] < 0:
        raise KonfigurationsFehler("config.yaml: 'filter.min_bewertungen' darf nicht negativ sein.")
    if not (0.0 <= filter_cfg["min_sterne"] <= 5.0):
        raise KonfigurationsFehler("config.yaml: 'filter.min_sterne' muss zwischen 0 und 5 liegen.")

    for pflichtfeld in ("max_neue_leads_pro_lauf", "max_api_calls_pro_lauf"):
        if config.get(pflichtfeld, 0) <= 0:
            raise KonfigurationsFehler(f"config.yaml: '{pflichtfeld}' muss größer als 0 sein.")

    for pflichtfeld in ("sprache", "region_code"):
        if not config.get(pflichtfeld):
            raise KonfigurationsFehler(f"config.yaml: '{pflichtfeld}' fehlt.")


def gefilterte_suchbloecke(config, block_name):
    """Gibt alle Suchblöcke zurück, oder nur den mit block_name, falls angegeben."""
    suchbloecke = config["suchbloecke"]
    if block_name is None:
        return suchbloecke
    treffer = [b for b in suchbloecke if b["begriff"] == block_name]
    if not treffer:
        namen = ", ".join(f"'{b['begriff']}'" for b in suchbloecke)
        raise KonfigurationsFehler(
            f"Suchblock '{block_name}' nicht in config.yaml gefunden. Vorhanden: {namen}"
        )
    return treffer


def filtere_lead(lead, filter_cfg):
    """Prüft einen Lead gegen die Filter-Config. Ein Lead muss ALLE Kriterien erfüllen."""
    if filter_cfg["telefon_pflicht"] and not lead.get("telefon"):
        return False
    if filter_cfg["website_pflicht"] and not lead.get("website"):
        return False
    if (lead.get("bewertungen") or 0) < filter_cfg["min_bewertungen"]:
        return False
    if (lead.get("sterne") or 0) < filter_cfg["min_sterne"]:
        return False
    return True


def filtere_leads(leads, filter_cfg):
    """Wendet filtere_lead auf eine Liste von Leads an."""
    return [lead for lead in leads if filtere_lead(lead, filter_cfg)]


def befehl_run(args, config, umgebung):
    """Ablauf 'run': Suche, Filter, Dedupe, Sheet-Export, Zusammenfassung (Schritte 1-8)."""
    conn = store.verbindung_oeffnen(DB_PFAD)
    lauf_id = store.lauf_starten(conn)

    worksheet = sheet.verbinden(umgebung)
    sheet.header_pruefen(worksheet)  # auch im --dry-run: reiner Read, kein Write

    bloecke = gefilterte_suchbloecke(config, args.block)
    max_calls = config["max_api_calls_pro_lauf"]
    max_neue_leads = config["max_neue_leads_pro_lauf"]

    api_calls_gesamt = 0
    gefunden_gesamt = 0
    gefiltert_gesamt = 0
    duplikate_gesamt = 0
    neu_gesamt = 0
    zusammenfassung_zeilen = []
    puffer_fuer_export = []
    abbruchgrund = None

    for region in config["regionen"]:
        if abbruchgrund:
            break
        for block in bloecke:
            if api_calls_gesamt >= max_calls:
                abbruchgrund = "max_api_calls_pro_lauf erreicht"
                break
            if neu_gesamt >= max_neue_leads:
                abbruchgrund = "max_neue_leads_pro_lauf erreicht"
                break

            try:
                treffer, calls = places.suche_alle_seiten(
                    umgebung["GOOGLE_MAPS_API_KEY"], block, region,
                    config["sprache"], config["region_code"],
                    max_calls - api_calls_gesamt,
                )
            except places.PlacesFehler as fehler:
                print(f"Fehler bei '{block['begriff']}' / '{region['name']}': {fehler}")
                zusammenfassung_zeilen.append(
                    f"{block['begriff']} / {region['name']}: FEHLGESCHLAGEN ({fehler})"
                )
                continue

            api_calls_gesamt += calls
            gefiltert_liste = filtere_leads(treffer, config["filter"])

            neu_in_block = 0
            duplikate_in_block = 0
            for lead in gefiltert_liste:
                if neu_gesamt >= max_neue_leads:
                    break
                lead["gefunden_am"] = datetime.now().isoformat(timespec="seconds")
                ergebnis = store.lead_einfuegen(conn, lead)
                if ergebnis == "neu":
                    neu_in_block += 1
                    neu_gesamt += 1
                    puffer_fuer_export.append(lead)
                else:
                    duplikate_in_block += 1

            gefunden_gesamt += len(treffer)
            gefiltert_gesamt += len(treffer) - len(gefiltert_liste)
            duplikate_gesamt += duplikate_in_block

            zusammenfassung_zeilen.append(
                f"{block['begriff']} / {region['name']}: {len(treffer)} gefunden, "
                f"{len(treffer) - len(gefiltert_liste)} gefiltert, "
                f"{duplikate_in_block} Duplikate, {neu_in_block} neu"
            )

    if not args.dry_run and puffer_fuer_export:
        sheet.leads_anhaengen(worksheet, puffer_fuer_export)
        store.als_exportiert_markieren(conn, [l["place_id"] for l in puffer_fuer_export])

    store.lauf_beenden(
        conn, lauf_id, api_calls_gesamt, gefunden_gesamt,
        gefiltert_gesamt, duplikate_gesamt, neu_gesamt,
    )

    if not args.dry_run:
        # Bestes-Bemühen: Leads sind zu diesem Zeitpunkt schon erfolgreich exportiert,
        # ein Netzwerk-/Sheet-Fehler hier darf den sonst erfolgreichen Lauf nicht als
        # Fehler beenden. Zeigt Gabriel im Cockpit den Monatsverbrauch gg. das
        # 1.000-Calls-Freikontingent der Places API.
        try:
            monat = datetime.now().strftime("%Y-%m")
            calls_monat = store.calls_dieser_monat(conn, monat)
            meta_worksheet = sheet.meta_verbinden(umgebung)
            sheet.meta_calls_aktualisieren(
                meta_worksheet, monat, calls_monat,
                datetime.now().isoformat(timespec="seconds"),
            )
        except Exception as fehler:
            print(f"Warnung: Monatsverbrauch konnte nicht ins Meta-Tab geschrieben werden: {fehler}")

    if args.dry_run:
        conn.rollback()
    else:
        conn.commit()
    conn.close()

    print()
    print("Zusammenfassung:")
    for zeile in zusammenfassung_zeilen:
        print(f"  {zeile}")
    if abbruchgrund:
        print(f"Lauf vorzeitig beendet: {abbruchgrund}")
    print(
        f"Gesamt: {gefunden_gesamt} gefunden, {gefiltert_gesamt} gefiltert, "
        f"{duplikate_gesamt} Duplikate, {neu_gesamt} neu, {api_calls_gesamt} API-Calls"
        + (" (--dry-run: nichts wurde geschrieben)" if args.dry_run else "")
    )


def befehl_sync_status(umgebung):
    """Ablauf 'sync-status': Spalten G-K per place_id aus dem Sheet zurück in die DB."""
    conn = store.verbindung_oeffnen(DB_PFAD)
    worksheet = sheet.verbinden(umgebung)
    sheet.header_pruefen(worksheet)
    zeilen = sheet.zeilen_lesen(worksheet)
    aktualisiert, uebersprungen = store.status_zuruecksynchronisieren(conn, zeilen)
    conn.commit()
    conn.close()
    print(f"Rücksync abgeschlossen: {aktualisiert} aktualisiert, {uebersprungen} übersprungen.")


def befehl_stats():
    """Ablauf 'stats': Bestand je Branche und Region."""
    conn = store.verbindung_oeffnen(DB_PFAD)
    zeilen = store.statistik(conn)
    conn.close()
    if not zeilen:
        print("Keine Leads in der Datenbank.")
        return
    for branche, region, anzahl in zeilen:
        print(f"{branche} / {region}: {anzahl}")


def parse_args(argv=None):
    parser = argparse.ArgumentParser(prog="python -m leadgen.main")
    subparser = parser.add_subparsers(dest="befehl", required=True)

    run_parser = subparser.add_parser("run", help="Leads suchen, filtern, exportieren")
    run_parser.add_argument("--dry-run", action="store_true", dest="dry_run",
                             help="API-Abfragen, aber kein Schreiben in DB/Sheet")
    run_parser.add_argument("--block", default=None,
                             help="Nur diesen Suchbegriff aus config.yaml abarbeiten")

    subparser.add_parser("sync-status", help="Spalten G-K per place_id zurück in die DB")
    subparser.add_parser("stats", help="Bestand je Branche und Region")

    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    try:
        config = lade_config(CONFIG_PFAD)
        if args.befehl == "stats":
            befehl_stats()
            return
        umgebung = lade_und_pruefe_umgebung()
        if args.befehl == "run":
            befehl_run(args, config, umgebung)
        elif args.befehl == "sync-status":
            befehl_sync_status(umgebung)
    except (KonfigurationsFehler, UmgebungsFehler, places.PlacesFehler, sheet.SheetFehler) as fehler:
        print(f"Fehler: {fehler}")
        sys.exit(1)


if __name__ == "__main__":
    main()
