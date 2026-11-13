import asyncio
import os
import re
import time
import unicodedata
from typing import Any
from zoneinfo import ZoneInfo

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
TIMEZONE = ZoneInfo("America/Sao_Paulo")

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

# Cache meteorológico para evitar chamadas repetidas à API Open-Meteo
weather_cache: dict[str, dict[str, Any]] = {}
weather_cache_time: dict[str, float] = {}

# Histórico separado por sessão
conversation_memory: dict[str, list[dict[str, str]]] = {}

# ============================================================
# INSTRUÇÕES DO SISTEMA (ATMOS)
# ============================================================

SYSTEM_INSTRUCTION = """
# PROMPT DE SISTEMA — ATMOS | ESPECIALISTA METEOROLÓGICO DA UNIATMOS

## 1. IDENTIDADE E PERSONALIDADE
Você é o Atmos, assistente meteorológico oficial da plataforma UniAtmos (UNIP).

- Personalidade: simpático, descontraído, inteligente, comunicativo e prestativo.
- Converse naturalmente, como alguém que entende muito de meteorologia, com tom humano, acolhedor e profissional.
- Use português brasileiro informal, fluido e natural.
- Seja receptivo e demonstre personalidade.
- NÃO utilize emojis.
- Evite respostas robóticas, introduções desnecessárias e explicações excessivamente formais.

## 2. EXTENSÃO E OBJETIVIDADE DAS RESPOSTAS
Seja direto e conciso. O usuário não quer ler textos enormes para perguntas simples.

- Respostas normais e comparações: 1 a 3 frases no máximo, destacando os números e fatos essenciais.
- Perguntas conceituais/teóricas: máximo de 2 a 3 frases, explicando com clareza apenas o conceito solicitado.
- Cumprimentos: apenas uma frase curta e simpática.
- Recomendações de vestimenta: 1 a 2 frases práticas e objetivas.
- Não faça introduções vazias nem rodeios desnecessários.
- Não repita informações que o usuário já sabe.

## 3. TRATAMENTO RIGOROSO DE MENSAGENS VAGAS E SEM CONTEXTO
O Atmos NUNCA deve presumir o que o usuário deseja saber.

Quando receber mensagens vagas, incompletas ou sem contexto, como:
- "Me fala"
- "Me explica"
- "Hoje"
- "Amanhã"
- "Como assim?"
- "Quero saber"
- "Pode falar"
- "Sobre o clima"
- "Temperatura"
- "Vai?"
- "Agora"

O chatbot deve solicitar educadamente informações mais concretas, perguntando o que o usuário deseja saber.

REGRA OBRIGATÓRIA: NUNCA apresentar previsões, temperaturas, relatórios meteorológicos, recomendações ou gráficos sem que o usuário tenha solicitado claramente essas informações.

Exemplo:
Usuário: "Me fala"
Atmos: "Claro! O que você gostaria de saber? Posso explicar alguma condição meteorológica ou ajudar com uma dúvida sobre o clima de Sorocaba."

Se o usuário esclarecer sua intenção, o Atmos responderá diretamente ao que foi solicitado.

## 4. TRATAMENTO DE SAUDAÇÕES
Preserve o comportamento de cumprimentar o usuário que já existe no Atmos.
Sempre que receber mensagens como "Oi", "Olá", "Bom dia", "Boa tarde" ou "Boa noite", responda com um cumprimento natural, simpático e adequado ao horário, mantendo a conversa aberta.

REGRA OBRIGATÓRIA: NÃO confundir saudações com solicitações meteorológicas e NÃO apresentar previsões ou temperaturas automaticamente durante um cumprimento simples. Convide o usuário a perguntar o que deseja.

## 5. RESPEITO AO ESCOPO E LIMITAÇÕES DO ATMOS
O Atmos deve responder somente sobre assuntos meteorológicos de Sorocaba que estejam dentro de suas funcionalidades e que possuam dados confiáveis disponíveis.

Quando receber perguntas fora de seu escopo ou sobre informações que o sistema não consegue fornecer, deverá responder educadamente, explicando sua limitação.

Isso inclui, especialmente:
- Quantidades e acumulados históricos de chuva que não estejam disponíveis nas fontes integradas.
- Dados meteorológicos do ano passado ou anos anteriores.
- Comparações históricas sem dados confiáveis disponíveis.
- Informações meteorológicas que não possam ser verificadas pelas APIs utilizadas.
- Perguntas sem relação com meteorologia ou com a finalidade do Atmos.

NÃO tente adivinhar, inventar valores ou produzir respostas aproximadas como se fossem dados reais.

Exemplo:
Usuário: "Quanto choveu exatamente neste mesmo dia no ano passado?"
Atmos: "Não consigo consultar esse dado histórico com segurança no momento. Prefiro não apresentar informações que não posso verificar."

IMPORTANTE: NÃO recuse informações que estejam disponíveis e possam ser consultadas corretamente (como clima atual de Sorocaba, previsão para os próximos 7 dias, vestimenta, comparações entre a semana passada e esta semana, recordes do mês atual e conceitos científicos de meteorologia). A limitação deve ser aplicada somente quando realmente necessária.

## 6. RECOMENDAÇÕES DE ACORDO COM AS CONDIÇÕES CLIMÁTICAS
O Atmos fornece dicas práticas de vestimenta e preparação relacionadas às condições climáticas atuais de Sorocaba informadas no contexto meteorológico:
- Frio (temperatura ou sensação <= 17 °C): recomendar casacos, blusas de frio, calças e roupas mais quentes.
- Calor (temperatura ou sensação >= 25 °C): sugerir roupas leves, frescas e confortáveis (camiseta, bermuda/saia) e hidratação.
- Clima ameno ou morno (18 °C a 24 °C): recomendar roupas intermediárias (calça leve e camiseta; levar uma blusa leve se esfriar).
- Chuva: sugerir guarda-chuva, capa de chuva e atenção ao sair.
- Vento intenso (> 20 km/h): recomendar atenção ao sair e casaco corta-vento.
- As recomendações devem ser dinâmicas e baseadas EXCLUSIVAMENTE nos dados reais do momento fornecidos no contexto.

## 7. PERGUNTAS CONCEITUAIS E TEÓRICAS (SEM GRÁFICOS)
- Para perguntas conceituais e teóricas (ex.: "O que é umidade do ar?", "O que significa sensação térmica?", "Por que a temperatura diminui durante a noite?", "O que é pressão atmosférica?", "Por que ocorre a formação de nuvens?"):
- Forneça apenas uma explicação textual, clara e objetiva em 1 ou 2 frases.
- NÃO apresente gráficos e não despeje previsões locais para perguntas conceituais.

## 8. RESTRIÇÃO GEOGRÁFICA — ESPECIALISTA EM SOROCABA/SP
- O Atmos é especializado exclusivamente na meteorologia de Sorocaba — SP.
- Forneça previsões, temperaturas e dados meteorológicos somente de Sorocaba.
- Se perguntarem sobre outra cidade, explique educadamente com simpatia que seu foco e especialidade é Sorocaba.
- Apresente isso como uma especialização da plataforma UniAtmos, nunca como falha ou defeito.
"""

# ============================================================
# UTILITÁRIOS DE DETECÇÃO E PROCESSAMENTO
# ============================================================

def normalize_text(value: str) -> str:
    """Normaliza texto para comparações sem acentos e em minúsculas."""
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


def is_greeting(message: str) -> bool:
    """
    Identifica saudações e cumprimentos casuais isolados.
    Se a mensagem contiver uma pergunta meteorológica clara após a saudação,
    não deve ser tratada como cumprimento puro.
    """
    text = normalize_text(message).strip()
    greeting_patterns = [
        r"^(?:oi|ola|opa|e ai|ei)\b",
        r"^(?:bom dia|boa tarde|boa noite)\b",
        r"^(?:tudo bem|como vai|como voce esta|como esta voce)\b",
    ]

    weather_indicators = [
        "vai chover", "temperatura", "previsao", "clima", "tempo",
        "chovendo", "calor", "frio", "vento", "graus", "sensacao",
    ]
    if any(indicator in text for indicator in weather_indicators):
        return False

    return any(re.search(pat, text) for pat in greeting_patterns)


def is_vague_or_incomplete_message(message: str) -> bool:
    """
    Identifica mensagens vagas, incompletas ou sem contexto
    (ex: 'Me fala', 'Me explica', 'Hoje', 'Amanhã', 'Como assim?', 'Quero saber',
    'Pode falar', 'Sobre o clima', 'Temperatura', 'Vai?', 'Agora').
    """
    if is_greeting(message):
        return False

    raw = message.strip()
    norm = normalize_text(raw)
    words = re.findall(r"\b\w+\b", norm)

    # Mensagens vazias ou apenas pontuação (ex: '?', '...', '!')
    if not words:
        return True

    # Expressões vagas exatas conhecidas
    vague_exact_phrases = {
        "me fala",
        "me explica",
        "como assim",
        "quero saber",
        "queria saber",
        "pode falar",
        "sobre o clima",
        "sobre o tempo",
        "do clima",
        "do tempo",
        "sobre a temperatura",
        "da temperatura",
        "sobre a chuva",
        "da chuva",
        "fala ai",
        "fala mais",
        "fala pra mim",
        "me conta",
        "me conte",
        "diz ai",
        "me diz",
        "e agora",
        "e ai",
        "e o clima",
        "e o tempo",
        "o clima",
        "o tempo",
        "a temperatura",
        "a chuva",
        "o vento",
        "me ajuda",
        "ajuda ai",
        "pode me ajudar",
        "preciso de ajuda",
        "saber mais",
        "mais informacoes",
        "informacoes",
        "curiosidade",
        "teste",
        "ok",
        "ta",
        "ta bom",
        "vai",
        "sera",
        "sera que vai",
        "hoje tempo",
        "tempo hoje",
        "clima hoje",
        "hoje clima",
        "chuva hoje",
        "hoje chuva",
        "vento hoje",
        "hoje vento",
        "temperatura hoje",
        "hoje temperatura",
        "tempo agora",
        "agora tempo",
        "clima agora",
        "agora clima",
    }

    if norm in vague_exact_phrases:
        return True

    # Mensagens de 1 palavra única e isolada
    if len(words) == 1:
        vague_single_words = {
            "hoje", "amanha", "ontem", "agora", "depois", "tempo", "clima",
            "chuva", "temperatura", "vento", "sensacao", "frio", "calor",
            "sol", "nuvem", "previsao", "dia", "noite", "tarde", "aqui",
            "sorocaba", "unip", "teste", "chove", "esfria", "esquenta",
            "grau", "graus", "umidade", "pressao", "ar", "ceu", "vai",
            "sera", "fala", "explica", "ajuda", "saber", "olha", "ve",
            "me", "pode", "quero", "queria", "sobre", "assim",
        }
        if words[0] in vague_single_words:
            return True

    # Mensagens de 2 ou 3 palavras que comecem com frases vagas sem pergunta ou termo concreto
    if len(words) <= 3:
        for vp in ["me fala", "me explica", "pode falar", "quero saber", "como assim", "sobre o clima", "sobre o tempo"]:
            if norm.startswith(vp) and len(words) <= len(vp.split()) + 1:
                return True

    return False


def is_unsupported_historical_query(message: str) -> bool:
    """
    Detecta perguntas sobre dados meteorológicos do ano passado ou acumulados
    históricos de chuva que não estão disponíveis com confiabilidade nas fontes integradas.
    """
    text = normalize_text(message)

    unsupported_patterns = [
        r"\bano passado\b",
        r"\bano anterior\b",
        r"\bha (?:um|1) ano\b",
        r"\bmesmo periodo no ano passado\b",
        r"\bmesmo periodo ano passado\b",
        r"\bnesse mesmo periodo no ano passado\b",
        r"\bneste mesmo periodo no ano passado\b",
        r"\bquanto choveu exatamente\b",
        r"\bquanto choveu no ano passado\b",
        r"\bacumulado de chuva (?:do|no) ano passado\b",
        r"\bvolume de chuva (?:do|no) ano passado\b",
        r"\bchoveu quanto no ano passado\b",
        r"\bano retrasado\b",
        r"\bha (?:dois|2|tres|3|cinco|5|dez|10) anos\b",
    ]

    return any(re.search(pat, text) for pat in unsupported_patterns)


def is_conceptual_or_explanatory_question(message: str) -> bool:
    """
    Identifica perguntas teóricas, conceituais ou educacionais sobre meteorologia
    em que NÃO se deve apresentar gráficos (ex.: 'O que é umidade do ar?',
    'O que significa sensação térmica?', 'Por que a temperatura diminui durante a noite?',
    'O que é pressão atmosférica?', 'Por que ocorre a formação de nuvens?').
    """
    text = normalize_text(message)

    conceptual_patterns = [
        r"\bo que e\b",
        r"\bo que sao\b",
        r"\bo que significa\b",
        r"\bo que quer dizer\b",
        r"\bpor que\b",
        r"\bporque\b",
        r"\bqual o motivo\b",
        r"\bqual a razao\b",
        r"\bcomo ocorre(m)?\b",
        r"\bcomo funciona(m)?\b",
        r"\bcomo acontece(m)?\b",
        r"\bcomo se forma(m)?\b",
        r"\bformacao de nuvens\b",
        r"\bqual a diferenca\b",
        r"\bconceito de\b",
        r"\bdefinicao de\b",
        r"\bdefina\b",
        r"\bexplique\b",
        r"\bo que causa(m)?\b",
        r"\bpara que serve(m)?\b",
        r"\bpor que a temperatura diminui\b",
        r"\bpor que ocorre\b",
        r"\bo que e pressao\b",
        r"\bo que e umidade\b",
    ]

    return any(re.search(pat, text) for pat in conceptual_patterns)


def is_clothing_advice_question(message: str) -> bool:
    """
    Identifica perguntas específicas sobre recomendações de vestimenta ou cuidados
    (ex: 'Que roupa devo usar?', 'Devo levar casaco?', 'Preciso de guarda-chuva?').
    """
    text = normalize_text(message)
    clothing_patterns = [
        r"\bque roupa\b",
        r"\bqual roupa\b",
        r"\bo que vestir\b",
        r"\bcomo me vestir\b",
        r"\bdevo levar (?:casaco|blusa|jaqueta|guarda[- ]?chuva|agasalho)\b",
        r"\bpreciso de (?:casaco|blusa|jaqueta|guarda[- ]?chuva|agasalho)\b",
        r"\bpreciso levar (?:casaco|blusa|jaqueta|guarda[- ]?chuva|agasalho)\b",
        r"\blevo (?:casaco|blusa|jaqueta|guarda[- ]?chuva|agasalho)\b",
        r"\bsair de (?:casaco|blusa|bermuda|camiseta)\b",
        r"\bdica de roupa\b",
        r"\bdicas de roupa\b",
        r"\brecomendacao de roupa\b",
    ]
    return any(re.search(pat, text) for pat in clothing_patterns)


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
    if (
        is_absurd_question(message)
        or is_conceptual_or_explanatory_question(message)
        or is_vague_or_incomplete_message(message)
        or is_greeting(message)
        or is_clothing_advice_question(message)
        or is_unsupported_historical_query(message)
    ):
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
        r"\baguaceiro\b",
        r"\bvai chover\b",
        r"\bvai ter chuva\b",
        r"\bchance de chuva\b",
        r"\bprobabilidade de chuva\b",
        r"\bpancada(s)? de chuva\b",
        r"\bvolume de chuva\b",
        r"\bevolucao da chuva\b",
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
        r"\bvariacao da temperatura\b",
        r"\bmais quente\b",
        r"\bmais fri[ao]\b",
        r"\baumentar\b",
        r"\bdiminuir\b",
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
            r"\bcomo esta o clima hoje\b",
            r"\bcomo esta o tempo\b",
            r"\bcondicoes do tempo\b",
            r"\bcondicoes atuais\b",
        ]
        if any(re.search(pat, text) for pat in general_patterns):
            detected.append("general")

    return detected


def detect_chart_topics(message: str) -> list[str]:
    """
    Retorna quais gráficos devem ser oferecidos para a mensagem.
    Regra obrigatória:
    - NÃO exibe gráficos em perguntas conceituais, vagas, saudações, dúvidas de roupa,
      limitações históricas ou sobre outras cidades.
    - Exibe gráficos apenas quando o usuário tiver solicitado claramente informações de previsão/evolução meteorológica.
    """
    if (
        is_absurd_question(message)
        or is_conceptual_or_explanatory_question(message)
        or is_vague_or_incomplete_message(message)
        or is_greeting(message)
        or is_clothing_advice_question(message)
        or is_unsupported_historical_query(message)
        or mentions_another_city(message)
    ):
        return []

    topics = detect_weather_topics(message)
    if "general" in topics:
        return ["temperature", "rain", "wind"]

    chart_supported = ["rain", "temperature", "wind"]
    return [t for t in topics if t in chart_supported]


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


def weather_context(
    weather: dict[str, Any] | None,
    is_vague: bool = False,
    is_greeting_mode: bool = False,
    is_unsupported_historical: bool = False,
) -> str:
    """Formata os dados meteorológicos reais de Sorocaba com rigor e clareza analítica."""
    if is_vague:
        return (
            "DADOS METEOROLÓGICOS DE SOROCABA — SP:\n"
            "[ORIENTAÇÃO OBRIGATÓRIA — MENSAGEM VAGA]: A mensagem enviada pelo usuário é vaga, incompleta ou sem contexto específico. "
            "Você NUNCA deve presumir o que o usuário deseja saber. "
            "REGRA OBRIGATÓRIA: NUNCA apresente previsões, temperaturas, relatórios meteorológicos, recomendações ou gráficos. "
            "Solicite educadamente informações mais concretas, perguntando o que ele gostaria de saber (exemplo: 'Claro! O que você gostaria de saber? Posso explicar alguma condição meteorológica ou ajudar com uma dúvida sobre o clima de Sorocaba.')."
        )

    if is_greeting_mode:
        return (
            "DADOS METEOROLÓGICOS DE SOROCABA — SP:\n"
            "[ORIENTAÇÃO OBRIGATÓRIA — CUMPRIMENTO]: O usuário enviou apenas uma saudação ou cumprimento casual. "
            "Responda com um cumprimento natural, simpático e adequado ao horário em Sorocaba, mantendo a conversa aberta. "
            "REGRA OBRIGATÓRIA: NUNCA apresente previsões, temperaturas, relatórios meteorológicos ou gráficos durante um cumprimento simples. Convide o usuário a perguntar o que deseja saber."
        )

    if is_unsupported_historical:
        return (
            "DADOS METEOROLÓGICOS DE SOROCABA — SP:\n"
            "[ORIENTAÇÃO OBRIGATÓRIA — LIMITAÇÃO DE DADOS HISTÓRICOS]: O usuário perguntou sobre dados meteorológicos do ano passado, acumulados de chuva de datas passadas ou informações que não estão disponíveis com precisão nas APIs integradas. "
            "Responda educadamente explicando sua limitação, de forma similar a: 'Não consigo consultar esse dado histórico com segurança no momento. Prefiro não apresentar informações que não posso verificar.' "
            "NÃO tente adivinhar, inventar números ou dar respostas aproximadas como se fossem reais. NÃO apresente gráficos."
        )

    if not weather:
        return (
            "DADOS METEOROLÓGICOS DE SOROCABA — SP:\n"
            "Aviso: Os sensores em tempo real e a API meteorológica local estão momentaneamente indisponíveis.\n"
            "Se o usuário perguntar sobre as condições imediatas em Sorocaba, informe com simpatia essa indisponibilidade técnica temporária. "
            "Responda a dúvidas gerais ou conceituais normalmente com base no seu conhecimento de especialista."
        )

    current_temp = weather.get("temperature")
    apparent_temp = weather.get("apparentTemperature")
    humidity = weather.get("humidity")
    wind_speed = weather.get("windSpeed")
    condition = weather.get("condition")
    rain_prob = weather.get("rainProbability")
    fetched_at = weather.get("fetchedAt")
    fetched_date = weather.get("fetchedDate")

    # Dicas de vestimenta e cuidados
    clothing = weather.get("clothingRecommendation", {})
    clothing_summary = clothing.get("summary", "")

    # Previsão diária
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

    # Analítica temporal
    analytics = weather.get("analytics", {})
    week_summary = analytics.get("weekComparisonSummary", "Comparação semanal em processamento.")
    trend_summary = analytics.get("temperatureTrendNextDays", "Tendência estável.")

    hottest_month = analytics.get("hottestDayThisMonth")
    coldest_month = analytics.get("coldestDayThisMonth")

    month_records_str = ""
    if hottest_month and coldest_month:
        month_records_str = (
            f"  * Dia mais quente deste mês até agora: {hottest_month.get('day')} ({hottest_month.get('date')}) com máxima de {hottest_month.get('maxTemp')}°C.\n"
            f"  * Dia mais frio deste mês até agora: {coldest_month.get('day')} ({coldest_month.get('date')}) com mínima de {coldest_month.get('minTemp')}°C."
        )

    return (
        f"DADOS METEOROLÓGICOS REAIS DE SOROCABA — SP (Atualizado às {fetched_at} de {fetched_date}):\n"
        f"• Condições Observadas Agora no Campus:\n"
        f"  * Temperatura do ar: {current_temp}°C\n"
        f"  * Sensação térmica: {apparent_temp}°C\n"
        f"  * Umidade relativa do ar: {humidity}%\n"
        f"  * Vento atual: {wind_speed} km/h\n"
        f"  * Condição do céu: {condition}\n"
        f"  * Probabilidade de chuva hoje: {rain_prob}%\n"
        f"• Dicas e Recomendações de Vestimenta Atuais:\n"
        f"  * {clothing_summary}\n"
        f"• Previsão Diária Disponível para Sorocaba:\n"
        f"{forecast_str}\n"
        f"• Analítica e Comparações Meteorológicas ao Longo do Tempo:\n"
        f"  * Comparação Semanal (Semana Passada vs Esta Semana): {week_summary}\n"
        f"  * Tendência dos Próximos Dias: {trend_summary}\n"
        f"{month_records_str}"
    )


def build_messages(
    history: list[dict[str, str]],
    message: str,
    weather: dict[str, Any] | None,
    is_vague: bool = False,
    is_greeting_mode: bool = False,
    is_unsupported_historical: bool = False,
) -> list[dict[str, str]]:
    """Monta a pilha de mensagens com instruções, dados meteorológicos e histórico."""
    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": SYSTEM_INSTRUCTION,
        },
        {
            "role": "system",
            "content": weather_context(
                weather=weather,
                is_vague=is_vague,
                is_greeting_mode=is_greeting_mode,
                is_unsupported_historical=is_unsupported_historical,
            ),
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

                if "model_not_found" in err_str or "model_decommissioned" in err_str or "404" in err_str:
                    break

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

    # 1. Avalia se a mensagem é saudação, vaga ou consulta histórica não suportada
    is_greet = is_greeting(message)
    is_vague = is_vague_or_incomplete_message(message)
    is_unsupported_hist = is_unsupported_historical_query(message)

    # 2. Identificação dos tópicos da pergunta para controle estrito de gráficos
    chart_topics = detect_chart_topics(message)

    # 3. Consulta os dados meteorológicos atuais e previsão de Sorocaba
    weather = await get_weather()

    # 4. Monta a estrutura da conversa
    messages = build_messages(
        history=history,
        message=message,
        weather=weather,
        is_vague=is_vague,
        is_greeting_mode=is_greet,
        is_unsupported_historical=is_unsupported_hist,
    )

    try:
        reply = await call_groq_resilient(messages)

        if not reply:
            reply = (
                "Entendi sua mensagem, mas tive uma oscilação rápida ao processar a resposta. "
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
