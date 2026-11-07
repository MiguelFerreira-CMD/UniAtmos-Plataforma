
import { useState, useEffect } from "react";
import { UnipCampus } from "../data/unip-campuses.ts";
import {
  MapPin,
  Building2,
  HelpCircle,
  Info,
  Award,
  Menu,
  X,
  Home,
} from "lucide-react";
import type { ThemeColors } from "../../components/ui/robot-hero.tsx";

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
      setIsScrolled(window.scrollY > 10);
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
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 select-none bg-white border-b border-[#E2E1DF] ${
        isScrolled ? "shadow-xs" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">

          {/* LOGO OFICIAL UNIATMOS */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleNavigate("home")}
              className="inline-flex items-center gap-2.5 select-none cursor-pointer hover:opacity-85 transition-opacity group"
              title="Voltar ao início"
            >
              <img
                src="/img/UniAtmos-Favicon.png"
                alt="Logo UniAtmos"
                width="40"
                height="40"
                className="w-10 h-10 object-contain block shrink-0"
                onError={() => console.error("ERRO AO CARREGAR A LOGO")}
              />

              <span
                className="text-xl sm:text-2xl font-black tracking-tight"
                style={{ color: "#203a6d" }}
              >
                UniAtmos
              </span>
            </button>
          </div>

          {/* INFORMAÇÕES DE UNIDADE E CIDADE */}
          <div className="hidden md:flex items-center gap-2.5 bg-[#F4F3F2] px-3.5 py-1.5 rounded-xl text-xs select-none border border-[#E2E1DF]">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#244FA3] shrink-0" />
              <span className="text-[#263448] font-medium whitespace-nowrap">
                {selectedCampus.name}
              </span>
            </div>

            <div className="w-px h-3.5 bg-[#D5D4D0]" />

            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#244FA3] shrink-0" />
              <span className="text-[#475569] font-medium whitespace-nowrap">
                {selectedCampus.city}
              </span>
            </div>
          </div>

          {/* LINKS DE NAVEGAÇÃO */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleNavigate("sobre")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                currentRoute === "sobre"
                  ? "bg-[#EBF2FF] text-[#244FA3] font-bold border border-[#BFDBFE]"
                  : "text-[#475569] hover:text-[#244FA3] hover:bg-[#F4F3F2]"
              }`}
            >
              Sobre
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("ajuda")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                currentRoute === "ajuda"
                  ? "bg-[#EBF2FF] text-[#244FA3] font-bold border border-[#BFDBFE]"
                  : "text-[#475569] hover:text-[#244FA3] hover:bg-[#F4F3F2]"
              }`}
            >
              Ajuda
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("creditos")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                currentRoute === "creditos"
                  ? "bg-[#EBF2FF] text-[#244FA3] font-bold border border-[#BFDBFE]"
                  : "text-[#475569] hover:text-[#244FA3] hover:bg-[#F4F3F2]"
              }`}
            >
              Créditos
            </button>
          </div>

          {/* BOTÃO MOBILE */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#263448] hover:text-[#244FA3] hover:bg-[#F4F3F2] rounded-lg transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* MENU MOBILE */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-[#E2E1DF] space-y-3">

            {/* INFORMAÇÕES NO MOBILE */}
            <div className="grid grid-cols-2 gap-2 select-none">
              <div className="flex items-center justify-center gap-1.5 p-2.5 bg-[#F4F3F2] rounded-xl border border-[#E2E1DF] text-xs font-semibold text-[#263448]">
                <Building2 className="w-3.5 h-3.5 text-[#244FA3]" />
                <span className="truncate">{selectedCampus.name}</span>
              </div>

              <div className="flex items-center justify-center gap-1.5 p-2.5 bg-[#F4F3F2] rounded-xl border border-[#E2E1DF] text-xs font-semibold text-[#263448]">
                <MapPin className="w-3.5 h-3.5 text-[#244FA3]" />
                <span className="truncate">{selectedCampus.city}</span>
              </div>
            </div>

            {/* LINKS NO MOBILE */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E2E1DF]">
              <button
                type="button"
                onClick={() => handleNavigate("home")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg justify-center cursor-pointer transition-colors ${
                  currentRoute === "home"
                    ? "bg-[#EBF2FF] text-[#244FA3] font-bold border border-[#BFDBFE]"
                    : "bg-[#F4F3F2] text-[#475569] hover:text-[#244FA3] hover:bg-[#EAE9E6]"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Início</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate("sobre")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg justify-center cursor-pointer transition-colors ${
                  currentRoute === "sobre"
                    ? "bg-[#EBF2FF] text-[#244FA3] font-bold border border-[#BFDBFE]"
                    : "bg-[#F4F3F2] text-[#475569] hover:text-[#244FA3] hover:bg-[#EAE9E6]"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Sobre</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate("ajuda")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg justify-center cursor-pointer transition-colors ${
                  currentRoute === "ajuda"
                    ? "bg-[#EBF2FF] text-[#244FA3] font-bold border border-[#BFDBFE]"
                    : "bg-[#F4F3F2] text-[#475569] hover:text-[#244FA3] hover:bg-[#EAE9E6]"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Ajuda</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate("creditos")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg justify-center cursor-pointer transition-colors ${
                  currentRoute === "creditos"
                    ? "bg-[#EBF2FF] text-[#244FA3] font-bold border border-[#BFDBFE]"
                    : "bg-[#F4F3F2] text-[#475569] hover:text-[#244FA3] hover:bg-[#EAE9E6]"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Créditos</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default AtmosNavbar;
