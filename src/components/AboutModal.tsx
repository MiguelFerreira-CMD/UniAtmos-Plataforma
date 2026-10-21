import { X, Cloud, Compass, Cpu, CheckCircle2 } from "lucide-react";
import { ThemeColors } from "../../components/ui/robot-hero.tsx";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColors;
}

export function AboutModal({ isOpen, onClose, theme }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-zinc-950/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl border border-zinc-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          boxShadow: `0 30px 70px rgba(0, 0, 0, 0.15), 0 0 50px ${theme.glow}`,
        }}
      >
        
        {/* Cabeçalho amplo e destacado */}
        <div className="px-8 sm:px-10 py-7 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-4">
            <div
              className="w-13 h-13 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-md"
              style={{ boxShadow: `0 4px 18px ${theme.glow}` }}
            >
              <Cloud className="w-7 h-7" style={{ color: theme.primary }} />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                Sobre o UniAtmos
              </h3>
              <p className="text-sm sm:text-base text-zinc-500 font-medium mt-0.5">
                Assistente climático da UNIP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo amplo e espaçoso */}
        <div className="p-8 sm:p-10 space-y-7 text-zinc-600 leading-relaxed overflow-y-auto">
          
          <p className="text-lg sm:text-xl text-zinc-800 font-normal leading-relaxed">
            O <strong className="font-bold text-zinc-950">UniAtmos</strong> é a plataforma de assistência meteorológica e suporte climático projetada especialmente para a comunidade acadêmica da Universidade Paulista (UNIP).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            
            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 font-bold text-zinc-950 text-base">
                <Compass className="w-6 h-6 text-zinc-800" />
                <span>Mapeamento dos Campi</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Integração com coordenadas geográficas das unidades da UNIP em Sorocaba, São Paulo (Marquês, Paraíso, Chácara Santo Antônio, Tatuapé, Cidade Universitária), Campinas, Santos, Ribeirão Preto, Brasília e demais regiões.
              </p>
            </div>

            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 font-bold text-zinc-950 text-base">
                <Cpu className="w-6 h-6 text-zinc-800" />
                <span>Atmos</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                O robô Atmos conta com experiência interativa em tempo real e iluminação circadiana que reflete suavemente os períodos do dia, acompanhando a interação do usuário.
              </p>
            </div>

          </div>

          <div className="p-5 rounded-2xl bg-zinc-100/70 border border-zinc-200/70 flex items-center gap-3.5 text-sm sm:text-base text-zinc-700">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <span>Desenvolvido para oferecer agilidade, previsão precisa e conveniência para alunos, professores e colaboradores.</span>
          </div>

        </div>

        {/* Rodapé */}
        <div className="px-8 sm:px-10 py-5 bg-zinc-50 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-7 py-3 bg-zinc-950 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
