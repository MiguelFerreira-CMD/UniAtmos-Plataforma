UNIP_CAMPUSES = [
    {
        "id": "sorocaba",
        "name": "UNIP - Sorocaba",
        "shortName": "Sorocaba",
        "city": "Sorocaba",
        "state": "SP",
        "fullLocation": "Sorocaba - SP",
        "lat": -23.5015,
        "lon": -47.4526,
        "neighborhood": "Éden",
        "address": "Av. Independência, 210 - Éden, Sorocaba - SP",
    },
]

UNIQUE_CITIES = sorted({campus["fullLocation"] for campus in UNIP_CAMPUSES})
