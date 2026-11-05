import React from "react";
import { ArrowLeft, ExternalLink, User } from "lucide-react";
import type { ThemeColors } from "../../components/ui/robot-hero.tsx";

interface CreditsPageProps {
  theme: ThemeColors;
  onNavigateHome: () => void;
}

export function CreditsPage({
  theme,
  onNavigateHome,
}: CreditsPageProps) {
  const creators = [
    "Miguel Freitas",
    "Cardoso Soares",
    "Gustavo Alves",
    "Enzo Francisco",
    "Enzo Holanda",
    "Rafael Pinheiro",
    "Lucas Alves",
    "Valentina de Oliveira Leite",
    "Murilo Oliveira Bueno",
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
          Créditos
        </h1>

        <div className="rounded-2xl sm:rounded-3xl border border-zinc-200/90 bg-white/85 backdrop-blur-xs p-4 sm:p-6 md:p-8 shadow-xs">

          <p className="text-xs sm:text-sm md:text-base text-zinc-600 leading-relaxed mb-6 sm:mb-8">
            Aqui estão as referências essenciais para o UniAtmos, incluindo
            a fonte de dados usada e as pessoas envolvidas.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">

            <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">

              <article className="rounded-xl sm:rounded-2xl border border-zinc-200/80 p-4 sm:p-6 bg-white shadow-2xs">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3 sm:mb-4">
                  Informações
                </h2>

                <div className="text-xs sm:text-sm md:text-base text-zinc-600 leading-relaxed space-y-3.5">
                  <p>
                    O Atmos é um chatbot desenvolvido para ajudar estudantes
                    da UNIP Sorocaba a se prepararem para as condições climáticas
                    antes de irem à faculdade. Com informações sobre o clima
                    na região do campus, ele auxilia principalmente quem mora
                    mais longe a planejar o dia e evitar surpresas causadas
                    pelo tempo.
                  </p>

                  <p className="font-medium text-zinc-800">Experimente perguntar:</p>

                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5">
                    <li>“Qual roupa devo usar hoje para ir à faculdade?”</li>
                    <li>“Como está o clima na região da UNIP Sorocaba?”</li>
                    <li>“Vai chover hoje durante o horário da minha aula?”</li>
                  </ul>

                  <p>
                    Descubra como o Atmos pode ajudar você a sair de casa
                    mais preparado!
                  </p>

                  <div className="pt-2 border-t border-zinc-100 flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-600">Fonte de dados:</span>
                    <a
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline font-medium break-all"
                      href="https://open-meteo.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>API Open-Meteo</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </div>
              </article>

              <article className="rounded-xl sm:rounded-2xl border border-zinc-200/80 p-4 sm:p-6 bg-white shadow-2xs">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3 sm:mb-4">
                  Alex Reino
                </h2>

                <p className="text-xs sm:text-sm md:text-base text-zinc-600 leading-relaxed">
                  O desenvolvedor Alex Reino foi utilizado como referência
                  durante o desenvolvimento do projeto UniAtmos. Utilizamos
                  como inspiração o robô desenvolvido por ele, tomando seu
                  design e suas características visuais como base para a
                  criação do robô Atmos, adaptando-o à identidade visual do
                  nosso projeto.
                </p>
              </article>

            </div>

            <div className="lg:col-span-5">
              <article className="rounded-xl sm:rounded-2xl border border-zinc-200/80 p-4 sm:p-6 bg-white shadow-2xs h-full flex flex-col">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span>Criadores</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                    {creators.length}
                  </span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 flex-1">
                  {creators.map((creator) => (
                    <div
                      key={creator}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-100 text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-100/70 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-zinc-200/80 flex items-center justify-center text-zinc-600 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{creator}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default CreditsPage;
