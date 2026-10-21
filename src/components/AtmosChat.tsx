import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  Send,
  Mic,
  Square,
  Volume2,
  VolumeX,
  AlertCircle,
  User,
  Bot,
  RotateCcw,
  X,
} from "lucide-react";
import { ThemeColors } from "../../components/ui/robot-hero.tsx";

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
  const [isListening, setIsListening] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  const isChatExpanded =
    externalIsExpanded !== undefined
      ? externalIsExpanded
      : messages.length > 1;

  // Notifica o componente pai sobre a expansão do chat.
  useEffect(() => {
    const expanded = messages.length > 1;
    onExpandedChange?.(expanded);
  }, [messages.length, onExpandedChange]);

  // Notifica o componente pai sobre o robô falar ou pensar.
  useEffect(() => {
    const isSpeaking = isLoading || speakingMessageId !== null;
    onAtmosSpeakingChange?.(isSpeaking);
  }, [isLoading, speakingMessageId, onAtmosSpeakingChange]);

  // Rola para a mensagem mais recente.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Limpeza do reconhecimento de voz e da síntese de fala ao desmontar.
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Envio de mensagem para a API do Atmos.
  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();

    if (!trimmed || isLoading) return;

    const history = messages
      .filter((msg) => msg.id !== "initial")
      .map((msg) => ({
        role: (msg.sender === "user" ? "user" : "model") as
          | "user"
          | "model",
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
    setAudioFeedback(null);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
      });

      // Tenta ler a resposta JSON do servidor.
      const data = await response.json();

      // Converte erros HTTP em mensagens que o catch consegue tratar.
      if (!response.ok) {
        throw new Error(
          data.error || "Falha ao consultar o Atmos."
        );
      }

      if (
        typeof data.reply !== "string" ||
        !data.reply.trim()
      ) {
        throw new Error(
          "O servidor retornou uma resposta inválida."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          text: data.reply,
          sender: "bot",
        },
      ]);
    } catch (error) {
      console.error("Erro ao conversar com o Atmos:", error);

      let errorMessage =
        "Não consegui responder agora. Verifique se o servidor do Atmos está funcionando e tente novamente.";

      if (error instanceof Error) {
        const normalizedError = error.message.toLowerCase();

        // Trata o limite de solicitações da API do Gemini.
        if (
          normalizedError.includes("429") ||
          normalizedError.includes("resource_exhausted") ||
          normalizedError.includes("muitas solicitações") ||
          normalizedError.includes("limite de solicitações")
        ) {
          errorMessage =
            "Estou recebendo muitas solicitações neste momento. 🌤️ Tente novamente mais tarde.";
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
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}

      setIsListening(false);
    }

    sendMessage(inputText);
  };

  // Reconhecimento de voz: captura a fala e preenche o campo sem envio automático.
  const handleToggleVoice = () => {
    if (isLoading) return;

    // Se já estiver gravando, encerra e mantém o texto no campo.
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }

      setIsListening(false);
      setAudioFeedback(
        "Gravação finalizada. Revise a mensagem e clique em Enviar."
      );
      inputRef.current?.focus();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAudioFeedback(
        "Seu navegador não oferece suporte nativo ao reconhecimento de voz. Tente usar o Google Chrome ou Microsoft Edge."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      finalTranscriptRef.current = "";
      setAudioFeedback("Gravando áudio... Fale sua pergunta.");

      recognition.onstart = () => {
        setIsListening(true);
        setAudioFeedback("Gravando áudio... Fale sua pergunta.");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (
          let i = event.resultIndex;
          i < event.results.length;
          ++i
        ) {
          const item = event.results[i];

          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const currentText = (final || interim).trim();

        if (currentText) {
          finalTranscriptRef.current = currentText;
          setInputText(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);

        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          setAudioFeedback(
            "Permissão de microfone negada. Permita o acesso ao microfone no navegador."
          );
        } else if (event.error === "no-speech") {
          setAudioFeedback(
            "Nenhuma fala detectada. Clique no microfone para tentar novamente."
          );
        } else if (event.error === "audio-capture") {
          setAudioFeedback(
            "Nenhum microfone encontrado ou está indisponível."
          );
        } else if (event.error === "network") {
          setAudioFeedback(
            "Erro de rede no serviço de reconhecimento de voz."
          );
        } else {
          setAudioFeedback(
            "Não foi possível reconhecer a voz. Tente falar novamente."
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);

        const textCaptured = finalTranscriptRef.current.trim();

        if (textCaptured) {
          setInputText(textCaptured);
          setAudioFeedback(
            "Áudio transcrito com sucesso. Clique em Enviar quando desejar."
          );
          inputRef.current?.focus();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Erro ao iniciar microfone:", err);

      setIsListening(false);
      setAudioFeedback(
        "Erro ao ativar o microfone. Verifique suas permissões."
      );
    }
  };

  // Cancela a gravação e descarta o texto capturado.
  const handleCancelVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }

    finalTranscriptRef.current = "";
    setIsListening(false);
    setAudioFeedback(null);
  };

  // Reinicia a conversa para o estado inicial.
  const handleResetChat = () => {
    if (
      speakingMessageId &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }

    setMessages([
      {
        id: "initial",
        text: "Como posso ajudar com o clima hoje?",
        sender: "bot",
      },
    ]);

    setInputText("");
    setAudioFeedback(null);
    onExpandedChange?.(false);
  };

  // Leitura da resposta em áudio.
  const handleSpeakReply = (msgId: string, text: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "pt-BR";
    utterance.rate = 1.05;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

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
        {/* Cabeçalho do chat */}
        {isChatExpanded && (
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-zinc-800">
                Conversa com Atmos
              </span>
              <span className="text-[11px] text-zinc-400">
                UNIP Sorocaba
              </span>
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

        {/* Lista de mensagens com avatares e rolagem */}
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
                msg.sender === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {/* Avatar do Atmos */}
              {msg.sender === "bot" && (
                <div
                  className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-2xs border relative mt-0.5"
                  style={{ borderColor: `${theme.primary}50` }}
                  title="Atmos"
                >
                  <Bot
                    className="w-4 h-4"
                    style={{ color: theme.primary }}
                  />
                  <span
                    className="absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-zinc-950"
                    style={{ backgroundColor: theme.primary }}
                  />
                </div>
              )}

              {/* Conteúdo da mensagem */}
              <div
                className={`flex flex-col ${
                  msg.sender === "user"
                    ? "items-end max-w-[85%] sm:max-w-[78%]"
                    : "items-start max-w-[85%] sm:max-w-[78%]"
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-2xs ${
                    msg.sender === "user"
                      ? "bg-zinc-950 text-white rounded-tr-xs"
                      : "bg-zinc-100/95 text-zinc-900 border border-zinc-200/70 rounded-tl-xs"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Opção para ouvir a resposta do Atmos */}
                {msg.sender === "bot" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSpeakReply(msg.id, msg.text)
                    }
                    className="mt-1 ml-1 inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                    title={
                      speakingMessageId === msg.id
                        ? "Parar leitura"
                        : "Ouvir resposta"
                    }
                  >
                    {speakingMessageId === msg.id ? (
                      <>
                        <VolumeX className="w-3 h-3 text-zinc-800" />
                        <span className="text-zinc-800 font-semibold">
                          Parar áudio
                        </span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Ouvir</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Avatar do usuário */}
              {msg.sender === "user" && (
                <div
                  className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-2xs border border-zinc-800 mt-0.5"
                  title="Você"
                >
                  <User className="w-4 h-4 text-zinc-200" />
                </div>
              )}
            </div>
          ))}

          {/* Indicador de pensamento/resposta */}
          {isLoading && (
            <div className="flex items-start gap-2.5 sm:gap-3 justify-start animate-in fade-in">
              <div
                className="w-8 h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-2xs border relative"
                style={{ borderColor: `${theme.primary}50` }}
              >
                <Bot
                  className="w-4 h-4"
                  style={{ color: theme.primary }}
                />
              </div>

              <div className="rounded-2xl rounded-tl-xs bg-zinc-100 border border-zinc-200/70 px-4 py-2 text-xs text-zinc-500 flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
                <span>Atmos está pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Feedback de voz/erro de áudio */}
        {audioFeedback && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 my-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 animate-in fade-in">
            <div className="flex items-center gap-2 truncate">
              {isListening ? (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}

              <span className="truncate font-medium">
                {audioFeedback}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isListening && (
                <button
                  type="button"
                  onClick={handleCancelVoice}
                  className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}

              <button
                type="button"
                onClick={() => setAudioFeedback(null)}
                className="text-amber-600 hover:text-amber-950 p-0.5 cursor-pointer"
                title="Fechar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Formulário de entrada */}
        <form onSubmit={handleSubmit} className="w-full pt-1.5">
          <div
            className={`flex items-center gap-2 rounded-xl p-1.5 sm:p-2 transition-all ${
              isListening
                ? "bg-rose-50/80 border-2 border-rose-500 shadow-sm"
                : "bg-zinc-50 border border-zinc-200/90 focus-within:bg-white focus-within:border-zinc-400"
            }`}
          >
            {/* Botão de microfone */}
            <button
              type="button"
              onClick={handleToggleVoice}
              disabled={isLoading}
              className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer shrink-0 ${
                isListening
                  ? "bg-rose-600 text-white shadow-sm animate-pulse ring-2 ring-rose-300"
                  : "text-zinc-500 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200/70"
              }`}
              title={
                isListening
                  ? "Finalizar gravação e manter texto"
                  : "Falar pelo microfone para preencher o texto"
              }
              aria-label={
                isListening
                  ? "Parar gravação"
                  : "Ativar microfone"
              }
            >
              {isListening ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? "Gravando sua fala... Fale agora."
                  : "Digite sua mensagem para o Atmos..."
              }
              aria-label="Mensagem para o Atmos"
              className="flex-1 min-w-0 bg-transparent px-2 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            >
              <span>{isLoading ? "Enviando..." : "Enviar"}</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AtmosChat;