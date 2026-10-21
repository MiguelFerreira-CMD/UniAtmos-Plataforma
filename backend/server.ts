
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { UNIP_CAMPUSES } from "./data/unip-campuses.ts";
import { fetchCampusWeather } from "./services/weather.ts";

// Carrega as variáveis de ambiente de backend/.env.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const app = express();
const PORT = 3001;

app.use(express.json({ limit: "30kb" }));

// Permite que o frontend local acesse o backend.
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://localhost:3000"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

// Configuração do Gemini.
const apiKey = process.env.GEMINI_API_KEY?.trim() || "";

if (!apiKey) {
  console.warn(
    "Aviso: GEMINI_API_KEY não configurada em backend/.env."
  );
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "UNCONFIGURED",
});

// Instruções principais do Atmos.
const systemInstruction = `
Você é Atmos, o assistente meteorológico educacional do projeto UniAtmos,
exclusivamente dedicado à UNIP de Sorocaba, São Paulo, Brasil.

Responda sempre em português brasileiro, de forma clara, amigável e educativa.

FORMATAÇÃO DAS RESPOSTAS:
- Nunca use dois asteriscos (**) para destacar palavras ou frases.
- Não use negrito com Markdown.
- Prefira frases naturais, parágrafos curtos e informações bem organizadas.
- Você pode utilizar porcentagens normalmente, como 75% ou 30%.
- Preserve os números, as unidades de medida e os símbolos meteorológicos.
- Evite formatação excessiva e símbolos decorativos desnecessários.

ESCOPO:
- Atenda perguntas meteorológicas sobre Sorocaba - SP.
- Considere como localização padrão a região da UNIP Sorocaba.
- Não apresente previsões meteorológicas de outras cidades ou unidades da UNIP.
- Se o usuário pedir a previsão de outra cidade, explique educadamente
  que o Atmos atende somente Sorocaba.
- Explique conceitos gerais de meteorologia, como temperatura,
  sensação térmica, umidade, pressão atmosférica, ventos, nuvens e chuva.

DADOS METEOROLÓGICOS:
- Nunca invente temperaturas, medições, previsões ou alertas.
- Só informe condições atuais ou previsões específicas quando receber
  dados meteorológicos consultados.
- Utilize os dados recebidos para responder às perguntas.
- Diferencie condições atuais de previsões futuras.
- Não confunda probabilidade de precipitação com certeza de chuva.
- Não invente horários, alertas ou informações ausentes nos dados.
- Se não houver dados atualizados, informe que não foi possível
  confirmar as condições meteorológicas naquele momento.
- Nunca afirme que consultou uma fonte se isso não aconteceu.

Se a pergunta não for sobre meteorologia, responda brevemente e,
quando apropriado, direcione a conversa para a meteorologia de Sorocaba.
`;

// Normaliza o texto para facilitar a identificação de palavras.
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Detecta perguntas que precisam de dados meteorológicos atualizados.
function asksForCurrentWeather(message: string): boolean {
  const text = normalizeText(message);

  const weatherPhrases = [
    "previsao",
    "vai chover",
    "chovendo",
    "esta chovendo",
    "como esta o clima",
    "clima hoje",
    "tempo hoje",
    "tempo agora",
    "temperatura atual",
    "temperatura agora",
    "temperatura em",
    "temperatura de",
    "temperatura de hoje",
    "qual a temperatura",
    "qual e a temperatura",
    "chance de chuva",
    "probabilidade de chuva",
    "chuva hoje",
    "chuva amanha",
    "chuva em",
    "chuva de",
    "vai fazer frio",
    "vai fazer calor",
    "esta nublado",
    "umidade atual",
    "umidade agora",
    "umidade em",
    "umidade de",
    "vento atual",
    "vento agora",
    "vento em",
    "vento de",
  ];

  return weatherPhrases.some((phrase) => text.includes(phrase));
}

// Localiza a única unidade permitida: UNIP Sorocaba.
function findCampus() {
  return (
    UNIP_CAMPUSES.find((campus) => campus.id === "sorocaba") ?? null
  );
}

// Valida o histórico recebido do frontend.
function isValidHistory(
  history: unknown
): history is Array<{
  role: "user" | "model";
  text: string;
}> {
  if (!Array.isArray(history) || history.length > 20) {
    return false;
  }

  return history.every((item: unknown) => {
    if (typeof item !== "object" || item === null) {
      return false;
    }

    const entry = item as {
      role?: unknown;
      text?: unknown;
    };

    return (
      (entry.role === "user" || entry.role === "model") &&
      typeof entry.text === "string" &&
      entry.text.length <= 4000
    );
  });
}

// Endpoint principal do chatbot.
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body ?? {};

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 4000
    ) {
      res.status(400).json({
        error: "Envie uma mensagem válida de até 4.000 caracteres.",
      });
      return;
    }

    if (!isValidHistory(history)) {
      res.status(400).json({
        error: "Histórico de conversa inválido.",
      });
      return;
    }

    const normalizedMessage = normalizeText(message);

    // Impede consultas meteorológicas para outras cidades conhecidas.
    const otherCities = [
      "santos",
      "campinas",
      "sao paulo",
      "ribeirao preto",
      "sao jose dos campos",
      "bauru",
      "jundiai",
      "brasilia",
      "goiania",
      "manaus",
      "alphaville",
      "tatuape",
      "marques",
      "paraiso",
    ];

    const mentionsAnotherCity = otherCities.some((city) =>
      new RegExp(`\\b${city}\\b`).test(normalizedMessage)
    );

    if (mentionsAnotherCity) {
      res.json({
        reply:
          "Sou o Atmos da UNIP Sorocaba! Consulto dados meteorológicos somente para Sorocaba - SP. Posso ajudar com a previsão daqui ou explicar algum fenômeno meteorológico.",
      });
      return;
    }

    let weatherContext = "";

    if (asksForCurrentWeather(message)) {
      const campus = findCampus();

      if (!campus) {
        res.status(500).json({
          error:
            "A unidade da UNIP Sorocaba não foi encontrada na configuração do projeto.",
        });
        return;
      }

      try {
        const weather = await fetchCampusWeather(campus);

        weatherContext = `
DADOS METEOROLÓGICOS CONSULTADOS

Local: ${campus.fullLocation}
Unidade: ${campus.name}
Fonte: Open-Meteo.
Horário da consulta: ${weather.fetchedAt}.

CONDIÇÕES ATUAIS INFORMADAS PELA API:
- Temperatura: ${weather.temperature} °C.
- Sensação térmica: ${weather.apparentTemperature} °C.
- Condição meteorológica: ${weather.condition}.
- Umidade relativa: ${weather.humidity}%.
- Velocidade do vento: ${weather.windSpeed} km/h.

PREVISÃO DIÁRIA:
${weather.forecast
  .map(
    (day) =>
      `- ${day.day}: ${day.condition}; mínima de ${day.minTemp} °C; máxima de ${day.maxTemp} °C; probabilidade máxima de precipitação de ${day.rainProbability}%.`
  )
  .join("\n")}

INSTRUÇÕES:
- Responda usando os dados consultados para afirmações meteorológicas.
- Informe que os dados se referem a Sorocaba - SP.
- Diferencie condições atuais de previsões futuras.
- Probabilidade de precipitação não garante que vai chover.
- Não invente horários, alertas ou informações ausentes.
- Explique os dados de forma natural e educativa.
`;
      } catch (error) {
        console.error(
          "Erro ao consultar a Open-Meteo para Sorocaba:",
          error
        );

        res.status(502).json({
          error:
            "Não consegui consultar os dados meteorológicos de Sorocaba agora. Tente novamente em instantes.",
        });
        return;
      }
    }

    if (!apiKey) {
      res.status(503).json({
        error:
          "A chave GEMINI_API_KEY não está configurada no arquivo backend/.env. Configure-a para receber respostas do Atmos com inteligência artificial.",
      });
      return;
    }

    const userMessage = weatherContext
      ? `Pergunta do usuário: ${message.trim()}\n\n${weatherContext}`
      : message.trim();

    const contents = [
      ...history.map((item) => ({
        role: item.role,
        parts: [{ text: item.text }],
      })),
      {
        role: "user" as const,
        parts: [{ text: userMessage }],
      },
    ];

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 800,
      },
    });

    const reply = response.text?.trim();

    if (!reply) {
      res.status(502).json({
        error: "O Atmos não conseguiu gerar uma resposta.",
      });
      return;
    }

    res.json({ reply });
  } catch (error) {
    console.error("Erro na API do Atmos:", error);

    // Identifica quando o Gemini limita as solicitações.
    const errorMessage =
      error instanceof Error ? error.message : "";

    const errorStatus =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: unknown }).status
        : undefined;

    if (
      errorStatus === 429 ||
      errorMessage.includes("429") ||
      errorMessage.includes("RESOURCE_EXHAUSTED")
    ) {
      res.status(429).json({
        error:
          "Estou recebendo muitas solicitações neste momento. Tente novamente mais tarde.",
      });
      return;
    }

    res.status(502).json({
      error:
        "Não consegui responder agora. Tente novamente em instantes.",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Atmos backend disponível em http://localhost:${PORT}`
  );
});
