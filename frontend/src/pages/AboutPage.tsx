import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ThemeColors } from "../../components/ui/robot-hero.tsx";

interface AboutPageProps {
  theme: ThemeColors;
  onNavigateHome: () => void;
}

export function AboutPage({ theme, onNavigateHome }: AboutPageProps) {
  // Sempre inicia com o primeiro card (índice 0) aberto ao entrar na aba
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const sections = [
    {
      title: "O que é o UniAtmos?",
      icon: (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
        </>
      ),
      content: (
        <>
          <p>
            O UniAtmos é uma iniciativa que ajuda estudantes da UNIP Sorocaba
            a se prepararem para as condições climáticas antes de irem à faculdade.
          </p>
          <p>
            Seu assistente, o Atmos, é um chatbot que responde dúvidas sobre
            o clima na região do campus, ajudando principalmente quem mora
            mais longe a planejar o dia.
          </p>
        </>
      ),
    },
    {
      title: "Como funciona?",
      icon: (
        <>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
        </>
      ),
      content: (
        <>
          <p>
            Você faz uma pergunta ao Atmos e ele consulta dados meteorológicos
            atualizados da região do campus para responder.
          </p>
          <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2">
            <li>“Qual roupa devo usar hoje para ir à faculdade?”</li>
            <li>“Como está o clima na região da UNIP Sorocaba?”</li>
            <li>“Vai chover hoje durante o horário da minha aula?”</li>
          </ul>
        </>
      ),
    },
    {
      title: "Tecnologias Utilizadas",
      icon: (
        <>
          <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
        </>
      ),
      content: (
        <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2">
          <li><strong>React e TypeScript</strong> — desenvolvimento do frontend.</li>
          <li><strong>Python e FastAPI</strong> — desenvolvimento do backend.</li>
          <li><strong>Arduino</strong> — coleta de dados meteorológicos por sensores.</li>
          <li><strong>API Open-Meteo</strong> — fornecimento dos dados meteorológicos.</li>
          <li><strong>API Groq</strong> — funcionamento da inteligência do chatbot.</li>
        </ul>
      ),
    },
    {
      title: "Nosso propósito",
      icon: (
        <>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </>
      ),
      content: (
        <p>
          Ajudar você a se preparar melhor para sair de casa, oferecendo
          informações meteorológicas para tornar seu trajeto até a faculdade
          mais seguro e tranquilo.
        </p>
      ),
    },
  ];

  const handleToggle = (index: number) => {
    // Se o usuário clicar no mesmo já aberto, fecha; se clicar em outro, abre ele e fecha o anterior
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-16 sm:pb-24 flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-300">

      <div className="flex items-center">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-950 bg-white/80 hover:bg-white rounded-xl border border-zinc-200/80 shadow-2xs transition-all cursor-pointer group"
          style={{ boxShadow: `0 4px 18px ${theme.glow}` }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Voltar ao início</span>
        </button>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-950 tracking-tight mb-4 sm:mb-6">
          Conheça o UniAtmos
        </h1>

        <div className="flex flex-col gap-3.5 sm:gap-4">
          {sections.map((section, index) => {
            const isOpen = openIndex === index;

            return (
              <details
                key={section.title}
                open={isOpen}
                className="group rounded-2xl border border-zinc-200/90 bg-white/85 backdrop-blur-xs shadow-xs hover:border-zinc-300 transition-colors overflow-hidden"
              >
                <summary
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggle(index);
                  }}
                  className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 cursor-pointer list-none hover:bg-zinc-50/70 transition-colors select-none"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-100/90 flex items-center justify-center text-zinc-700 shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5 text-zinc-700"
                      aria-hidden="true"
                    >
                      {section.icon}
                    </svg>
                  </div>

                  <span className="font-semibold text-sm sm:text-base text-zinc-900 flex-1 pr-2">
                    {section.title}
                  </span>

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 text-xs sm:text-sm md:text-base text-zinc-600 leading-relaxed space-y-3">
                  {section.content}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
