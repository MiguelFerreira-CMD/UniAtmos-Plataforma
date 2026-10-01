import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Mic } from "lucide-react";
import { ThemeColors } from "../../components/ui/robot-hero.tsx";

interface AtmosChatProps {
  theme: ThemeColors;
}

export function AtmosChat({ theme }: AtmosChatProps) {
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: "user" | "bot" }>>([
    {
      id: "initial",
      text: "Como posso ajudar com o clima hoje?",
      sender: "bot",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        text: trimmed,
        sender: "user",
      },
    ]);
    setInputText("");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* CONTAINER DO CHAT: COMPACTO, LEVEMENTE AMPLIADO E COM ALTURA RIGOROSAMENTE FIXA */}
      <div
        className="w-full h-[175px] sm:h-[188px] bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.06)] p-3 sm:p-4 flex flex-col justify-between transition-all duration-300"
        style={{
          boxShadow: `0 14px 35px rgba(0, 0, 0, 0.05), 0 0 30px ${theme.glow}`,
        }}
      >
        
        {/* ÁREA DE CONVERSA COM ALTURA FIXA: ROLA APENAS INTERNAMENTE, NUNCA AUMENTA O CHAT */}
        <div className="h-[102px] sm:h-[112px] overflow-y-auto overscroll-contain space-y-2 pr-1.5 py-0.5 scrollbar-thin scrollbar-thumb-zinc-300 hover:scrollbar-thumb-zinc-400 scrollbar-track-transparent">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-zinc-950 text-white rounded-br-xs shadow-2xs"
                    : "bg-zinc-100/95 text-zinc-900 border border-zinc-200/70 rounded-bl-xs shadow-2xs"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* CAMPO DE ENTRADA COMPACTO */}
        <form onSubmit={handleSubmit} className="w-full pt-1">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/90 rounded-xl p-1.5 sm:p-2 focus-within:bg-white focus-within:border-zinc-400 transition-colors">
            {/* Ícone de Microfone */}
            <button
              type="button"
              className="p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-700 bg-white hover:bg-zinc-100 rounded-lg border border-zinc-200/70 transition-colors cursor-pointer shrink-0"
              title="Entrada de áudio"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Input para digitação do usuário */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden"
            />

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-zinc-950 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
            >
              <span>Enviar</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
