
import type { UnipCampus } from "../data/unip-campuses.ts";

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  condition: string;
  conditionIcon: string;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  isDay: boolean;
  forecast: Array<{
    day: string;
    maxTemp: number;
    minTemp: number;
    condition: string;
    rainProbability: number;
  }>;
  fetchedAt: string;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    is_day?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: Array<number | null>;
  };
}

export function mapWmoCode(
  code: number
): { condition: string; icon: string } {
  if (code === 0) {
    return { condition: "Céu limpo", icon: "☀️" };
  }

  if (code === 1) {
    return { condition: "Predominantemente ensolarado", icon: "🌤️" };
  }

  if (code === 2) {
    return { condition: "Parcialmente nublado", icon: "⛅" };
  }

  if (code === 3) {
    return { condition: "Nublado", icon: "☁️" };
  }

  if ([45, 48].includes(code)) {
    return { condition: "Nevoeiro", icon: "🌫️" };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { condition: "Garoa", icon: "🌦️" };
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return { condition: "Chuva", icon: "🌧️" };
  }

  if ([71, 73, 75, 77].includes(code)) {
    return { condition: "Neve", icon: "🌨️" };
  }

  if ([80, 81, 82, 85, 86].includes(code)) {
    return { condition: "Pancadas de precipitação", icon: "🌦️" };
  }

  if ([95, 96, 99].includes(code)) {
    return { condition: "Tempestade com trovoadas", icon: "⛈️" };
  }

  return { condition: "Condição meteorológica não identificada", icon: "🌡️" };
}

function requireNumber(
  value: number | null | undefined,
  field: string
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Dado meteorológico ausente ou inválido: ${field}`);
  }

  return value;
}

/**
 * Consulta dados meteorológicos da Open-Meteo
 * para as coordenadas da unidade da UNIP informada.
 */
export async function fetchCampusWeather(
  campus: UnipCampus
): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${campus.lat}` +
    `&longitude=${campus.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=America%2FSao_Paulo` +
    `&forecast_days=4`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`A Open-Meteo retornou o status ${response.status}.`);
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const current = data.current;
    const daily = data.daily;

    if (!current || !daily) {
      throw new Error("A resposta da Open-Meteo está incompleta.");
    }

    const temperature = requireNumber(
      current.temperature_2m,
      "temperatura atual"
    );

    const apparentTemperature = requireNumber(
      current.apparent_temperature,
      "sensação térmica"
    );

    const humidity = requireNumber(
      current.relative_humidity_2m,
      "umidade relativa"
    );

    const windSpeed = requireNumber(
      current.wind_speed_10m,
      "velocidade do vento"
    );

    const weatherCode = requireNumber(
      current.weather_code,
      "código meteorológico atual"
    );

    const isDayValue = requireNumber(current.is_day, "indicador de dia");

    const times = daily.time;
    const codes = daily.weather_code;
    const maxTemps = daily.temperature_2m_max;
    const minTemps = daily.temperature_2m_min;
    const rainProbabilities = daily.precipitation_probability_max;

    if (
      !times?.length ||
      !codes ||
      !maxTemps ||
      !minTemps ||
      !rainProbabilities ||
      codes.length < times.length ||
      maxTemps.length < times.length ||
      minTemps.length < times.length ||
      rainProbabilities.length < times.length
    ) {
      throw new Error("A previsão diária está incompleta.");
    }

    const dayNames = [
      "Hoje",
      "Amanhã",
      "Depois de amanhã",
      "Em 3 dias",
    ];

    const forecast = times.map((date, index) => {
      const dailyCode = requireNumber(
        codes[index],
        `código meteorológico de ${date}`
      );

      const maxTemp = requireNumber(
        maxTemps[index],
        `temperatura máxima de ${date}`
      );

      const minTemp = requireNumber(
        minTemps[index],
        `temperatura mínima de ${date}`
      );

      const rainProbability = requireNumber(
        rainProbabilities[index],
        `probabilidade de precipitação de ${date}`
      );

      if (rainProbability < 0 || rainProbability > 100) {
        throw new Error(
          `Probabilidade de precipitação inválida para ${date}.`
        );
      }

      return {
        day: dayNames[index] ?? date,
        maxTemp: Math.round(maxTemp),
        minTemp: Math.round(minTemp),
        condition: mapWmoCode(dailyCode).condition,
        rainProbability: Math.round(rainProbability),
      };
    });

    const todayRainProbability = forecast[0]?.rainProbability;

    if (todayRainProbability === undefined) {
      throw new Error("Não foi possível obter a previsão para hoje.");
    }

    const currentCondition = mapWmoCode(weatherCode);

    return {
      temperature: Math.round(temperature),
      apparentTemperature: Math.round(apparentTemperature),
      condition: currentCondition.condition,
      conditionIcon: currentCondition.icon,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed),
      rainProbability: todayRainProbability,
      isDay: isDayValue === 1,
      forecast,
      fetchedAt: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      }),
    };
  } catch (error) {
    console.error(
      `Falha ao consultar a Open-Meteo para ${campus.city}:`,
      error
    );

    throw new Error(
      "Não foi possível obter os dados meteorológicos neste momento."
    );
  }
}