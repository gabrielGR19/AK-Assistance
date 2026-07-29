"""Anbindung an die Google Places API (New) - Text Search."""

import time

import requests

ENDPOINT = "https://places.googleapis.com/v1/places:searchText"

# locationRestriction unterstützt laut Places-API-Doku nur ein Rechteck (rectangle),
# kein Umkreis. Ein Umkreis (center+radius) geht ausschließlich über locationBias -
# das ist eine weiche Eingrenzung, Google kann auch Treffer außerhalb liefern.
FIELD_MASK = (
    "places.id,places.displayName,places.rating,places.userRatingCount,"
    "places.nationalPhoneNumber,places.websiteUri,places.addressComponents,"
    "places.googleMapsUri,nextPageToken"
)

TIMEOUT_SEKUNDEN = 20
MAX_VERSUCHE = 3
SEITENGROESSE_MAX = 20
WARTEZEIT_VOR_FOLGESEITE_SEKUNDEN = 2


class PlacesFehler(Exception):
    """Ein Suchblock ist gescheitert. Signal an main.py: überspringen, nicht abbrechen."""


def _anfrage(api_key, body, timeout=TIMEOUT_SEKUNDEN):
    """Führt eine Text-Search-Anfrage aus. Retry mit Backoff nur bei 429/5xx."""
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
        "Content-Type": "application/json",
    }
    letzter_fehler = None
    for versuch in range(1, MAX_VERSUCHE + 1):
        try:
            antwort = requests.post(ENDPOINT, json=body, headers=headers, timeout=timeout)
        except requests.RequestException as exc:
            letzter_fehler = exc
        else:
            if antwort.status_code == 200:
                return antwort.json()
            if antwort.status_code == 429 or antwort.status_code >= 500:
                letzter_fehler = PlacesFehler(
                    f"HTTP {antwort.status_code} von Places API: {antwort.text[:200]}"
                )
            else:
                # andere 4xx-Fehler (z.B. 400, 403) - Retry hilft nicht, sofort abbrechen
                raise PlacesFehler(
                    f"HTTP {antwort.status_code} von Places API: {antwort.text[:200]}"
                )
        if versuch < MAX_VERSUCHE:
            time.sleep(2 ** versuch)
    raise PlacesFehler(f"Places API nach {MAX_VERSUCHE} Versuchen fehlgeschlagen: {letzter_fehler}")


def _ort_aus_components(components):
    """Sucht in addressComponents das Element vom Typ 'locality' (die Stadt)."""
    for komponente in components or []:
        if "locality" in komponente.get("types", []):
            return komponente.get("longText")
    return None


def extrahiere_lead(place):
    """Wandelt ein Place-Objekt der API-Antwort in ein Lead-dict um. Defensiv (.get)."""
    return {
        "place_id": place["id"],
        "firma": place.get("displayName", {}).get("text", ""),
        "website": place.get("websiteUri"),
        "telefon": place.get("nationalPhoneNumber"),
        "ort": _ort_aus_components(place.get("addressComponents")),
        "sterne": place.get("rating"),
        "bewertungen": place.get("userRatingCount"),
        "maps_url": place.get("googleMapsUri"),
    }


def suche_alle_seiten(api_key, suchblock, region, sprache, region_code, verbleibende_calls):
    """Sucht einen Suchblock in einer Region, folgt der Paginierung.

    Kapselt Pagination, Retry und Call-Budget in einer Funktion. Gibt
    (treffer, verbrauchte_calls) zurück - main.py summiert die Calls selbst auf.
    """
    treffer = []
    verbrauchte_calls = 0
    page_token = None
    anzahl = suchblock["anzahl"]

    while True:
        if verbrauchte_calls >= verbleibende_calls:
            break

        body = {
            "textQuery": suchblock["begriff"],
            "languageCode": sprache,
            "regionCode": region_code,
            "pageSize": min(anzahl, SEITENGROESSE_MAX),
            "locationBias": {
                "circle": {
                    "center": {"latitude": region["lat"], "longitude": region["lng"]},
                    "radius": region["radius_km"] * 1000,
                }
            },
        }
        if page_token:
            body["pageToken"] = page_token

        antwort = _anfrage(api_key, body)
        verbrauchte_calls += 1

        for place in antwort.get("places", []):
            lead = extrahiere_lead(place)
            lead["branche"] = suchblock["begriff"]
            lead["region"] = region["name"]
            treffer.append(lead)

        page_token = antwort.get("nextPageToken")
        if not page_token or len(treffer) >= anzahl:
            break
        time.sleep(WARTEZEIT_VOR_FOLGESEITE_SEKUNDEN)

    return treffer[:anzahl], verbrauchte_calls
