from datetime import datetime
from zoneinfo import ZoneInfo

import httpx


def map_wmo_code(code: int) -> dict[str, str]:
    if code == 0:
        return {"condition": "Céu limpo", "icon": "☀️"}
    if code == 1:
        return {"condition": "Predominantemente ensolarado", "icon": "🌤️"}
    if code == 2:
        return {"condition": "Parcialmente nublado", "icon": "⛅"}
    if code == 3:
        return {"condition": "Nublado", "icon": "☁️"}
    if code in [45, 48]:
        return {"condition": "Nevoeiro", "icon": "🌫️"}
    if code in [51, 53, 55, 56, 57]:
        return {"condition": "Garoa", "icon": "🌦️"}
    if code in [61, 63, 65, 66, 67]:
        return {"condition": "Chuva", "icon": "🌧️"}
    if code in [71, 73, 75, 77]:
        return {"condition": "Neve", "icon": "🌨️"}
    if code in [80, 81, 82, 85, 86]:
        return {"condition": "Pancadas de precipitação", "icon": "🌦️"}
    if code in [95, 96, 99]:
        return {"condition": "Tempestade com trovoadas", "icon": "⛈️"}
    return {
        "condition": "Condição meteorológica não identificada",
        "icon": "🌡️",
    }


def require_number(value, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"Dado meteorológico ausente ou inválido: {field}")
    return float(value)


async def fetch_campus_weather(campus: dict) -> dict:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": campus["lat"],
        "longitude": campus["lon"],
        "current": (
            "temperature_2m,relative_humidity_2m,apparent_temperature,"
            "weather_code,wind_speed_10m,is_day"
        ),
        "daily": (
            "weather_code,temperature_2m_max,temperature_2m_min,"
            "precipitation_probability_max"
        ),
        "timezone": "America/Sao_Paulo",
        "forecast_days": 4,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            if response.is_error:
                raise RuntimeError(
                    f"A Open-Meteo retornou o status {response.status_code}."
                )
            data = response.json()

        current = data.get("current")
        daily = data.get("daily")
        if not current or not daily:
            raise ValueError("A resposta da Open-Meteo está incompleta.")

        temperature = require_number(current.get("temperature_2m"), "temperatura atual")
        apparent_temperature = require_number(
            current.get("apparent_temperature"), "sensação térmica"
        )
        humidity = require_number(
            current.get("relative_humidity_2m"), "umidade relativa"
        )
        wind_speed = require_number(
            current.get("wind_speed_10m"), "velocidade do vento"
        )
        weather_code = require_number(
            current.get("weather_code"), "código meteorológico atual"
        )
        is_day_value = require_number(current.get("is_day"), "indicador de dia")

        times = daily.get("time")
        codes = daily.get("weather_code")
        max_temps = daily.get("temperature_2m_max")
        min_temps = daily.get("temperature_2m_min")
        rain_probabilities = daily.get("precipitation_probability_max")

        if (
            not times
            or codes is None
            or max_temps is None
            or min_temps is None
            or rain_probabilities is None
            or len(codes) < len(times)
            or len(max_temps) < len(times)
            or len(min_temps) < len(times)
            or len(rain_probabilities) < len(times)
        ):
            raise ValueError("A previsão diária está incompleta.")

        day_names = ["Hoje", "Amanhã", "Depois de amanhã", "Em 3 dias"]
        forecast = []

        for index, date in enumerate(times):
            daily_code = require_number(codes[index], f"código meteorológico de {date}")
            max_temp = require_number(max_temps[index], f"temperatura máxima de {date}")
            min_temp = require_number(min_temps[index], f"temperatura mínima de {date}")
            rain_probability = require_number(
                rain_probabilities[index], f"probabilidade de precipitação de {date}"
            )

            if rain_probability < 0 or rain_probability > 100:
                raise ValueError(f"Probabilidade de precipitação inválida para {date}.")

            forecast.append({
                "day": day_names[index] if index < len(day_names) else date,
                "maxTemp": round(max_temp),
                "minTemp": round(min_temp),
                "condition": map_wmo_code(int(daily_code))["condition"],
                "rainProbability": round(rain_probability),
            })

        if not forecast:
            raise ValueError("Não foi possível obter a previsão para hoje.")

        current_condition = map_wmo_code(int(weather_code))
        fetched_at = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%H:%M")

        return {
            "temperature": round(temperature),
            "apparentTemperature": round(apparent_temperature),
            "condition": current_condition["condition"],
            "conditionIcon": current_condition["icon"],
            "humidity": round(humidity),
            "windSpeed": round(wind_speed),
            "rainProbability": forecast[0]["rainProbability"],
            "isDay": is_day_value == 1,
            "forecast": forecast,
            "fetchedAt": fetched_at,
        }
    except Exception as error:
        print(f"Falha ao consultar a Open-Meteo para {campus.get('city', 'campus')}: {error}")
        raise RuntimeError(
            "Não foi possível obter os dados meteorológicos neste momento."
        ) from error
