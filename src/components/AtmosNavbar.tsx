import { useState } from "react";
import { UnipCampus, UNIP_CAMPUSES, UNIQUE_CITIES } from "../data/unip-campuses.ts";
import { MapPin, Building2, HelpCircle, Info, Award, Menu, X } from "lucide-react";
import { ThemeColors } from "../../components/ui/robot-hero.tsx";

interface AtmosNavbarProps {
  selectedCampus: UnipCampus;
  onSelectCampus: (campus: UnipCampus) => void;
  onOpenAbout: () => void;
  onOpenHelp: () => void;
  onOpenCredits: () => void;
  theme: ThemeColors;
}

export function AtmosNavbar({
  selectedCampus,
  onSelectCampus,
  onOpenAbout,
  onOpenHelp,
  onOpenCredits,
}: AtmosNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCityChange = (cityName: string) => {
    const campusInCity = UNIP_CAMPUSES.find((c) => c.fullLocation === cityName);
    if (campusInCity) {
      onSelectCampus(campusInCity);
    }
  };

  const handleCampusChange = (campusId: string) => {
    const campus = UNIP_CAMPUSES.find((c) => c.id === campusId);
    if (campus) {
      onSelectCampus(campus);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
          
          {/* LOGO: APENAS O TEXTO “UniAtmos”, SEM ÍCONE OU SÍMBOLO */}
          <div className="flex items-center shrink-0">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 select-none">
              UniAtmos
            </span>
          </div>

          {/* SELETORES DE UNIDADE E CIDADE (Desktop / Tablet) */}
          <div className="hidden md:flex items-center gap-2 bg-zinc-100/80 p-1.5 rounded-xl border border-zinc-200/80 text-xs">
            {/* Seletor de Unidade */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-2xs border border-zinc-200/70">
              <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <label htmlFor="select-unit-desktop" className="text-zinc-500 font-medium whitespace-nowrap">
                Unidade:
              </label>
              <select
                id="select-unit-desktop"
                value={selectedCampus.id}
                onChange={(e) => handleCampusChange(e.target.value)}
                className="bg-transparent font-semibold text-zinc-900 focus:outline-hidden cursor-pointer max-w-[210px] truncate"
              >
                {UNIP_CAMPUSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Cidade */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-2xs border border-zinc-200/70">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <label htmlFor="select-city-desktop" className="text-zinc-500 font-medium whitespace-nowrap">
                Cidade:
              </label>
              <select
                id="select-city-desktop"
                value={selectedCampus.fullLocation}
                onChange={(e) => handleCityChange(e.target.value)}
                className="bg-transparent font-semibold text-zinc-900 focus:outline-hidden cursor-pointer max-w-[170px] truncate"
              >
                {UNIQUE_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* LINKS: SOBRE, AJUDA E CRÉDITOS */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenAbout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              Sobre
            </button>

            <button
              type="button"
              onClick={onOpenHelp}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              Ajuda
            </button>

            <button
              type="button"
              onClick={onOpenCredits}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-zinc-400" />
              Créditos
            </button>
          </div>

          {/* BOTÃO MOBILE */}
          <div className="flex items-center md:hidden gap-1">
            <button
              type="button"
              onClick={onOpenCredits}
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
              title="Créditos"
            >
              <Award className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* MENU MOBILE */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-zinc-200 space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col gap-1 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-xs font-semibold text-zinc-700">Unidade UNIP</span>
                <select
                  value={selectedCampus.id}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  className="w-full mt-1 p-2 text-xs font-medium bg-white rounded-lg border border-zinc-200 text-zinc-900 focus:outline-hidden"
                >
                  {UNIP_CAMPUSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-xs font-semibold text-zinc-700">Cidade</span>
                <select
                  value={selectedCampus.fullLocation}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full mt-1 p-2 text-xs font-medium bg-white rounded-lg border border-zinc-200 text-zinc-900 focus:outline-hidden"
                >
                  {UNIQUE_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  onOpenAbout();
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 rounded-lg flex-1 justify-center"
              >
                <Info className="w-3.5 h-3.5" />
                Sobre
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenHelp();
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 rounded-lg flex-1 justify-center"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Ajuda
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenCredits();
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 rounded-lg flex-1 justify-center"
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
