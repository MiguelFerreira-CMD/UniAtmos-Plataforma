import { useState, useEffect } from "react";
import { UnipCampus, UNIP_CAMPUSES, UNIQUE_CITIES } from "../../../backend/data/unip-campuses.ts";
import { MapPin, Building2, HelpCircle, Info, Award, Menu, X, Home } from "lucide-react";
import { ThemeColors } from "../../../components/ui/robot-hero.tsx";

export type NavRoute = "home" | "sobre" | "ajuda" | "creditos";

interface AtmosNavbarProps {
  selectedCampus: UnipCampus;
  onSelectCampus: (campus: UnipCampus) => void;
  currentRoute?: NavRoute;
  onNavigate?: (route: NavRoute) => void;
  onOpenAbout?: () => void;
  onOpenHelp?: () => void;
  onOpenCredits?: () => void;
  theme?: ThemeColors;
}

export function AtmosNavbar({
  selectedCampus,
  onSelectCampus,
  currentRoute = "home",
  onNavigate,
  onOpenAbout,
  onOpenHelp,
  onOpenCredits,
}: AtmosNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigate = (route: NavRoute) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      if (route === "sobre" && onOpenAbout) onOpenAbout();
      if (route === "ajuda" && onOpenHelp) onOpenHelp();
      if (route === "creditos" && onOpenCredits) onOpenCredits();
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-200/80 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">

          {/* LOGO: TEXTO “UniAtmos”, CLICÁVEL PARA VOLTAR À HOME */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleNavigate("home")}
              className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 select-none cursor-pointer hover:opacity-80 transition-opacity"
              title="Voltar ao início"
            >
              UniAtmos
            </button>
          </div>

          {/* INFORMAÇÕES DE UNIDADE E CIDADE (Desktop / Tablet) - Visual estático sem interação */}
          <div className="hidden md:flex items-center gap-2.5 bg-zinc-100/70 px-3.5 py-1.5 rounded-xl text-xs select-none">
            {/* Unidade */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-600 font-medium whitespace-nowrap">
                {selectedCampus.name}
              </span>
            </div>

            <div className="w-px h-3.5 bg-zinc-200" />

            {/* Cidade */}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-600 font-medium whitespace-nowrap">
                {selectedCampus.city}
              </span>
            </div>
          </div>

          {/* LINKS DE NAVEGAÇÃO: SOBRE, AJUDA E CRÉDITOS */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleNavigate("sobre")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${currentRoute === "sobre"
                ? "bg-zinc-200/80 text-zinc-950 font-bold"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                }`}
            >
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              Sobre
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("ajuda")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${currentRoute === "ajuda"
                ? "bg-zinc-200/80 text-zinc-950 font-bold"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              Ajuda
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("creditos")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${currentRoute === "creditos"
                ? "bg-zinc-200/80 text-zinc-950 font-bold"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                }`}
            >
              <Award className="w-3.5 h-3.5 text-zinc-400" />
              Créditos
            </button>
          </div>

          {/* BOTÃO MOBILE */}
          <div className="flex items-center md:hidden gap-1">
            <button
              type="button"
              onClick={() => handleNavigate("creditos")}
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer"
              title="Créditos"
            >
              <Award className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* MENU MOBILE */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-zinc-200 space-y-3">
            {/* Informações no mobile - Visual estático sem interação */}
            <div className="grid grid-cols-2 gap-2 select-none">
              <div className="flex items-center justify-center gap-1.5 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>{selectedCampus.name}</span>
              </div>

              <div className="flex items-center justify-center gap-1.5 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>{selectedCampus.city}</span>
              </div>
            </div>

            {/* Links no mobile */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => handleNavigate("home")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg justify-center cursor-pointer ${currentRoute === "home"
                  ? "bg-zinc-200 text-zinc-950 font-bold"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80"
                  }`}
              >
                <Home className="w-3.5 h-3.5" />
                Início
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("sobre")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg justify-center cursor-pointer ${currentRoute === "sobre"
                  ? "bg-zinc-200 text-zinc-950 font-bold"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80"
                  }`}
              >
                <Info className="w-3.5 h-3.5" />
                Sobre
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("ajuda")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg justify-center cursor-pointer ${currentRoute === "ajuda"
                  ? "bg-zinc-200 text-zinc-950 font-bold"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80"
                  }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Ajuda
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("creditos")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg justify-center cursor-pointer ${currentRoute === "creditos"
                  ? "bg-zinc-200 text-zinc-950 font-bold"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80"
                  }`}
              >
                <Award className="w-3.5 h-3.5" />
                Créditos
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}

export default AtmosNavbar;
