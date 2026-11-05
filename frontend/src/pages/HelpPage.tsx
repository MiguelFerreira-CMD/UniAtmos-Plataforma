
import React from "react";
import {
  ArrowLeft,
  MessageCircle,
  Info,
  ShieldCheck,
  Flag,
  Accessibility,
  BadgeCheck,
} from "lucide-react";

import type { ThemeColors } from "../../components/ui/robot-hero.tsx";

interface HelpPageProps {
  theme: ThemeColors;
  onNavigateHome: () => void;
}

export function HelpPage({
  theme,
  onNavigateHome,
}: HelpPageProps) {
  const helpItems = [
    {
      title: "Chatbot",
      description:
        "Fale com nosso assistente para dúvidas rápidas e orientações iniciais.",
      icon: MessageCircle,
    },
    {
      title: "Projeto",
      description:
        "Conheça o propósito, os objetivos e a estrutura da iniciativa UniAtmos.",
      icon: Info,
    },
    {
      title: "Política",
      description:
        "Acesse diretrizes, regras e compromissos que orientam o trabalho da iniciativa.",
      icon: ShieldCheck,
    },
    {
      title: "Reportar",
      description:
        "Comunique problemas, erros ou conteúdos que precisam de atenção.",
      icon: Flag,
    },
    {
      title: "Acessibilidade",
      description:
        "Recursos e apoio para navegação inclusiva e acessível.",
      icon: Accessibility,
    },
    {
      title: "Autêntico",
      description:
        "Dados autênticos, confiáveis e sem informações inventadas.",
      icon: BadgeCheck,
    },
  ];

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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-950 tracking-tight mb-2 sm:mb-3">
          Central de Ajuda
        </h1>

        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-800 mb-1 sm:mb-2">
            Navegue rápido
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-zinc-600">
            Escolha o caminho mais adequado para sua dúvida ou solicitação.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {helpItems.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-2xl border border-zinc-200/90 bg-white/85 backdrop-blur-xs p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-start"
              >
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-100/90 flex items-center justify-center text-zinc-700 shrink-0">
                    <Icon
                      className="w-5 h-5 text-zinc-700"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="font-bold text-base sm:text-lg text-zinc-900">
                    {item.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HelpPage;
