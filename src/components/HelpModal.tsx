import { X, HelpCircle, MapPin, MessageSquare } from "lucide-react";
import { ThemeColors } from "../../components/ui/robot-hero.tsx";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColors;
}

export function HelpModal({ isOpen, onClose, theme }: HelpModalProps) {
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
              className="w-13 h-13 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center shadow-xs border border-zinc-200"
            >
              <HelpCircle className="w-7 h-7 text-zinc-800" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                Ajuda & Funcionamento
              </h3>
              <p className="text-sm sm:text-base text-zinc-500 font-medium mt-0.5">
                Guia de utilização da interface UniAtmos
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 font-bold text-zinc-950 text-base">
                <MapPin className="w-6 h-6 text-zinc-800" />
                <span>1. Escolha da Unidade e Cidade</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Utilize os seletores da barra superior para definir o campus e a cidade da UNIP que deseja consultar. Todas as referências e localizações se adaptam instantaneamente.
              </p>
            </div>

            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 font-bold text-zinc-950 text-base">
                <MessageSquare className="w-6 h-6 text-zinc-800" />
                <span>2. Campo de Mensagens</span>
              </div>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                A barra de conversa visual foi estruturada para suportar interações por texto e por voz via microfone de forma limpa, direta e centralizada na experiência.
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
