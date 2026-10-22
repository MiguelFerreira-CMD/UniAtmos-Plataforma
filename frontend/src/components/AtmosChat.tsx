
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
} from "lucide-react";

import { type ThemeColors } from "../../../components/ui/robot-hero.tsx";

interface AtmosChatProps {
  theme: ThemeColors;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onAtmosSpeakingChange?: (isSpeaking: boolean) => void;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
}

interface ApiError {
  detail?: string;
  error?: string;
  message?: string;
}

const API_URL = "http://localhost:3001";

function cleanMessageText(text: string): string {
  return text
    .replace(/\\([*_`~[\]()])/g, "$1")
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/\*\*(.*?)\*\*/gs, "$1")
    .replace(/__(.*?)__/gs, "$1")
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[\s*\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.;!?])/g, "$1")
    .trim();
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
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

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
  }, [messages, isLoading]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
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

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          text: cleanReply,
          sender: "bot",
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

  const handleResetChat = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setSpeakingMessageId(null);
    setCopiedMessageId(null);

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

                <div
                  className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 ${
                    msg.sender === "user"
                      ? "justify-end"
                      : "justify-start"
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
