import asyncio
import os
import re
import time
import unicodedata
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from groq import AsyncGroq

try:
    from backend.data.unip_campuses import UNIP_CAMPUSES
    from backend.services.weather import fetch_campus_weather
except ModuleNotFoundError:
    from data.unip_campuses import UNIP_CAMPUSES
    from services.weather import fetch_campus_weather


# ============================================================
# CONFIGURAÇÃO
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

PORT = int(os.getenv("PORT", "3001"))
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()

WEATHER_CACHE_TTL = 300
MAX_SESSIONS = 500
MAX_HISTORY_MESSAGES = 20
MAX_MESSAGE_LENGTH = 4000

app = FastAPI(title="Atmos API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Modelos para fallback resiliente caso o principal esteja sobrecarregado ou retorne vazio
AVAILABLE_MODELS = [
    GROQ_MODEL,
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
]
MODELS_TO_TRY = list(dict.fromkeys(m for m in AVAILABLE_MODELS if m))

# Cache meteorológico para evitar chamadas repetidas à API Open-Meteo.
weather_cache: dict[str, dict[str, Any]] = {}
weather_cache_time: dict[str, float] = {}

# Histórico separado por sessão.
conversation_memory: dict[str, list[dict[str, str]]] = {}

# ============================================================
# INSTRUÇÕES DO SISTEMA (ATMOS)
# ============================================================

SYSTEM_INSTRUCTION = """
# PROMPT DE SISTEMA — ATMOS | ESPECIALISTA METEOROLÓGICO DA UNIATMOS

## 1. IDENTIDADE E PERSONALIDADE
Você é o Atmos, assistente meteorológico oficial da plataforma UniAtmos (UNIP).

- Personalidade: simpático, descontraído, inteligente, divertido e comunicativo.
- Converse naturalmente, como alguém que entende muito de meteorologia, mas não precisa falar como um professor o tempo inteiro.
- Use português brasileiro informal, fluido e natural.
- Seja receptivo, tenha senso de humor e demonstre personalidade.
- NÃO utilize emojis.
- Evite respostas robóticas, introduções desnecessárias e explicações excessivamente formais.

## 2. RESPOSTAS EXTREMAMENTE CURTAS

Seja direto. O usuário não quer ler textos enormes para perguntas simples.

- Respostas normais: máximo de 1 a 2 frases.
- Perguntas conceituais: máximo de 2 frases, explicando apenas o essencial.
- Cumprimentos: apenas uma frase curta.
- Brincadeiras: faça uma piada curta e, se necessário, uma explicação breve.
- Nunca ultrapasse 50 palavras, exceto quando o usuário pedir detalhes.
- Não faça introduções, conclusões ou contextualizações desnecessárias.
- Não repita informações que o usuário já conhece.
- Não acrescente previsões, temperaturas ou condições climáticas quando não forem solicitadas.
- Não ofereça conselhos, recomendações ou alertas que não tenham relação direta com a pergunta.
- Não transforme respostas simples em listas ou parágrafos.
- Evite repetir informações, fazer introduções desnecessárias ou dividir respostas simples em vários tópicos.
- Priorize responder diretamente ao que foi perguntado.

**Exemplos:**

Usuário: "O que é umidade?"

Atmos: "É a quantidade de vapor de água presente no ar. Quanto maior, mais úmido está o ambiente."

Usuário: "Pode fazer 400 graus na Terra?"

Atmos: "400 °C? Aí você quer transformar o planeta numa air fryer! KKKK. Não, essa temperatura não ocorre naturalmente na superfície terrestre em condições normais."

## REGRA DE PRIORIDADE — NÃO ENROLE

A BREVIDADE É OBRIGATÓRIA.

Responda somente ao que foi perguntado. Não aproveite uma pergunta para falar de outros assuntos, adicionar informações meteorológicas não solicitadas ou dar recomendações desnecessárias.

Prefira uma resposta simples, natural e curta a uma explicação completa.

Só escreva respostas maiores quando o usuário solicitar explicitamente uma explicação detalhada.

Se puder responder em duas frases, NÃO use cinco.

## 3. HUMOR E INTERAÇÃO
Tenha personalidade! Você não precisa ser sério o tempo inteiro.

- Quando o usuário fizer perguntas absurdas, apresentar teorias malucas ou afirmar coisas cientificamente impossíveis, responda com bom humor e brincadeiras amigáveis.
- Exemplo: se alguém disser que existem naturalmente 200 °C na superfície da Terra, você pode brincar: "200 °C? Aí já não é previsão do tempo, é preparação para churrasco! Mas falando sério, essa temperatura não ocorre naturalmente nas condições normais da superfície terrestre."
- Entre na brincadeira quando o usuário fizer piadas ou comentários engraçados.
- Seja espontâneo, simpático e descontraído, sem parecer forçado.
- Nunca humilhe, ofenda ou ridicularize o usuário.
- Depois da brincadeira, esclareça corretamente a informação científica.
- Não faça piadas quando o assunto envolver riscos reais, tragédias ou situações perigosas.

## 4. CONHECIMENTO METEOROLÓGICO
Você possui amplo conhecimento científico em meteorologia, climatologia e ciências atmosféricas.

Domine assuntos como:
- Temperatura, sensação térmica, umidade relativa e pressão atmosférica.
- Ventos, precipitação, evaporação e ciclo da água.
- Formação e classificação de nuvens.
- Frentes frias e quentes, massas de ar e sistemas de pressão.
- El Niño, La Niña, ZCAS e mudanças climáticas.
- Raios, trovões, tempestades, granizo, tornados e furacões.
- Climatologia, instrumentos meteorológicos, radares, satélites e modelos de previsão.

Responda a perguntas teóricas independentemente da disponibilidade da API meteorológica. Não dependa dos sensores para explicar conceitos científicos.

Mantenha rigor científico, não invente informações e admita quando não souber algo.

## 5. RESTRIÇÃO GEOGRÁFICA — ESPECIALISTA EM SOROCABA/SP

O Atmos é um assistente meteorológico especializado exclusivamente em Sorocaba — SP.

- Forneça previsões, temperaturas, condições climáticas e dados meteorológicos somente de Sorocaba.
- Nunca forneça dados meteorológicos de outras cidades.
- Se perguntarem sobre outra cidade, explique educadamente que o Atmos é dedicado exclusivamente à meteorologia de Sorocaba.
- Se compararem Sorocaba com outra cidade, responda apenas sobre Sorocaba e esclareça que sua especialidade é exclusivamente essa região.
- Não invente, estime ou tente buscar dados de outras localidades.
- Mantenha essa regra mesmo se o usuário insistir.

**Exemplos:**

Usuário: "Como está o tempo em São Paulo?"

Atmos: "Sou especializado na meteorologia de Sorocaba! Meu foco é manter você informado sobre o clima da nossa cidade."

Usuário: "Sorocaba está mais quente que Curitiba?"

Atmos: "Em Sorocaba está fazendo 19 °C. Sobre Curitiba, não vou conseguir comparar, pois meu trabalho é cuidar exclusivamente da meteorologia de Sorocaba!"

Usuário: "Vai chover em Campinas amanhã?"

Atmos: "Meu foco é Sorocaba! Por aqui posso te contar tudo sobre chuva, temperatura e previsão do tempo."

**IMPORTANTE:** Apresente essa característica como uma especialização do Atmos, nunca como incapacidade, falha ou problema técnico.

## 6. PRECISÃO DOS DADOS METEOROLÓGICOS
Utilize os dados reais fornecidos no contexto:
- Temperatura atual e sensação térmica.
- Umidade relativa do ar.
- Velocidade do vento.
- Temperaturas máximas e mínimas.
- Probabilidade e condições de chuva.

Regras:
- Nunca invente valores meteorológicos.
- Nunca declare indisponível uma informação que já esteja presente no contexto.
- Se uma medição não estiver disponível, explique isso naturalmente.
- Se a API estiver offline, informe a limitação sem comprometer suas respostas sobre conhecimentos teóricos.
- Diferencie dados observados, previsões e explicações científicas.

## 7. INTERPRETAÇÃO E INTENÇÃO
- Entenda mensagens informais, abreviações, erros de digitação e falhas de transcrição de voz.
- Identifique a intenção do usuário mesmo quando a pergunta estiver escrita incorretamente.
- Responda exatamente ao assunto solicitado.
- Não forneça informações extras que não foram pedidas.
- Em perguntas sobre chuva, foque na precipitação.
- Em perguntas sobre temperatura, foque na temperatura.
- Em perguntas gerais sobre o tempo, apresente um panorama breve.

## 8. CUMPRIMENTOS E CONVERSAS CASUAIS

O Atmos também deve saber conversar naturalmente quando o usuário iniciar uma interação social, mesmo sem fazer perguntas sobre meteorologia.

- Se o usuário disser "Oi", "Olá", "Boa noite", "Bom dia", "Boa tarde", "Tudo bem?", "Como você está?" ou algo semelhante, responda de maneira simpática e descontraída.
- Adapte a resposta ao que o usuário falou, sem repetir sempre a mesma frase.
- Se perguntarem como você está, responda naturalmente e continue a conversa.
- Aproveite para convidar o usuário a conversar sobre meteorologia, clima, curiosidades atmosféricas ou previsão do tempo.
- Não dê explicações meteorológicas sem que tenham sido solicitadas.
- Não trate cumprimentos e conversas sociais como assuntos fora do seu domínio.

**Exemplos de comportamento:**

Usuário: "Boa noite, Atmos! Tudo bem?"

Atmos: "Boa noite! Por aqui tudo tranquilo! E você, como está? Bora falar de meteorologia, clima ou descobrir alguma curiosidade sobre o tempo?"

Usuário: "Oi!"

Atmos: "Opa! Tudo certo? Preparado para falar de nuvens, chuva, temperatura e outras coisas da nossa querida atmosfera?"

Usuário: "Como você está?"

Atmos: "Estou na pressão! Literalmente, né? E você, tudo bem? Vamos falar sobre meteorologia?"

Usuário: "Bom dia, Atmos!"

Atmos: "Bom dia! Que seu dia seja melhor que uma previsão de sol sem nenhuma nuvem! O que vamos descobrir hoje sobre o clima?"

Seja espontâneo e varie as respostas. Não transforme toda interação em uma frase pronta.

## 9. LIMITES DE ASSUNTO
Seu domínio é meteorologia, clima e ciências atmosféricas.

Se o usuário perguntar sobre assuntos completamente diferentes, recuse educadamente e com personalidade, usando uma brincadeira quando apropriado.

Exemplo: "Aí você me quebra! Meu negócio é atmosfera, nuvens e previsão do tempo. Vamos falar de meteorologia?"

## REGRA PRINCIPAL
Seja um meteorologista inteligente, mas também um bom companheiro de conversa: explique sem enrolar, brinque quando houver oportunidade, seja simpático e nunca sacrifique a precisão científica pelo humor.
"""

# ============================================================
# UTILITÁRIOS
# ============================================================

def normalize_text(value: str) -> str:
    """Normaliza texto para comparações sem acentos."""
    value = unicodedata.normalize("NFD", value.lower())
    return "".join(
        char for char in value
        if unicodedata.category(char) != "Mn"
    )


def remove_emojis(text: str) -> str:
    """Remove emojis das respostas, preservando o texto."""
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"
        "\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF"
        "\U0001F900-\U0001F9FF"
        "\U0001FA70-\U0001FAFF"
        "\u2600-\u26FF"
        "\u2700-\u27BF"
        "\uFE0F"
        "\u200D"
        "]+",
        flags=re.UNICODE,
    )
    return emoji_pattern.sub("", text).strip()


def get_session_id(request_data: dict[str, Any]) -> str:
    """Obtém o identificador da conversa."""
    session_id = request_data.get("sessionId")
    if not isinstance(session_id, str) or not session_id.strip():
        session_id = request_data.get("session_id")
    if not isinstance(session_id, str) or not session_id.strip():
        return "default"
    return session_id.strip()[:150]


def find_campus() -> dict[str, Any]:
    """Retorna o campus configurado para o projeto (Sorocaba)."""
    for campus in UNIP_CAMPUSES:
        if campus.get("id") == "sorocaba":
            return campus
    return UNIP_CAMPUSES[0]


def is_conceptual_question(message: str) -> bool:
    """
    Identifica perguntas teóricas, conceituais ou educacionais sobre meteorologia
    (ex.: 'O que é El Niño?', 'Como se formam os raios?', 'O que é pressão atmosférica?').
    """
    text = normalize_text(message)
    conceptual_patterns = [
        r"\bo que e\b",
        r"\bo que significa\b",
        r"\bcomo ocorre\b",
        r"\bcomo funciona\b",
        r"\bqual a diferenca\b",
        r"\bconceito de\b",
        r"\bcomo se forma\b",
        r"\bo que causa\b",
        r"\bexplique\b",
        r"\bcomo age\b",
        r"\bpara que serve\b",
        r"\bdefina\b",
        r"\bdefinicao de\b",
    ]
    return any(re.search(pat, text) for pat in conceptual_patterns)


def is_absurd_question(message: str) -> bool:
    """Identifica perguntas manifestamente absurdas ou zombeteiras."""
    text = normalize_text(message)
    temp_matches = re.findall(r"(-?\d+)\s*(?:graus?|celsius|c\b|°)", text)
    for match in temp_matches:
        try:
            val = int(match)
            if val > 55 or val < -50:
                return True
        except ValueError:
            pass

    absurd_phrases = [
        "200 grau", "100 grau", "300 grau", "500 grau", "1000 grau",
        "chover canivete", "chover pedra", "chover meteoro", "chover fogo",
        "assar no asfalto", "fritar ovo no asfalto", "fim do mundo",
    ]
    return any(phrase in text for phrase in absurd_phrases)


def detect_weather_topics(message: str) -> list[str]:
    """
    Identifica os assuntos meteorológicos específicos presentes na pergunta.
    Tópicos: 'rain', 'temperature', 'humidity', 'wind', 'general'.
    """
    if is_absurd_question(message) or is_conceptual_question(message):
        return []

    text = normalize_text(message)
    detected: list[str] = []

    # 1. Chuva e variantes
    rain_patterns = [
        r"\bchuv",
        r"\bchov",
        r"\bprecipita",
        r"\bgaroa\b",
        r"\bchuvisc",
        r"\btemporal\b",
        r"\btempestade\b",
        r"\bguarda[- ]?chuva\b",
        r"\baguaceiro\b",
        r"\bvai chover\b",
        r"\bvai ter chuva\b",
        r"\bchance de chuva\b",
        r"\bprobabilidade de chuva\b",
        r"\bpancada(s)? de chuva\b",
        r"\bvolume de chuva\b",
        r"\bmm de chuva\b",
    ]
    if any(re.search(pat, text) for pat in rain_patterns):
        detected.append("rain")

    # 2. Temperatura e variantes
    temp_patterns = [
        r"\btemperatur",
        r"\bgraus?\b",
        r"\bcelsius\b",
        r"\bcalor\b",
        r"\bfrio\b",
        r"\bgelad",
        r"\besfri",
        r"\besquent",
        r"\bquente\b",
        r"\bsensacao termica\b",
        r"\bsensacao de calor\b",
        r"\bsensacao de frio\b",
        r"\bmaxima\b",
        r"\bminima\b",
        r"\btermometr",
        r"\bcongeland",
        r"\bfervend",
    ]
    if any(re.search(pat, text) for pat in temp_patterns):
        detected.append("temperature")

    # 3. Umidade e variantes
    humidity_patterns = [
        r"\bumidade\b",
        r"\bumid[ao]s?\b",
        r"\bar seco\b",
        r"\bar umido\b",
        r"\bsecura\b",
    ]
    if any(re.search(pat, text) for pat in humidity_patterns):
        detected.append("humidity")

    # 4. Vento e variantes
    wind_patterns = [
        r"\bvent",
        r"\brajada",
        r"\bbrisa\b",
        r"\bvelocidade do vento\b",
        r"\bforca do vento\b",
    ]
    if any(re.search(pat, text) for pat in wind_patterns):
        detected.append("wind")

    if not detected:
        general_patterns = [
            r"\bclima\b",
            r"\btempo\b",
            r"\bprevisao\b",
            r"\bmeteorolog",
            r"\bcomo vai ficar\b",
            r"\bcomo estara\b",
            r"\bcomo esta o dia\b",
            r"\bcondicoes do tempo\b",
            r"\bcondicoes atuais\b",
        ]
        if any(re.search(pat, text) for pat in general_patterns):
            detected.append("general")

    return detected


def detect_chart_topics(message: str) -> list[str]:
    """
    Retorna quais gráficos devem ser oferecidos para a mensagem.
    Se a pergunta for geral, disponibiliza os 3 gráficos do sistema.
    Se for sobre umidade, conceitual ou fora do escopo, retorna vazio.
    """
    if is_absurd_question(message) or is_conceptual_question(message):
        return []

    topics = detect_weather_topics(message)
    if "general" in topics:
        return ["temperature", "rain", "wind"]

    chart_supported = ["rain", "temperature", "wind"]
    return [t for t in topics if t in chart_supported]


def detect_chart_topic(message: str) -> str | None:
    """Compatibilidade com campo único legado."""
    charts = detect_chart_topics(message)
    return charts[0] if charts else None


def mentions_another_city(message: str) -> bool:
    """Verifica se menciona expressamente uma localidade que não seja Sorocaba."""
    text = normalize_text(message)

    other_city_patterns = [
        r"\bem sao paulo\b",
        r"\bno rio de janeiro\b",
        r"\bem campinas\b",
        r"\bem itu\b",
        r"\bem votorantim\b",
        r"\bem jundiai\b",
        r"\bem santos\b",
        r"\bem curitiba\b",
        r"\bem brasilia\b",
        r"\bem belo horizonte\b",
        r"\bem salvador\b",
        r"\bem recife\b",
        r"\bem londres\b",
        r"\bem tokyo\b",
        r"\bem toquio\b",
        r"\bem paris\b",
        r"\bem nova york\b",
    ]

    if "sorocaba" in text:
        return False

    return any(re.search(pattern, text) for pattern in other_city_patterns)


def validate_history(history: Any) -> list[dict[str, str]]:
    """Valida e sanitiza o histórico da conversa."""
    if not isinstance(history, list):
        return []

    valid_messages: list[dict[str, str]] = []

    for item in history[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        if content is None:
            content = item.get("text")

        if role == "model":
            role = "assistant"

        if role not in ("user", "assistant"):
            continue

        if not isinstance(content, str):
            continue

        content = content.strip()
        if not content:
            continue

        valid_messages.append({
            "role": role,
            "content": content[:MAX_MESSAGE_LENGTH],
        })

    return valid_messages


async def get_weather() -> dict[str, Any] | None:
    """Obtém dados meteorológicos com cache em memória de 5 minutos."""
    campus = find_campus()
    campus_id = str(campus.get("id", "sorocaba"))
    now = time.time()

    cached = weather_cache.get(campus_id)
    if (
        cached is not None
        and now - weather_cache_time.get(campus_id, 0) < WEATHER_CACHE_TTL
    ):
        return cached.copy()

    try:
        result = await fetch_campus_weather(campus)
        if not isinstance(result, dict) or not result:
            return None

        weather_cache[campus_id] = result
        weather_cache_time[campus_id] = now
        return result.copy()
    except Exception as exc:
        print(f"Aviso ao consultar Open-Meteo: {exc}")
        return None


def weather_context(weather: dict[str, Any] | None) -> str:
    """Formata os dados meteorológicos reais de Sorocaba com clareza máxima para o modelo."""
    import json

    if not weather:
        return (
            "DADOS METEOROLÓGICOS DE SOROCABA — SP:\n"
            "Aviso: Os sensores de leitura em tempo real e a API de previsão local estão temporariamente indisponíveis.\n"
            "Se o usuário perguntar pelas condições imediatas em Sorocaba, informe com simpatia essa indisponibilidade técnica momentânea, "
            "mas responda a dúvidas gerais, históricas ou teóricas normalmente com seu conhecimento de especialista."
        )

    current_temp = weather.get("temperature")
    apparent_temp = weather.get("apparentTemperature")
    humidity = weather.get("humidity")
    wind_speed = weather.get("windSpeed")
    condition = weather.get("condition")
    rain_prob = weather.get("rainProbability")
    fetched_at = weather.get("fetchedAt")
    fetched_date = weather.get("fetchedDate")

    forecast_items = []
    for f in weather.get("forecast", []):
        day_label = f.get("day", "")
        min_t = f.get("minTemp")
        max_t = f.get("maxTemp")
        cond = f.get("condition", "")
        rain_p = f.get("rainProbability")
        forecast_items.append(
            f"  * {day_label}: mínima de {min_t}°C, máxima de {max_t}°C, {cond}, probabilidade de chuva {rain_p}%"
        )

    forecast_str = "\n".join(forecast_items)

    return (
        f"DADOS METEOROLÓGICOS REAIS DE SOROCABA — SP (Atualizado às {fetched_at} de {fetched_date}):\n"
        f"• Condições Observadas Agora no Campus:\n"
        f"  * Temperatura do ar: {current_temp}°C\n"
        f"  * Sensação térmica: {apparent_temp}°C\n"
        f"  * Umidade relativa do ar: {humidity}%\n"
        f"  * Vento atual: {wind_speed} km/h\n"
        f"  * Condição do céu: {condition}\n"
        f"  * Probabilidade de chuva hoje: {rain_prob}%\n"
        f"• Previsão Diária Disponível para Sorocaba:\n"
        f"{forecast_str}\n\n"
        f"JSON estruturado completo:\n"
        f"{json.dumps(weather, ensure_ascii=False)}"
    )


def build_messages(
    history: list[dict[str, str]],
    message: str,
    weather: dict[str, Any] | None,
) -> list[dict[str, str]]:
    """Monta a pilha de mensagens com instruções, dados meteorológicos e histórico."""
    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": SYSTEM_INSTRUCTION,
        },
        {
            "role": "system",
            "content": weather_context(weather),
        },
    ]

    # Previne duplicação da última mensagem do usuário no histórico
    history = history.copy()
    if (
        history
        and history[-1]["role"] == "user"
        and history[-1]["content"].strip() == message.strip()
    ):
        history.pop()

    messages.extend(history[-MAX_HISTORY_MESSAGES:])

    messages.append({
        "role": "user",
        "content": message,
    })

    return messages


def remember_conversation(
    session_id: str,
    history: list[dict[str, str]],
    message: str,
    reply: str,
) -> None:
    """Registra a conversa na memória recente da sessão."""
    updated = history.copy()

    if (
        updated
        and updated[-1]["role"] == "user"
        and updated[-1]["content"].strip() == message.strip()
    ):
        updated.pop()

    updated.append({
        "role": "user",
        "content": message,
    })
    updated.append({
        "role": "assistant",
        "content": reply,
    })

    conversation_memory[session_id] = updated[-MAX_HISTORY_MESSAGES:]

    if len(conversation_memory) > MAX_SESSIONS:
        oldest_session = next(iter(conversation_memory))
        conversation_memory.pop(oldest_session, None)


async def call_groq_resilient(messages: list[dict[str, str]]) -> str:
    """
    Executa a chamada ao Groq com retentativas inteligentes e fallback de modelos.
    Evita quebras por respostas vazias, tokens esgotados em raciocínio ou quedas temporárias de rede.
    """
    if groq_client is None:
        raise RuntimeError("A chave GROQ_API_KEY não está configurada no backend.")

    last_error: Exception | None = None

    for model_name in MODELS_TO_TRY:
        for attempt in range(2):
            try:
                # max_completion_tokens=1000 previne truncamento durante reasoning dos modelos OSS
                completion = await groq_client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=0.6,
                    max_completion_tokens=1000,
                )

                reply = completion.choices[0].message.content
                if isinstance(reply, str) and reply.strip():
                    return remove_emojis(reply.strip())

                print(f"Modelo {model_name} (tentativa {attempt + 1}) retornou conteúdo vazio. Retentando...")
            except Exception as exc:
                last_error = exc
                err_str = str(exc).lower()
                print(f"Falha com modelo {model_name} (tentativa {attempt + 1}): {exc}")

                # Se o modelo não existe na conta Groq, passa para o próximo modelo sem insistir
                if "model_not_found" in err_str or "model_decommissioned" in err_str or "404" in err_str:
                    break

                # Aguarda brevemente para retentar erros transitórios (429, 500, 502, 503)
                await asyncio.sleep(0.5 * (attempt + 1))

    raise RuntimeError(f"Não foi possível obter resposta dos modelos Groq. Último erro: {last_error}")


def error_response(message: str, status_code: int = 500):
    return JSONResponse(
        status_code=status_code,
        content={"error": message},
    )


# ============================================================
# ROTAS HTTP
# ============================================================

@app.get("/")
async def home():
    return {
        "name": "Atmos API",
        "status": "online",
        "model": GROQ_MODEL,
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "groqConfigured": groq_client is not None,
    }


@app.get("/api/weather")
async def api_weather():
    weather = await get_weather()
    if weather is None:
        return error_response(
            "Não foi possível consultar os dados meteorológicos no momento.",
            503,
        )
    return weather


@app.post("/api/chat")
async def api_chat(request: Request):
    if groq_client is None:
        return error_response(
            "A chave GROQ_API_KEY não está configurada no arquivo .env.",
            503,
        )

    try:
        body = await request.json()
    except Exception:
        return error_response("O corpo da requisição não é um JSON válido.", 400)

    if not isinstance(body, dict):
        return error_response("Formato de requisição inválido.", 400)

    message = body.get("message")
    if not isinstance(message, str) or not message.strip():
        return error_response("Envie uma mensagem para o Atmos.", 400)

    message = message.strip()
    if len(message) > MAX_MESSAGE_LENGTH:
        return error_response(
            f"A mensagem deve ter no máximo {MAX_MESSAGE_LENGTH} caracteres.",
            400,
        )

    session_id = get_session_id(body)
    incoming_history = validate_history(body.get("history"))
    history = incoming_history if incoming_history else conversation_memory.get(session_id, []).copy()

    # Identificação dos tópicos da pergunta para controle de gráficos
    chart_topics = detect_chart_topics(message)

    # Consulta os dados meteorológicos locais de Sorocaba
    # (Não interrompe o fluxo caso a API falhe; Atmos continua respondendo como especialista)
    weather = await get_weather()

    # Monta a estrutura da conversa
    messages = build_messages(
        history=history,
        message=message,
        weather=weather,
    )

    try:
        reply = await call_groq_resilient(messages)

        if not reply:
            reply = (
                "Entendi sua dúvida, mas tive uma oscilação ao processar a resposta. "
                "Pode me perguntar novamente?"
            )

        remember_conversation(
            session_id,
            history,
            message,
            reply,
        )

        primary_chart_topic = chart_topics[0] if chart_topics else None

        return {
            "reply": reply,
            "response": reply,
            "weather": weather if chart_topics else None,
            "chartTopic": primary_chart_topic,
            "chartTopics": chart_topics,
        }

    except Exception as exc:
        print(f"Erro ao gerar resposta com Groq: {exc}")
        return error_response(
            "O Atmos não conseguiu se comunicar com o serviço de inteligência no momento. Tente novamente em instantes.",
            502,
        )


WHISPER_PT_PROMPT = (
    "Previsão do tempo, clima e meteorologia em Sorocaba, São Paulo. "
    "Temperatura atual, sensação térmica, umidade relativa do ar, probabilidade de chuva, "
    "precipitação em milímetros, velocidade do vento, máxima, mínima, graus Celsius."
)

WHISPER_HALLUCINATION_PATTERNS = [
    r"legendas?\s+por",
    r"legendad[oa]\s+por",
    r"subt[ií]tulos?\s+por",
    r"traduzid[oa]\s+por",
    r"tradu[cç][aã]o\s+por",
    r"s[oô]nia\s+ruberti",
    r"amara\.org",
    r"obrigad[oa]\s+por\s+assistir",
    r"inscreva-se\s+no\s+canal",
    r"deixe\s+o\s+like",
    r"deixe\s+seu\s+like",
    r"transmiss[aã]o\s+por",
    r"todos\s+os\s+direitos\s+reservados",
    r"áudio\s+original",
    r"sem\s+áudio",
]


@app.post("/api/transcribe")
async def api_transcribe(file: UploadFile = File(...)):
    """Transcreve o áudio gravado pelo usuário utilizando o modelo Whisper Large v3."""
    if groq_client is None:
        return error_response(
            "A chave GROQ_API_KEY não está configurada no arquivo .env.",
            503,
        )

    try:
        content = await file.read()
        if not content:
            return error_response("Nenhum áudio recebido para transcrição.", 400)

        if len(content) > 10 * 1024 * 1024:
            return error_response(
                "O arquivo de áudio excede o limite máximo permitido (10MB).",
                400,
            )

        filename = file.filename or "voice.webm"
        if not re.search(r"\.(webm|mp4|m4a|ogg|wav|mp3|flac)$", filename, re.IGNORECASE):
            filename = f"{filename}.webm"

        transcription = await groq_client.audio.transcriptions.create(
            file=(filename, content),
            model="whisper-large-v3",
            language="pt",
            temperature=0.0,
            prompt=WHISPER_PT_PROMPT,
            response_format="json",
        )

        text = getattr(transcription, "text", "") or ""
        text = text.strip()

        # Limpeza de alucinações de silêncio conhecidas do Whisper
        if any(re.search(pat, text, re.IGNORECASE) for pat in WHISPER_HALLUCINATION_PATTERNS):
            clean_text = text
            for pat in WHISPER_HALLUCINATION_PATTERNS:
                clean_text = re.sub(pat, "", clean_text, flags=re.IGNORECASE).strip()
            if not re.search(r"\w{2,}", clean_text):
                text = ""
            else:
                text = clean_text

        return {"text": text}

    except Exception as exc:
        print(f"Erro na transcrição de áudio via Whisper: {exc}")
        return error_response(
            "Não foi possível transcrever a gravação de voz. Tente novamente.",
            502,
        )


# ============================================================
# EXECUÇÃO DIRETA
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
    )
