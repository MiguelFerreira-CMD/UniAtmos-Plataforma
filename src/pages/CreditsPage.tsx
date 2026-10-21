import React from "react";
import { ArrowLeft, Award, Sparkles } from "lucide-react";
import { ThemeColors } from "../../components/ui/robot-hero.tsx";

interface CreditsPageProps {
  theme: ThemeColors;
  onNavigateHome: () => void;
}

/**
 * Página: Créditos do UniAtmos
 * 
 * Estrutura inicial em branco, pronta para receber conteúdo futuro.
 * Para adicionar conteúdo, insira os integrantes, créditos, orientadores e parcerias dentro
 * da seção marcada como "ÁREA DE CONTEÚDO".
 */
export function CreditsPage({ theme, onNavigateHome }: CreditsPageProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Barra superior de navegação / Voltar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-950 bg-white/80 hover:bg-white rounded-xl border border-zinc-200/80 shadow-2xs transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Voltar ao início</span>
        </button>
      </div>

      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-zinc-200/60 pb-6">
        <div
          className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-md shrink-0"
          style={{ boxShadow: `0 4px 18px ${theme.glow}` }}
        >
          <Award className="w-6 h-6" style={{ color: theme.primary }} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
            Créditos e Equipe
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 font-medium mt-1">
            Reconhecimento dos desenvolvedores, colaboradores e instituição.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ÁREA DE CONTEÚDO PRINCIPAL (EM BRANCO PARA FUTURA EDIÇÃO)                  */}
      {/* Adicione desenvolvedores, orientadores, tecnologias e links abaixo.       */}
      {/* ========================================================================= */}
      <div className="w-full bg-white/90 backdrop-blur-xs rounded-3xl border border-zinc-200/80 shadow-xs p-8 sm:p-14 min-h-[360px] flex flex-col justify-center items-center text-center">
        {/* Placeholder estruturado pronto para receber novas informações */}
        <div className="max-w-md mx-auto flex flex-col items-center gap-3 border-2 border-dashed border-zinc-200 rounded-2xl p-8 sm:p-10 text-zinc-400 w-full">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-50 text-zinc-400"
            style={{ color: theme.primary }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-zinc-700">
            Estrutura da Página de Créditos
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
            Esta página está pronta para receber a relação de créditos do projeto UniAtmos.
            Você pode adicionar nomes de membros da equipe, papéis, links para GitHub/LinkedIn e menções aos orientadores.
          </p>
        </div>
      </div>

      {/* Botão de retorno secundário no rodapé da página */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a página principal
        </button>
      </div>
    </div>
  );
}

export default CreditsPage;
