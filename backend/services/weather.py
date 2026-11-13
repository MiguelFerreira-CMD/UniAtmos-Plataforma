from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Any

import httpx

TIMEZONE = ZoneInfo("America/Sao_Paulo")

# Cache em memória para consultas históricas (archive-api.open-meteo.com)
archive_cache: dict[str, dict[str, Any]] = {}
archive_cache_time: dict[str, float] = {}
ARCHIVE_CACHE_TTL = 3600  # 1 hora


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


def require_number(value: Any, field: str, default: float | None = None) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        if default is not None:
            return float(default)
        raise ValueError(f"Dado meteorológico ausente ou inválido: {field}")
    return float(value)


def format_pt_weekday_date(date_str: str) -> str:
    """Retorna o dia da semana em português abreviado com a data (ex: 'Sex (14/11)')."""
    weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        wd = weekdays[dt.weekday()]
        return f"{wd} ({dt.strftime('%d/%m')})"
    except Exception:
        return date_str


def compute_clothing_recommendations(
    temperature: float,
    apparent_temperature: float,
    rain_probability: float,
    wind_speed: float,
    condition: str,
) -> dict[str, Any]:
    """
    Gera dicas dinâmicas e contextualizadas de vestimenta e preparação
    baseadas estritamente nas condições climáticas do momento em Sorocaba.
    """
    # 1. Avaliação térmica (considera temperatura e sensação térmica)
    effective_temp = min(temperature, apparent_temperature) if apparent_temperature < temperature else temperature

    if effective_temp <= 17.0:
        thermal_category = "Frio"
        clothing_tip = (
            "Tempo frio em Sorocaba! Recomenda-se usar casaco mais pesado, blusa de frio, "
            "calça e roupas quentes para se proteger das baixas temperaturas."
        )
    elif effective_temp >= 25.0:
        thermal_category = "Calor"
        clothing_tip = (
            "Calor em Sorocaba! O ideal são roupas leves, frescas e confortáveis "
            "(como camiseta, bermuda ou saia). Mantenha-se bem hidratado."
        )
    else:
        thermal_category = "Ameno/Morno"
        clothing_tip = (
            "Clima ameno e agradável em Sorocaba. Roupas intermediárias e confortáveis "
            "(calça leve e camiseta) são ideais. Se for voltar tarde, vale levar uma jaqueta leve ou suéter caso esfrie."
        )

    # 2. Avaliação de chuva
    cond_lower = condition.lower()
    has_rain_keywords = any(k in cond_lower for k in ["chuva", "garoa", "tempestade", "pancada", "precipitação"])
    if rain_probability >= 40 or has_rain_keywords:
        rain_tip = "Atenção: probabilidade de chuva considerável. Leve guarda-chuva ou capa de chuva e redobre o cuidado ao sair."
    else:
        rain_tip = "Baixa chance de chuva no momento; guarda-chuva dispensável para a maioria das atividades."

    # 3. Avaliação de vento
    if wind_speed >= 20.0:
        wind_tip = f"Vento intenso registrado ({round(wind_speed)} km/h). Um casaco corta-vento pode ser útil, e tenha atenção com objetos soltos na rua."
    else:
        wind_tip = "Ventos calmos e amenos."

    summary = f"{clothing_tip} {rain_tip} {wind_tip}"

    return {
        "thermalCategory": thermal_category,
        "clothingTip": clothing_tip,
        "rainTip": rain_tip,
        "windTip": wind_tip,
        "summary": summary,
    }


def compute_weather_analytics(
    past_days: list[dict[str, Any]],
    forecast_days: list[dict[str, Any]],
    today_str: str,
) -> dict[str, Any]:
    """
    Calcula métricas analíticas e comparativas precisas entre diferentes períodos:
    - Semana passada vs esta semana
    - Recorde do mês atual (dia mais quente e dia mais frio)
    - Tendência de temperatura para os próximos dias
    """
    current_month_prefix = today_str[:7]  # ex: '2026-11'

    # 1. Comparação Semana Passada (últimos 7 dias anteriores a hoje) vs Esta Semana (hoje + próximos 6 dias)
    last_week_days = past_days[-7:] if len(past_days) >= 7 else past_days
    this_week_days = forecast_days[:7]

    last_week_max_temps = [d["maxTemp"] for d in last_week_days if d.get("maxTemp") is not None]
    last_week_min_temps = [d["minTemp"] for d in last_week_days if d.get("minTemp") is not None]
    last_week_means = [d.get("meanTemp", (d["maxTemp"] + d["minTemp"]) / 2) for d in last_week_days if d.get("maxTemp") is not None]

    this_week_max_temps = [d["maxTemp"] for d in this_week_days if d.get("maxTemp") is not None]
    this_week_min_temps = [d["minTemp"] for d in this_week_days if d.get("minTemp") is not None]
    this_week_means = [d.get("meanTemp", (d["maxTemp"] + d["minTemp"]) / 2) for d in this_week_days if d.get("maxTemp") is not None]

    last_week_avg_max = round(sum(last_week_max_temps) / len(last_week_max_temps), 1) if last_week_max_temps else None
    last_week_avg_min = round(sum(last_week_min_temps) / len(last_week_min_temps), 1) if last_week_min_temps else None
    last_week_avg_mean = round(sum(last_week_means) / len(last_week_means), 1) if last_week_means else None

    this_week_avg_max = round(sum(this_week_max_temps) / len(this_week_max_temps), 1) if this_week_max_temps else None
    this_week_avg_min = round(sum(this_week_min_temps) / len(this_week_min_temps), 1) if this_week_min_temps else None
    this_week_avg_mean = round(sum(this_week_means) / len(this_week_means), 1) if this_week_means else None

    week_comparison_text = "Sem dados suficientes para comparação semanal completa."
    if this_week_avg_max is not None and last_week_avg_max is not None:
        diff_max = round(this_week_avg_max - last_week_avg_max, 1)
        if diff_max >= 1.5:
            week_comparison_text = (
                f"Esta semana vai ser mais quente que a semana passada: a média prevista de máxima para esta semana "
                f"é de {this_week_avg_max}°C, contra {last_week_avg_max}°C observados na semana passada (alta de {abs(diff_max)}°C)."
            )
        elif diff_max <= -1.5:
            week_comparison_text = (
                f"Esta semana vai ser mais fria que a semana passada: a média de máxima para esta semana "
                f"é de {this_week_avg_max}°C, enquanto a semana passada teve média de máxima de {last_week_avg_max}°C (queda de {abs(diff_max)}°C)."
            )
        else:
            week_comparison_text = (
                f"As temperaturas desta semana serão semelhantes às da semana passada: máxima média prevista de {this_week_avg_max}°C, "
                f"em comparação aos {last_week_avg_max}°C da semana passada."
            )

    # 2. Recorde do mês atual (dia mais quente e mais frio deste mês até o momento)
    current_month_days = [d for d in past_days + forecast_days if str(d.get("date", "")).startswith(current_month_prefix)]
    hottest_day_this_month = None
    coldest_day_this_month = None

    if current_month_days:
        hottest = max(current_month_days, key=lambda d: d.get("maxTemp", -999))
        coldest = min(current_month_days, key=lambda d: d.get("minTemp", 999))

        hottest_day_this_month = {
            "date": hottest.get("date"),
            "day": hottest.get("day"),
            "maxTemp": hottest.get("maxTemp"),
        }
        coldest_day_this_month = {
            "date": coldest.get("date"),
            "day": coldest.get("day"),
            "minTemp": coldest.get("minTemp"),
        }

    # 3. Tendência de temperatura nos próximos dias (forecast)
    trend_text = "A temperatura deve permanecer relativamente estável nos próximos dias."
    if len(forecast_days) >= 4:
        early_max = sum(d["maxTemp"] for d in forecast_days[:2]) / 2
        late_max = sum(d["maxTemp"] for d in forecast_days[2:5]) / len(forecast_days[2:5])
        diff_trend = round(late_max - early_max, 1)

        if diff_trend >= 2.0:
            trend_text = (
                f"A temperatura vai aumentar nos próximos dias. As máximas sobem de cerca de {round(early_max)}°C "
                f"no início para aproximadamente {round(late_max)}°C ao longo da semana."
            )
        elif diff_trend <= -2.0:
            trend_text = (
                f"A temperatura vai diminuir nos próximos dias. As máximas caem de cerca de {round(early_max)}°C "
                f"para em torno de {round(late_max)}°C ao longo dos próximos dias."
            )

    return {
        "lastWeek": {
            "avgMax": last_week_avg_max,
            "avgMin": last_week_avg_min,
            "avgMean": last_week_avg_mean,
            "daysCount": len(last_week_days),
        },
        "thisWeek": {
            "avgMax": this_week_avg_max,
            "avgMin": this_week_avg_min,
            "avgMean": this_week_avg_mean,
            "daysCount": len(this_week_days),
        },
        "weekComparisonSummary": week_comparison_text,
        "hottestDayThisMonth": hottest_day_this_month,
        "coldestDayThisMonth": coldest_day_this_month,
        "temperatureTrendNextDays": trend_text,
    }


async def fetch_archive_weather(campus: dict, start_date: str, end_date: str) -> dict[str, Any] | None:
    """
    Consulta a API histórica Open-Meteo Archive (https://archive-api.open-meteo.com/v1/archive)
    para fornecer dados reais do passado (ex: mesmo período no ano passado).
    """
    import time

    cache_key = f"{campus.get('id', 'sorocaba')}_{start_date}_{end_date}"
    now = time.time()

    if cache_key in archive_cache and now - archive_cache_time.get(cache_key, 0) < ARCHIVE_CACHE_TTL:
        return archive_cache[cache_key].copy()

    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": campus["lat"],
        "longitude": campus["lon"],
        "start_date": start_date,
        "end_date": end_date,
        "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weather_code",
        "timezone": "America/Sao_Paulo",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=params)
            if response.is_error:
                return None
            data = response.json()

        daily = data.get("daily")
        if not daily or not daily.get("time"):
            return None

        times = daily.get("time", [])
        max_temps = daily.get("temperature_2m_max", [])
        min_temps = daily.get("temperature_2m_min", [])
        mean_temps = daily.get("temperature_2m_mean", [])
        precip_sums = daily.get("precipitation_sum", [])
        codes = daily.get("weather_code", [])

        records = []
        for i, date_str in enumerate(times):
            mx = max_temps[i] if i < len(max_temps) else None
            mn = min_temps[i] if i < len(min_temps) else None
            me = mean_temps[i] if i < len(mean_temps) else None
            pr = precip_sums[i] if i < len(precip_sums) else 0.0
            cd = codes[i] if i < len(codes) else 0
            records.append({
                "date": date_str,
                "maxTemp": round(mx, 1) if mx is not None else None,
                "minTemp": round(mn, 1) if mn is not None else None,
                "meanTemp": round(me, 1) if me is not None else None,
                "rainSum": round(pr, 1) if pr is not None else 0.0,
                "condition": map_wmo_code(int(cd))["condition"] if cd is not None else "",
            })

        valid_max = [r["maxTemp"] for r in records if r["maxTemp"] is not None]
        valid_min = [r["minTemp"] for r in records if r["minTemp"] is not None]
        valid_mean = [r["meanTemp"] for r in records if r["meanTemp"] is not None]
        total_rain = sum(r["rainSum"] for r in records if r["rainSum"] is not None)

        avg_max = round(sum(valid_max) / len(valid_max), 1) if valid_max else None
        avg_min = round(sum(valid_min) / len(valid_min), 1) if valid_min else None
        avg_mean = round(sum(valid_mean) / len(valid_mean), 1) if valid_mean else None

        result = {
            "startDate": start_date,
            "endDate": end_date,
            "daysCount": len(records),
            "avgMax": avg_max,
            "avgMin": avg_min,
            "avgMean": avg_mean,
            "totalRain": round(total_rain, 1),
            "records": records,
        }

        archive_cache[cache_key] = result
        archive_cache_time[cache_key] = now
        return result.copy()

    except Exception as exc:
        print(f"Aviso ao consultar Open-Meteo Archive ({start_date} a {end_date}): {exc}")
        return None


async def fetch_campus_weather(campus: dict) -> dict:
    url = "https://api.open-meteo.com/v1/forecast"

    # past_days=31 nos permite analisar todo o mês anterior e histórico recente (última semana)
    params = {
        "latitude": campus["lat"],
        "longitude": campus["lon"],
        "current": (
            "temperature_2m,relative_humidity_2m,apparent_temperature,"
            "weather_code,wind_speed_10m,is_day"
        ),
        "daily": (
            "weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,"
            "precipitation_probability_max,precipitation_sum,wind_speed_10m_max"
        ),
        "timezone": "America/Sao_Paulo",
        "past_days": 31,
        "forecast_days": 8,
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

        temperature = require_number(
            current.get("temperature_2m"),
            "temperatura atual",
        )
        apparent_temperature = require_number(
            current.get("apparent_temperature"),
            "sensação térmica",
        )
        humidity = require_number(
            current.get("relative_humidity_2m"),
            "umidade relativa",
        )
        wind_speed = require_number(
            current.get("wind_speed_10m"),
            "velocidade do vento",
        )
        weather_code = require_number(
            current.get("weather_code"),
            "código meteorológico atual",
        )
        is_day_value = require_number(
            current.get("is_day"),
            "indicador de dia",
        )

        times = daily.get("time")
        codes = daily.get("weather_code")
        max_temps = daily.get("temperature_2m_max")
        min_temps = daily.get("temperature_2m_min")
        mean_temps = daily.get("temperature_2m_mean") or []
        rain_probabilities = daily.get("precipitation_probability_max")
        precipitation_sums = daily.get("precipitation_sum") or []
        wind_speeds_max = daily.get("wind_speed_10m_max") or []

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

        now = datetime.now(TIMEZONE)
        today_str = now.strftime("%Y-%m-%d")

        # Localiza o índice correspondente ao dia de hoje na lista total de datas retornadas
        today_idx = times.index(today_str) if today_str in times else max(0, len(times) - 8)

        # Monta o histórico dos últimos 31 dias passados
        past_days_records = []
        for idx in range(today_idx):
            dt_str = times[idx]
            cd = require_number(codes[idx], f"código de {dt_str}", 0)
            mx = require_number(max_temps[idx], f"máxima de {dt_str}", 20)
            mn = require_number(min_temps[idx], f"mínima de {dt_str}", 15)
            me = float(mean_temps[idx]) if idx < len(mean_temps) and mean_temps[idx] is not None else (mx + mn) / 2
            pr = float(precipitation_sums[idx]) if idx < len(precipitation_sums) and precipitation_sums[idx] is not None else 0.0

            past_days_records.append({
                "date": dt_str,
                "day": format_pt_weekday_date(dt_str),
                "maxTemp": round(mx),
                "minTemp": round(mn),
                "meanTemp": round(me, 1),
                "rainSum": round(pr, 1),
                "condition": map_wmo_code(int(cd))["condition"],
            })

        # Monta a previsão diária estritamente a partir de HOJE (índice 0 = Hoje)
        forecast = []
        forecast_idx = 0
        for idx in range(today_idx, len(times)):
            dt_str = times[idx]
            daily_code = require_number(codes[idx], f"código de {dt_str}", 0)
            max_temp = require_number(max_temps[idx], f"máxima de {dt_str}", 20)
            min_temp = require_number(min_temps[idx], f"mínima de {dt_str}", 15)
            rain_prob = require_number(rain_probabilities[idx], f"chuva de {dt_str}", 0)
            mean_temp = float(mean_temps[idx]) if idx < len(mean_temps) and mean_temps[idx] is not None else (max_temp + min_temp) / 2
            precip_sum = float(precipitation_sums[idx]) if idx < len(precipitation_sums) and precipitation_sums[idx] is not None else 0.0
            wind_max = float(wind_speeds_max[idx]) if idx < len(wind_speeds_max) and wind_speeds_max[idx] is not None else wind_speed

            day_label = "Hoje" if forecast_idx == 0 else format_pt_weekday_date(dt_str)

            forecast.append({
                "date": dt_str,
                "day": day_label,
                "maxTemp": round(max_temp),
                "minTemp": round(min_temp),
                "meanTemp": round(mean_temp, 1),
                "condition": map_wmo_code(int(daily_code))["condition"],
                "rainProbability": round(max(0, min(100, rain_prob))),
                "precipitationSum": round(precip_sum, 1),
                "windSpeedMax": round(wind_max),
            })
            forecast_idx += 1

        if not forecast:
            raise ValueError("Não foi possível obter a previsão para hoje.")

        current_condition = map_wmo_code(int(weather_code))

        # Calcula as análises comparativas e temporais
        analytics = compute_weather_analytics(
            past_days=past_days_records,
            forecast_days=forecast,
            today_str=today_str,
        )

        # Recomendações de vestimenta e dicas dinâmicas baseadas nas condições atuais
        clothing_recommendation = compute_clothing_recommendations(
            temperature=temperature,
            apparent_temperature=apparent_temperature,
            rain_probability=forecast[0]["rainProbability"],
            wind_speed=wind_speed,
            condition=current_condition["condition"],
        )

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
            "history_30d": past_days_records,
            "analytics": analytics,
            "clothingRecommendation": clothing_recommendation,
            "fetchedAt": now.strftime("%H:%M"),
            "fetchedDate": today_str,
        }

    except Exception as error:
        print(
            f"Falha ao consultar a Open-Meteo para "
            f"{campus.get('city', 'campus')}: {error}"
        )

        raise RuntimeError(
            "Não foi possível obter os dados meteorológicos neste momento."
        ) from error
