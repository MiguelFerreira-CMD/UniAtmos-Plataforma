import { useState, useEffect } from "react";
import { UNIP_CAMPUSES, UnipCampus } from "./data/unip-campuses.ts";
import { AtmosNavbar } from "./components/AtmosNavbar.tsx";
import { RobotHero, getCurrentTheme, ThemeColors } from "../components/ui/robot-hero.tsx";
import { AtmosChat } from "./components/AtmosChat.tsx";
import { AboutModal } from "./components/AboutModal.tsx";
import { HelpModal } from "./components/HelpModal.tsx";
import { CreditsModal } from "./components/CreditsModal.tsx";

export default function App() {
  const [selectedCampus, setSelectedCampus] = useState<UnipCampus>(UNIP_CAMPUSES[0]);
  const [theme, setTheme] = useState<ThemeColors>(getCurrentTheme);
  
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);

  // Mantém o tema atualizado automaticamente com a virada de horário
  useEffect(() => {
    const interval = setInterval(() => {
      setTheme(getCurrentTheme());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen w-full text-zinc-900 flex flex-col font-sans antialiased selection:bg-zinc-200 transition-colors duration-1000 relative overflow-x-hidden"
      style={{
        backgroundColor: "#fbfbfb",
        backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 18%, ${theme.light}40 0%, rgba(251, 251, 251, 0) 75%)`,
      }}
    >
      
      {/* 1. NAVBAR COM APENAS O TEXTO "UniAtmos", SELETORES E LINKS (SOBRE, AJUDA E CRÉDITOS) */}
      <AtmosNavbar
        selectedCampus={selectedCampus}
        onSelectCampus={setSelectedCampus}
        onOpenAbout={() => setAboutOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenCredits={() => setCreditsOpen(true)}
        theme={theme}
      />

      <main className="flex-1 flex flex-col items-center w-full">
        
        {/* 2. HERO: ROBÔ 3D MAIOR E MAIS DESTACADO */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 flex flex-col items-center">
          
          {/* TÍTULO E SUBTÍTULO */}
          <div className="text-center space-y-1 z-10 select-none">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-950">
              Atmos
            </h1>
            <p className="text-xs sm:text-sm font-medium text-zinc-500">
              Assistente climático da UNIP
            </p>
          </div>

          {/* ROBÔ 3D MAIOR E DESTACADO */}
          <div className="w-full max-w-3xl h-[400px] sm:h-[480px] md:h-[530px] relative flex items-center justify-center z-10 pointer-events-auto">
            <RobotHero
              pantallaColor={theme.primary}
              scale={1.35}
              color="#d4d4d8"
              pantallaBrillo={1.3}
            />
          </div>

        </section>

        {/* 3. CHAT EXTRA LARGO, REBAIXADO UM POUQUINHO MAIS PARA BAIXO */}
        <section className="w-full -mt-12 sm:-mt-16 md:-mt-20 z-20 relative pb-12">
          <AtmosChat theme={theme} />
        </section>

      </main>

      {/* 4. FOOTER BEM MINIMALISTA */}
      <footer className="w-full py-3 border-t border-zinc-200/60 bg-white/40 text-[11px] text-zinc-400 select-none z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span>UniAtmos · UNIP</span>
          <span>{selectedCampus.name}</span>
        </div>
      </footer>

      {/* MODAIS AMPLOS: SOBRE, AJUDA E CRÉDITOS */}
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} theme={theme} />
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} theme={theme} />
      <CreditsModal isOpen={creditsOpen} onClose={() => setCreditsOpen(false)} theme={theme} />

    </div>
  );
}
