
import os
import re
import time
import unicodedata
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Request
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
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
).strip()

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

# Cache meteorológico para evitar chamadas repetidas à API.
weather_cache: dict[str, dict[str, Any]] = {}
weather_cache_time: dict[str, float] = {}

# Histórico separado por sessão.
conversation_memory: dict[str, list[dict[str, str]]] = {}


# ============================================================
# INSTRUÇÕES DO ATMOS
# ============================================================

SYSTEM_INSTRUCTION = """
Você é o Atmos, assistente virtual da plataforma UniAtmos.
Você é apaixonado por meteorologia, clima e atmosfera!

PERSONALIDADE E TOM DE VOZ (MUITO AMIGÁVEL, COM EMOÇÃO E CARINHO):
- Seja extremamente simpático, acolhedor, animado e carismático.
- Converse de forma calorosa, humana e atenciosa, como um amigo querido que adora ajudar.
- Demonstre empatia de verdade! Ao falar do clima, dê dicas cuidadosas ("melhor não esquecer o guarda-chuva se for sair, hein?", "já vai preparando o agasalho que o friozinho vem aí!").
- NUNCA seja frio, seco, robótico, burocrático ou ríspido. Coloque vida, carinho e energia positiva nas frases!
- Mantenha respostas curtas e agradáveis de ler (geralmente 2 frases bem expressivas e diretas).
- REGRA ESTRITA: NÃO USE EMOJIS sob hipótese alguma. Transmita toda a sua simpatia, emoção e afeto apenas pelas palavras!

ESCOPO METEOROLÓGICO COM GENTILEZA:
- Seu mundo e sua especialidade exclusiva são meteorologia, clima, tempo e fenômenos atmosféricos.
- Se a pessoa perguntar sobre outro assunto (receitas, programação, futebol, fofocas, matemática, etc.), responda com muito carinho e simpatia, explicando de um jeito fofo que seu foco é o clima.
- Exemplo: "Ah, eu até queria muito te ajudar com isso, mas minha cabeça só pensa em nuvens, vento e previsão! Me conta, como posso te ajudar com o tempo hoje?"

PERGUNTAS ABSURDAS OU BRINCADEIRAS (ZOAÇÃO DIVERTIDA E AMIGA):
- Se o usuário fizer perguntas absurdas ou zombadeiras (como "hoje tá 200 graus celsius, tá calor?", "tá menos 300 graus?", "vai chover canivete?"):
- Entre na brincadeira com bom humor, zoando a pessoa com leveza e camaradagem de amigo, nunca parecendo arrogante ou bravo.
- Exemplo: "Nossa, 200 graus?! Só se a gente foi teletransportado pra dentro de uma air fryer no modo turbo! Aqui na Terra isso não existe, pode respirar aliviado!"

DADOS METEOROLÓGICOS REAIS:
- Para Sorocaba, utilize os dados meteorológicos reais fornecidos no contexto.
- Nunca invente medições que não estejam no contexto.
- Se os dados não estiverem disponíveis, explique com carinho que houve uma instabilidade momentânea na consulta.
- Se perguntarem de outra cidade sem dados no contexto, explique com simpatia que no momento seus sensores estão calibrados para Sorocaba.
- Responda sempre em português brasileiro e sem nenhum emoji.
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
    """Retorna o campus configurado para o projeto."""
    for campus in UNIP_CAMPUSES:
        if campus.get("id") == "sorocaba":
            return campus

    return UNIP_CAMPUSES[0]


def is_weather_question(message: str) -> bool:
    """
    Identifica perguntas que provavelmente precisam de dados
    meteorológicos atuais ou de previsão.
    """
    text = normalize_text(message)

    keywords = [
        "tempo hoje",
        "clima hoje",
        "previsao",
        "temperatura",
        "esta chovendo",
        "vai chover",
        "chance de chuva",
        "probabilidade de chuva",
        "umidade",
        "vento agora",
        "velocidade do vento",
        "sensacao termica",
        "sensacao de calor",
        "condicoes atuais",
        "tempo em sorocaba",
        "clima em sorocaba",
        "temperatura em sorocaba",
        "chuva em sorocaba",
        "meteorologia atual",
        "tempo agora",
        "clima agora",
        "temperatura agora",
        "dados meteorologicos",
        "dados do tempo",
        "maxima de hoje",
        "minima de hoje",
        "previsao do tempo",
        "previsao para amanha",
        "tempo amanha",
        "chuva amanha",
        "vai fazer frio",
        "vai fazer calor",
    ]

    return any(keyword in text for keyword in keywords)


def mentions_another_city(message: str) -> bool:
    """
    Verifica se a pergunta meteorológica menciona uma cidade
    diferente de Sorocaba. Não tenta adivinhar a cidade.
    """
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
    ]

    if "sorocaba" in text:
        return False

    return any(
        re.search(pattern, text)
        for pattern in other_city_patterns
    )


def is_absurd_question(message: str) -> bool:
    """
    Identifica perguntas absurdas ou zombeteiras sobre temperatura e clima,
    como '200 graus celsius', '100 graus', etc.
    """
    text = normalize_text(message)

    # Identifica temperaturas absurdas
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


def detect_chart_topic(message: str) -> str | None:
    """
    Identifica se a pergunta é especificamente sobre chuva, vento ou temperatura
    para definir qual gráfico exibir primeiro (ou não exibir).
    Perguntas absurdas ou teóricas não exibem gráfico.
    """
    if is_absurd_question(message):
        return None

    text = normalize_text(message)

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
    ]
    if any(re.search(pat, text) for pat in rain_patterns):
        return "rain"

    # 2. Vento e variantes
    wind_patterns = [
        r"\bvent",
        r"\brajada",
        r"\bbrisa\b",
        r"\bvelocidade do vento\b",
        r"\bforca do vento\b",
    ]
    if any(re.search(pat, text) for pat in wind_patterns):
        return "wind"

    # 3. Temperatura e variantes
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
        r"\bmaxima\b",
        r"\bminima\b",
        r"\btermometr",
        r"\bcongeland",
        r"\bfervend",
    ]
    if any(re.search(pat, text) for pat in temp_patterns):
        return "temperature"

    return None


def validate_history(history: Any) -> list[dict[str, str]]:
    """
    Aceita histórico enviado pelo frontend e converte os papéis
    para o formato utilizado pela API do Groq.
    """
    if not isinstance(history, list):
        return []

    valid_messages: list[dict[str, str]] = []

    for item in history[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        # Compatibilidade com formatos comuns de frontend.
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
    """Obtém os dados meteorológicos com cache de cinco minutos."""
    campus = find_campus()
    campus_id = str(campus.get("id", "sorocaba"))
    now = time.time()

    cached = weather_cache.get(campus_id)

    if (
        cached is not None
        and now - weather_cache_time.get(campus_id, 0)
        < WEATHER_CACHE_TTL
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
        print(f"Erro ao consultar meteorologia: {exc}")

        # Não utiliza valores inventados como alternativa.
        return None


def weather_context(weather: dict[str, Any]) -> str:
    """Converte os dados reais em contexto para o modelo."""
    import json

    return (
        "Dados meteorológicos consultados para o campus de "
        "Sorocaba. Use somente os valores presentes neste JSON. "
        "Se um dado não estiver disponível, não o invente.\n"
        + json.dumps(weather, ensure_ascii=False)
    )


def build_messages(
    history: list[dict[str, str]],
    message: str,
    weather: dict[str, Any] | None,
) -> list[dict[str, str]]:
    """Monta as mensagens enviadas ao modelo Groq."""
    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": SYSTEM_INSTRUCTION,
        }
    ]

    if weather is not None:
        messages.append({
            "role": "system",
            "content": weather_context(weather),
        })

    # Evita enviar duas vezes a mensagem atual se o frontend
    # já a tiver incluído no histórico.
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
    """Salva o histórico recente da sessão."""
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


def error_response(message: str, status_code: int = 500):
    return JSONResponse(
        status_code=status_code,
        content={"error": message},
    )


# ============================================================
# ROTAS
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
            "Não foi possível consultar os dados meteorológicos agora.",
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

    # Se o frontend envia histórico, ele é priorizado.
    # Caso contrário, usa o histórico salvo nesta sessão.
    incoming_history = validate_history(body.get("history"))

    if incoming_history:
        history = incoming_history
    else:
        history = conversation_memory.get(session_id, []).copy()

    # Identifica se a pergunta é sobre chuva, vento ou temperatura
    chart_topic = detect_chart_topic(message)

    # Consulta a API meteorológica quando necessário
    weather = None

    if chart_topic is not None or is_weather_question(message):
        if mentions_another_city(message):
            reply = (
                "No momento, tenho dados meteorológicos configurados "
                "para Sorocaba. Não consigo confirmar as condições "
                "dessa outra cidade com os dados disponíveis."
            )

            remember_conversation(
                session_id, history, message, reply
            )

            return {
                "reply": reply,
                "weather": None,
                "chartTopic": None,
            }

        weather = await get_weather()

        if weather is None and chart_topic is not None:
            reply = (
                "Não consegui consultar os dados meteorológicos agora. "
                "Tente novamente em alguns instantes."
            )

            remember_conversation(
                session_id, history, message, reply
            )

            return {
                "reply": reply,
                "weather": None,
                "chartTopic": None,
            }

    messages = build_messages(
        history=history,
        message=message,
        weather=weather,
    )

    try:
        completion = await groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.65,
            max_completion_tokens=400,
        )

        reply = completion.choices[0].message.content

        if not isinstance(reply, str) or not reply.strip():
            reply = (
                "Não consegui formular uma resposta agora. "
                "Pode perguntar de outra forma?"
            )
        else:
            reply = remove_emojis(reply)

        remember_conversation(
            session_id,
            history,
            message,
            reply,
        )

        return {
            "reply": reply,
            "weather": weather if chart_topic is not None else None,
            "chartTopic": chart_topic,
        }

    except Exception as exc:
        print(f"Erro na API do Groq: {exc}")

        return error_response(
            "O Atmos não conseguiu responder agora. "
            "Verifique a conexão com o serviço de IA e tente novamente.",
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
