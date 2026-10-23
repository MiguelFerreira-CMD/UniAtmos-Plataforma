
import React from "react";
import { ArrowLeft } from "lucide-react";
import { ThemeColors } from "../../../components/ui/robot-hero.tsx";

interface AboutPageProps {
  theme: ThemeColors;
  onNavigateHome: () => void;
}

export function AboutPage({ theme, onNavigateHome }: AboutPageProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col animate-in fade-in duration-300">
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
    </div>
  );
}

export default AboutPage;
