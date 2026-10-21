import { X, Award, Code2, Sparkles, Building2, Heart } from "lucide-react";
import { ThemeColors } from "../../components/ui/robot-hero.tsx";

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColors;
}

export function CreditsModal({ isOpen, onClose, theme }: CreditsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-zinc-950/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl border border-zinc-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          boxShadow: `0 30px 70px rgba(0, 0, 0, 0.15), 0 0 50px ${theme.glow}`,
        }}
      >
        {/* Cabeçalho amplo */}
        <div className="px-8 sm:px-10 py-7 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-4">
            <div
              className="w-13 h-13 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-md"
              style={{ boxShadow: `0 4px 18px ${theme.glow}` }}
            >
              <Award className="w-7 h-7" style={{ color: theme.primary }} />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                Créditos
              </h3>
              <p className="text-sm sm:text-base text-zinc-500 font-medium mt-0.5">
                UniAtmos — Assistente climático da UNIP
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

        {/* Conteúdo espaçoso */}
        <div className="p-8 sm:p-10 space-y-6 text-zinc-600 leading-relaxed overflow-y-auto">
          <p className="text-base sm:text-lg text-zinc-800 font-normal leading-relaxed">
            Projeto concebido e desenvolvido para aprimorar o dia a dia da comunidade universitária da <strong className="font-bold text-zinc-950">UNIP — Universidade Paulista</strong> com tecnologia interativa 3D e meteorologia em tempo real.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 font-bold text-zinc-950 text-base">
                <Building2 className="w-6 h-6 text-zinc-800" />
                <span>Instituição</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                UNIP — Universidade Paulista. Atendimento a todos os campi e polos educacionais no estado de São Paulo e território nacional.
              </p>
            </div>

            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 font-bold text-zinc-950 text-base">
                <Sparkles className="w-6 h-6 text-zinc-800" />
                <span>Robô 3D Atmos</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Modelagem e shader procedural com Three.js, React Three Fiber e física de iluminação circadiana em tempo real.
              </p>
            </div>

            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 font-bold text-zinc-950 text-base">
                <Code2 className="w-6 h-6 text-zinc-800" />
                <span>Engenharia & Interface</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Desenvolvido com React, TypeScript, Tailwind CSS e integração com serviços meteorológicos globais.
              </p>
            </div>

            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 font-bold text-zinc-950 text-base">
                <Heart className="w-6 h-6 text-rose-500" />
                <span>Experiência Acadêmica</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Criado com foco em usabilidade, precisão, visual moderno e comodidade para estudantes e docentes.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-8 sm:px-10 py-5 bg-zinc-50 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-7 py-3 bg-zinc-950 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
