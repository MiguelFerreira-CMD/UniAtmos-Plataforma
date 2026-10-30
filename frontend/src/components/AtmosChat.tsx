import { useState, useRef, useEffect, type FormEvent } from "react";

import {
  Send,
  Volume2,
  VolumeX,
  AlertCircle,
  User,
  Bot,
  RotateCcw,
  Copy,
  Check,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { type ThemeColors } from "../../../components/ui/robot-hero.tsx";

interface AtmosChatProps {
  theme: ThemeColors;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onAtmosSpeakingChange?: (isSpeaking: boolean) => void;
}

interface WeatherForecast {
  day?: string;
  condition?: string;
  minTemp?: number | null;
  maxTemp?: number | null;
  rainProbability?: number | null;
}

interface WeatherData {
  temperature?: number | null;
  apparentTemperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  condition?: string;
  fetchedAt?: string;
  forecast?: WeatherForecast[];
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  weather?: WeatherData | null;
  chartTopic?: ChartType | null;
}

interface ApiError {
  detail?: string;
  error?: string;
  message?: string;
}

type ChartType = "temperature" | "rain" | "wind";
type ChartPeriod = "today" | "tomorrow" | "2days" | "3days";

interface ChartDataPoint {
  day: string;
  minTemp?: number;
  maxTemp?: number;
  avgTemp?: number;
  rainProbability?: number;
  windSpeed?: number;
}

const API_URL = "http://localhost:3001";

function cleanMessageText(text: string): string {
  return text
    .replace(/\\([*_\`~[\]()])/g, "$1")
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/\*\*(.*?)\*\*/gs, "$1")
    .replace(/__(.*?)__/gs, "$1")
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\[\s*\\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.;!?])/g, "$1")
    .trim();
}

function normalizeText(text: string): string {
  return cleanMessageText(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[!?.,;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectLocalChartTopic(text: string): ChartType | null {
  const norm = normalizeText(text);

  if (!norm) return null;

  // Não exibe gráficos para perguntas com temperaturas absurdas.
  const temperatureMatches = [
    ...norm.matchAll(
      /(-?\d+(?:[.,]\d+)?)\s*(?:graus?|celsius|°\s*c\b)/gi,
    ),
  ];

  for (const match of temperatureMatches) {
    const value = Number(match[1].replace(",", "."));

    if (value > 55 || value < -50) {
      return null;
    }
  }

  const absurdTemperatureKeywords = [
    "200 graus",
    "100 graus",
    "300 graus",
    "500 graus",
    "200 celsius",
    "100 celsius",
    "300 celsius",
    "500 celsius",
  ];

  if (
    absurdTemperatureKeywords.some((keyword) => norm.includes(keyword)) ||
    /\b(?:canivete|meteoro)\b/.test(norm)
  ) {
    return null;
  }

  // Identifica perguntas diretamente relacionadas à chuva.
  const rainKeywords = [
    "chuva",
    "chuvas",
    "chover",
    "chove",
    "chovendo",
    "choveu",
    "chovera",
    "choveria",
    "chovesse",
    "precipitacao",
    "precipitar",
    "temporal",
    "tempestade",
    "garoa",
    "chuvisco",
    "aguaceiro",
    "guarda chuva",
    "pancada de chuva",
    "probabilidade de chuva",
    "chance de chuva",
    "risco de chuva",
    "volume de chuva",
    "indice pluviometrico",
  ];

  if (
    rainKeywords.some((keyword) => norm.includes(keyword))
  ) {
    return "rain";
  }

  // Identifica perguntas diretamente relacionadas ao vento.
  const windKeywords = [
    "vento",
    "ventos",
    "ventania",
    "ventando",
    "rajada",
    "rajadas",
    "velocidade do vento",
    "forca do vento",
    "brisa",
    "anemometro",
  ];

  if (
    windKeywords.some((keyword) => norm.includes(keyword))
  ) {
    return "wind";
  }

  // Identifica perguntas diretamente relacionadas à temperatura.
  const temperatureKeywords = [
    "temperatura",
    "temperaturas",
    "temperatura atual",
    "temperatura maxima",
    "temperatura minima",
    "temperatura media",
    "sensacao termica",
    "sensacao de calor",
    "sensacao de frio",
    "grau celsius",
    "graus celsius",
    "termometro",
    "termometrica",
    "previsao de temperatura",
    "maxima de temperatura",
    "minima de temperatura",
    "vai esfriar",
    "vai esquentar",
    "esfriar",
    "esquentar",
    "esta quente",
    "esta frio",
    "ta quente",
    "ta frio",
    "muito quente",
    "muito frio",
    "faz calor",
    "faz frio",
    "temperatura vai",
    "quantos graus",
    "quantos celsius",
    "calor intenso",
    "onda de calor",
    "frente fria",
    "queda de temperatura",
    "aumento de temperatura",
    "temperatura negativa",
  ];

  if (
    temperatureKeywords.some((keyword) => norm.includes(keyword))
  ) {
    return "temperature";
  }

  // Permite expressões curtas como "está calor" ou "está frio",
  // sem ativar o gráfico para qualquer ocorrência dessas palavras.
  const temperatureExpressions = [
    /^(?:esta|ta|faz|que)\s+(?:muito\s+)?(?:quente|frio|calor)$/,
    /^(?:e|esta|ta)\s+(?:um\s+)?(?:calor|frio|quente)$/,
    /^(?:qual|quais)\s+(?:a|as)\s+temperaturas?\b/,
    /^como esta a temperatura\b/,
    /^como esta o calor\b/,
    /^como esta o frio\b/,
  ];

  if (
    temperatureExpressions.some((pattern) => pattern.test(norm))
  ) {
    return "temperature";
  }

  // Nenhum gráfico para assuntos que não correspondam às categorias.
  return null;
}

function getChartData(
  weather: WeatherData,
  period: ChartPeriod,
): ChartDataPoint[] {
  const forecasts = Array.isArray(weather.forecast)
    ? weather.forecast
    : [];

  const selectedForecasts =
    period === "tomorrow"
      ? forecasts.slice(1, 2)
      : forecasts.slice(
          0,
          period === "today" ? 1 : period === "2days" ? 2 : 3,
        );

  return selectedForecasts.map((forecast, index) => {
    const point: ChartDataPoint = {
      day: forecast.day ?? `Dia ${index + 1}`,
    };

    if (typeof forecast.minTemp === "number") {
      point.minTemp = forecast.minTemp;
    }

    if (typeof forecast.maxTemp === "number") {
      point.maxTemp = forecast.maxTemp;
    }

    if (
      typeof forecast.minTemp === "number" &&
      typeof forecast.maxTemp === "number"
    ) {
      point.avgTemp = Number(
        ((forecast.minTemp + forecast.maxTemp) / 2).toFixed(1),
      );
    }

    if (typeof forecast.rainProbability === "number") {
      point.rainProbability = forecast.rainProbability;
    }

    return point;
  });
}

export function AtmosChat({
  theme,
  isExpanded: externalIsExpanded,
  onExpandedChange,
  onAtmosSpeakingChange,
}: AtmosChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      text: "Como posso ajudar com o clima hoje?",
      sender: "bot",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [openChartMessageId, setOpenChartMessageId] = useState<string | null>(
    null,
  );
  const [messageChartTypes, setMessageChartTypes] = useState<
    Record<string, ChartType>
  >({});
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("3days");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const maxRecordingTimerRef = useRef<number | null>(null);
  const baseTextRef = useRef<string>("");

  const isChatExpanded =
    externalIsExpanded !== undefined
      ? externalIsExpanded
      : messages.length > 1;

  useEffect(() => {
    onExpandedChange?.(messages.length > 1);
  }, [messages.length, onExpandedChange]);

  useEffect(() => {
    onAtmosSpeakingChange?.(isLoading || speakingMessageId !== null);
  }, [isLoading, speakingMessageId, onAtmosSpeakingChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, openChartMessageId]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      cleanupRecording();
    };
  }, []);

  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(cleanMessageText(text));

      setCopiedMessageId(msgId);
      setFeedback(null);

      window.setTimeout(() => {
        if (!isMountedRef.current) return;

        setCopiedMessageId((current) =>
          current === msgId ? null : current,
        );
      }, 1800);
    } catch (error) {
      console.error("Erro ao copiar mensagem:", error);

      setFeedback(
        "Não foi possível copiar a mensagem. Verifique as permissões do navegador.",
      );
    }
  };

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();

    if (!trimmed || isLoading) return;

    const history = messages
      .filter((msg) => msg.id !== "initial")
      .slice(-20)
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        text: msg.text,
      }));

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        text: trimmed,
        sender: "user",
      },
    ]);

    setInputText("");
    setIsLoading(true);
    setFeedback(null);

    cleanupRecording();

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        weather?: WeatherData | null;
        chartTopic?: ChartType | null;
      } & ApiError;

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            data.message ||
            `Falha ao consultar o Atmos (${response.status}).`,
        );
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("O servidor retornou uma resposta inválida.");
      }

      const cleanReply = cleanMessageText(data.reply);

      if (!cleanReply) {
        throw new Error("O Atmos retornou uma mensagem vazia.");
      }

      if (!isMountedRef.current) return;

      // O assunto do gráfico é definido exclusivamente pela pergunta original.
      // O backend não pode forçar gráficos em respostas sem relação com o tema.
      const topic = detectLocalChartTopic(trimmed);

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          text: cleanReply,
          sender: "bot",
          weather: topic ? (data.weather ?? null) : null,
          chartTopic: topic,
        },
      ]);
    } catch (error) {
      console.error("Erro ao conversar com o Atmos:", error);

      if (!isMountedRef.current) return;

      let errorMessage =
        "Não consegui responder agora. Verifique se o backend Python está funcionando e tente novamente.";

      if (error instanceof TypeError) {
        errorMessage =
          "Não foi possível conectar ao backend do Atmos na porta 3001. Verifique se o servidor Python está ligado.";
      } else if (error instanceof Error) {
        const normalizedError = error.message.toLowerCase();

        if (
          normalizedError.includes("429") ||
          normalizedError.includes("resource_exhausted") ||
          normalizedError.includes("muitas solicitações") ||
          normalizedError.includes("limite de solicitações")
        ) {
          errorMessage =
            "Estou recebendo muitas solicitações neste momento. Tente novamente mais tarde.";
        } else {
          errorMessage = error.message;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: errorMessage,
          sender: "bot",
        },
      ]);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void sendMessage(inputText);
  };

  const cleanupRecording = () => {
    if (maxRecordingTimerRef.current !== null) {
      window.clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      mediaStreamRef.current = null;
    }

    if (isMountedRef.current) {
      setIsRecording(false);
    }
  };

  const handleResetChat = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    cleanupRecording();

    setSpeakingMessageId(null);
    setCopiedMessageId(null);
    setOpenChartMessageId(null);
    setMessageChartTypes({});
    setChartPeriod("3days");

    setMessages([
      {
        id: "initial",
        text: "Como posso ajudar com o clima hoje?",
        sender: "bot",
      },
    ]);

    setInputText("");
    setFeedback(null);
    onExpandedChange?.(false);
  };

  const toggleRecording = async () => {
    if (isLoading || isTranscribing) return;

    if (isRecording) {
      if (maxRecordingTimerRef.current !== null) {
        window.clearTimeout(maxRecordingTimerRef.current);
        maxRecordingTimerRef.current = null;
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        try {
          mediaRecorderRef.current.requestData();
        } catch {
          // ignore
        }
        mediaRecorderRef.current.stop();
      }
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setFeedback(
        "O microfone não é suportado pelo seu navegador ou a página precisa ser acessada via HTTPS / localhost.",
      );
      return;
    }

    try {
      baseTextRef.current = inputText;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      mediaStreamRef.current = stream;

      let mimeType = "";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/aac")) {
          mimeType = "audio/aac";
        }
      }

      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: 128000,
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      const recorder = new MediaRecorder(stream, recorderOptions);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        if (maxRecordingTimerRef.current !== null) {
          window.clearTimeout(maxRecordingTimerRef.current);
          maxRecordingTimerRef.current = null;
        }

        if (!isMountedRef.current) return;
        setIsRecording(false);

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) return;

        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        if (blob.size < 500) return;

        setIsTranscribing(true);
        setFeedback(null);

        try {
          const formData = new FormData();
          const ext = mimeType.includes("mp4") ? "mp4" : "webm";
          formData.append("file", blob, `voice.${ext}`);

          const response = await fetch(`${API_URL}/api/transcribe`, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(
              errData.error || "Não foi possível transcrever a fala.",
            );
          }

          const data = await response.json();
          const transcribedText = (data.text || "").trim();

          if (transcribedText && isMountedRef.current) {
            const base = baseTextRef.current.trim();
            setInputText(base ? `${base} ${transcribedText}` : transcribedText);
          }
        } catch (error) {
          console.error("Erro na transcrição de áudio:", error);
          if (isMountedRef.current) {
            const msg =
              error instanceof Error
                ? error.message
                : "Não foi possível transcrever a gravação de voz. Tente novamente.";
            setFeedback(msg);
          }
        } finally {
          if (isMountedRef.current) {
            setIsTranscribing(false);
            inputRef.current?.focus();
          }
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setFeedback(null);

      maxRecordingTimerRef.current = window.setTimeout(() => {
        if (recorder.state === "recording") {
          try {
            recorder.requestData();
          } catch {
            // ignore
          }
          recorder.stop();
        }
      }, 60000);
    } catch (err: unknown) {
      console.warn("Erro ao iniciar captura de microfone:", err);
      setIsRecording(false);
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;

      if (
        err instanceof DOMException &&
        (err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError")
      ) {
        setFeedback(
          "Permissão de microfone negada. Autorize o microfone nas permissões do site para ditar.",
        );
      } else if (
        err instanceof DOMException &&
        err.name === "NotFoundError"
      ) {
        setFeedback("Nenhum microfone encontrado ou conectado ao dispositivo.");
      } else {
        setFeedback("Não foi possível acessar o microfone.");
      }
    }
  };

  const handleSpeakReply = (msgId: string, text: string) => {
    if (!("speechSynthesis" in window)) {
      setFeedback("A leitura em voz alta não é suportada neste navegador.");
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanMessageText(text));

    utterance.lang = "pt-BR";
    utterance.rate = 1.05;

    utterance.onend = () => {
      if (!isMountedRef.current) return;
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      if (!isMountedRef.current) return;
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full">
      <div
        className={`w-full bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/95 p-4 sm:p-6 flex flex-col justify-between transition-all duration-500 ease-out shadow-[0_16px_40px_rgba(0,0,0,0.06)] ${
          isChatExpanded
            ? "min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] max-h-[78vh]"
            : "min-h-[175px] sm:min-h-[190px]"
        }`}
        style={{
          boxShadow: `0 16px 40px rgba(0, 0, 0, 0.06), 0 0 35px ${theme.glow}`,
        }}
      >
        {isChatExpanded && (
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-zinc-800">ATMOS</span>
            </div>

            <button
              type="button"
              onClick={handleResetChat}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              title="Iniciar nova conversa"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Nova conversa</span>
            </button>
          </div>
        )}

        <div
          className={`overflow-y-auto overscroll-contain space-y-3.5 pr-1.5 py-1 scrollbar-thin scrollbar-thumb-zinc-300 hover:scrollbar-thumb-zinc-400 scrollbar-track-transparent transition-all duration-500 ${
            isChatExpanded
              ? "flex-1 min-h-[300px] max-h-[calc(78vh-110px)]"
              : "h-[96px] sm:h-[108px]"
          }`}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 sm:gap-3 w-full animate-in fade-in duration-300 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "bot" && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 border shadow-sm"
                  style={{
                    backgroundColor: `${theme.primary}18`,
                    borderColor: `${theme.primary}65`,
                    color: theme.primary,
                  }}
                  title="Atmos"
                  aria-label="Ícone do Atmos"
                >
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`flex flex-col ${
                  msg.sender === "user"
                    ? "items-end max-w-[85%] sm:max-w-[78%]"
                    : "items-start max-w-[85%] sm:max-w-[78%]"
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
                    msg.sender === "user"
                      ? "bg-sky-100 text-sky-950 border border-sky-200 rounded-tr-xs"
                      : "bg-white text-zinc-800 border border-zinc-200 rounded-tl-xs"
                  }`}
                >
                  {cleanMessageText(msg.text)}
                </div>

                {msg.sender === "bot" && msg.weather && msg.chartTopic && (
                  <div className="mt-2 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenChartMessageId((current) => {
                          if (current === msg.id) return null;

                          if (
                            !messageChartTypes[msg.id] &&
                            msg.chartTopic
                          ) {
                            setMessageChartTypes((prev) => ({
                              ...prev,
                              [msg.id]: msg.chartTopic!,
                            }));
                          }

                          return msg.id;
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 cursor-pointer"
                      aria-expanded={openChartMessageId === msg.id}
                    >
                      📊{" "}
                      {openChartMessageId === msg.id
                        ? "Fechar gráfico"
                        : "Visualizar gráfico"}
                    </button>

                    {openChartMessageId === msg.id &&
                      (() => {
                        const currentChartType =
                          messageChartTypes[msg.id] ??
                          msg.chartTopic ??
                          "temperature";

                        const weather = msg.weather!;
                        const chartData = getChartData(weather, chartPeriod);

                        const hasTemperatureData = chartData.some(
                          (point) =>
                            typeof point.minTemp === "number" ||
                            typeof point.maxTemp === "number",
                        );

                        const hasRainData = chartData.some(
                          (point) =>
                            typeof point.rainProbability === "number",
                        );

                        const hasWindData =
                          typeof weather.windSpeed === "number";

                        const hasData =
                          currentChartType === "temperature"
                            ? hasTemperatureData
                            : currentChartType === "rain"
                              ? hasRainData
                              : hasWindData;

                        return (
                          <div className="mt-2 w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-3">
                            <div className="mb-3 flex flex-wrap gap-2">
                              <select
                                value={currentChartType}
                                onChange={(e) => {
                                  const newType = e.target.value as ChartType;
                                  setMessageChartTypes((prev) => ({
                                    ...prev,
                                    [msg.id]: newType,
                                  }));
                                }}
                                className="max-w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 font-medium"
                                aria-label="Tipo de gráfico"
                              >
                                <option value="rain">
                                  Probabilidade de chuva
                                </option>
                                <option value="temperature">
                                  Temperatura
                                </option>
                                <option value="wind">Vento atual</option>
                              </select>

                              {currentChartType !== "wind" && (
                                <select
                                  value={chartPeriod}
                                  onChange={(e) =>
                                    setChartPeriod(
                                      e.target.value as ChartPeriod,
                                    )
                                  }
                                  className="max-w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 font-medium"
                                  aria-label="Período da previsão"
                                >
                                  <option value="today">Hoje</option>
                                  <option value="tomorrow">Amanhã</option>
                                  <option value="2days">2 dias</option>
                                  <option value="3days">3 dias</option>
                                </select>
                              )}
                            </div>

                            {!hasData ? (
                              <p className="py-8 text-center text-xs text-zinc-500">
                                Não há dados reais disponíveis para este
                                gráfico no momento.
                              </p>
                            ) : (
                              <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  {currentChartType === "temperature" ? (
                                    <LineChart
                                      data={chartData}
                                      margin={{
                                        top: 18,
                                        right: 12,
                                        left: 4,
                                        bottom: 4,
                                      }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" />

                                      <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 11 }}
                                      />

                                      <YAxis
                                        unit=" °C"
                                        tick={{ fontSize: 11 }}
                                        width={55}
                                      />

                                      <Tooltip
                                        formatter={(value, name) => [
                                          `${value} °C`,
                                          name,
                                        ]}
                                      />

                                      <Legend />

                                      <Line
                                        type="monotone"
                                        dataKey="maxTemp"
                                        name="Máxima"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        connectNulls={false}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                        label={{
                                          position: "top",
                                          formatter: (value: number) =>
                                            `${value}°`,
                                          fontSize: 10,
                                        }}
                                      />

                                      <Line
                                        type="monotone"
                                        dataKey="minTemp"
                                        name="Mínima"
                                        stroke="#0284c7"
                                        strokeWidth={2}
                                        connectNulls={false}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                        label={{
                                          position: "bottom",
                                          formatter: (value: number) =>
                                            `${value}°`,
                                          fontSize: 10,
                                        }}
                                      />

                                      <Line
                                        type="monotone"
                                        dataKey="avgTemp"
                                        name="Média estimada"
                                        stroke="#8b5cf6"
                                        strokeDasharray="5 4"
                                        connectNulls={false}
                                        dot={false}
                                      />
                                    </LineChart>
                                  ) : currentChartType === "rain" ? (
                                    <BarChart
                                      data={chartData}
                                      margin={{
                                        top: 22,
                                        right: 12,
                                        left: 4,
                                        bottom: 4,
                                      }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" />

                                      <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 11 }}
                                      />

                                      <YAxis
                                        domain={[0, 100]}
                                        unit="%"
                                        tick={{ fontSize: 11 }}
                                        width={45}
                                      />

                                      <Tooltip
                                        formatter={(value) => [
                                          `${value}%`,
                                          "Probabilidade de chuva",
                                        ]}
                                      />

                                      <Bar
                                        dataKey="rainProbability"
                                        name="Probabilidade de chuva"
                                        fill="#0284c7"
                                        radius={[5, 5, 0, 0]}
                                        label={{
                                          position: "top",
                                          formatter: (value: number) =>
                                            `${value}%`,
                                          fontSize: 11,
                                          fill: "#0369a1",
                                        }}
                                      />
                                    </BarChart>
                                  ) : (
                                    <BarChart
                                      data={[
                                        {
                                          day: "Agora",
                                          windSpeed: weather.windSpeed!,
                                        },
                                      ]}
                                      margin={{
                                        top: 22,
                                        right: 12,
                                        left: 4,
                                        bottom: 4,
                                      }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" />

                                      <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 11 }}
                                      />

                                      <YAxis
                                        unit=" km/h"
                                        tick={{ fontSize: 11 }}
                                        width={60}
                                      />

                                      <Tooltip
                                        formatter={(value) => [
                                          `${value} km/h`,
                                          "Vento atual",
                                        ]}
                                      />

                                      <Bar
                                        dataKey="windSpeed"
                                        name="Vento atual"
                                        fill="#6366f1"
                                        radius={[5, 5, 0, 0]}
                                        label={{
                                          position: "top",
                                          formatter: (value: number) =>
                                            `${value} km/h`,
                                          fontSize: 11,
                                          fill: "#4f46e5",
                                        }}
                                      />
                                    </BarChart>
                                  )}
                                </ResponsiveContainer>
                              </div>
                            )}

                            {currentChartType === "temperature" && (
                              <p className="mt-2 text-[11px] text-zinc-500">
                                A média estimada é calculada entre as
                                temperaturas mínima e máxima; não representa
                                uma medição independente.
                              </p>
                            )}

                            {currentChartType === "wind" && (
                              <p className="mt-2 text-[11px] text-zinc-500">
                                Este gráfico apresenta a velocidade atual do
                                vento. A previsão diária de vento não está
                                disponível nos dados utilizados aqui.
                              </p>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                )}

                <div
                  className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void handleCopyMessage(msg.id, msg.text)}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                    title={
                      copiedMessageId === msg.id
                        ? "Mensagem copiada"
                        : "Copiar mensagem"
                    }
                    aria-label={
                      copiedMessageId === msg.id
                        ? "Mensagem copiada"
                        : "Copiar mensagem"
                    }
                  >
                    {copiedMessageId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">
                          Copiado!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {msg.sender === "bot" && (
                    <button
                      type="button"
                      onClick={() => handleSpeakReply(msg.id, msg.text)}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                      title={
                        speakingMessageId === msg.id
                          ? "Parar leitura"
                          : "Ouvir resposta"
                      }
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-sky-700" />
                          <span className="text-sky-800 font-semibold">
                            Parar leitura
                          </span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Ouvir</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === "user" && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-sky-100 border border-sky-200 text-sky-800 shadow-sm"
                  title="Você"
                  aria-label="Ícone do usuário"
                >
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2.5 sm:gap-3 justify-start animate-in fade-in">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border shadow-sm"
                style={{
                  backgroundColor: `${theme.primary}18`,
                  borderColor: `${theme.primary}65`,
                  color: theme.primary,
                }}
              >
                <Bot className="w-5 h-5" />
              </div>

              <div className="rounded-2xl rounded-tl-xs bg-white border border-zinc-200 px-4 py-2.5 text-xs text-zinc-600 flex items-center gap-2 shadow-sm">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: theme.primary }}
                />
                <span>Atmos está pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {feedback && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 my-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium break-words">{feedback}</span>
            </div>

            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-amber-700 hover:text-amber-950 p-0.5 cursor-pointer"
              title="Fechar aviso"
              aria-label="Fechar aviso"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full pt-1.5">
          <div className="flex items-center gap-2 rounded-xl p-1.5 sm:p-2 bg-zinc-50 border border-zinc-200/90 focus-within:bg-white focus-within:border-zinc-400 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite sua mensagem para o Atmos..."
              aria-label="Mensagem para o Atmos"
              className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
              disabled={isLoading}
            />

            <div className="relative inline-flex items-center group/mic shrink-0">
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isLoading || isTranscribing}
                aria-label={
                  isTranscribing
                    ? "Transcrevendo fala..."
                    : isRecording
                      ? "Gravando voz... Clique para concluir e transcrever"
                      : "Ditar mensagem por voz"
                }
                aria-pressed={isRecording}
                className={`p-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isRecording
                    ? "bg-red-50 text-red-600 border border-red-200 ring-2 ring-red-400/30 animate-pulse"
                    : isTranscribing
                      ? "bg-sky-50 text-sky-600 border border-sky-200 animate-pulse"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70"
                }`}
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-4 h-4 text-red-600" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              <div
                role="tooltip"
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-30 transition-all duration-200 ease-out opacity-0 translate-y-1 group-hover/mic:opacity-100 group-hover/mic:translate-y-0"
              >
                <div className="bg-zinc-900 text-white text-[11px] font-medium py-1 px-2.5 rounded-md shadow-md whitespace-nowrap flex items-center gap-1.5">
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-sky-300" />
                      <span>Transcrevendo...</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                      <span>Gravando... Clique para concluir</span>
                    </>
                  ) : (
                    <span>Ditar</span>
                  )}
                </div>
                <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-900 mx-auto" />
              </div>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-3.5 sm:px-4 py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
            >
              <span>{isLoading ? "Enviando..." : "Enviar"}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AtmosChat;