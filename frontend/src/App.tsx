import { useState, useEffect } from "react";
import { UNIP_CAMPUSES, UnipCampus } from "../../backend/data/unip-campuses.ts";
import { AtmosNavbar, NavRoute } from "./components/AtmosNavbar.tsx";
import { RobotHero, getCurrentTheme } from "../components/ui/robot-hero.tsx";
import { AtmosChat } from "./components/AtmosChat.tsx";
import { BlueprintGradientMesh } from "../components/ui/blueprint-gradient-mesh.tsx";
import { AboutPage } from "./pages/AboutPage.tsx";
import { HelpPage } from "./pages/HelpPage.tsx";
import { CreditsPage } from "./pages/CreditsPage.tsx";

function parseHashRoute(): NavRoute {
  const hash = window.location.hash.toLowerCase().replace("#", "").replace("/", "").trim();
  if (hash === "sobre") return "sobre";
  if (hash === "ajuda") return "ajuda";
  if (hash === "creditos") return "creditos";
  return "home";
}

export default function App() {
  const [selectedCampus, setSelectedCampus] = useState<UnipCampus>(UNIP_CAMPUSES[0]);
  const [theme, setTheme] = useState<ThemeColors>(getCurrentTheme);
  const [currentRoute, setCurrentRoute] = useState<NavRoute>(parseHashRoute);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isAtmosSpeaking, setIsAtmosSpeaking] = useState(false);

  // Sincroniza o estado da rota com o histórico e hash da URL
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(parseHashRoute());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (route: NavRoute) => {
    if (route === "home") {
      window.location.hash = "";
    } else {
      window.location.hash = `/${route}`;
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Mantém o tema atualizado automaticamente com a virada de horário
  useEffect(() => {
    const interval = setInterval(() => {
      setTheme(getCurrentTheme());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen max-h-screen w-full text-zinc-900 flex flex-col font-sans antialiased selection:bg-zinc-200 transition-colors duration-1000 relative overflow-hidden bg-transparent">
      {/* 1. GRADE BLUEPRINT EM TODO O SITE (Sempre na camada de fundo, atrás de tudo e sem capturar eventos) */}
      <div className="fixed inset-0 -z-10 pointer-events-none select-none">
        <BlueprintGradientMesh className="w-full h-full" vignette={false} />
      </div>

      {/* 2. NAVBAR COM SELEÇÃO DE CAMPUS (SOROCABA) E LINKS PRÓPRIOS PARA AS PÁGINAS */}
      <AtmosNavbar
        selectedCampus={selectedCampus}
        onSelectCampus={setSelectedCampus}
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        theme={theme}
      />

      {/* 3. ROTEAMENTO DE CONTEÚDO */}
      {currentRoute === "home" && (
        <main className="flex-1 flex flex-col items-center w-full animate-in fade-in duration-300 relative z-10 min-h-0 overflow-hidden">

          {/* TÍTULO E DESCRIÇÃO CENTRALIZADOS NO TOPO */}
          <div className="text-center space-y-1 z-10 select-none pt-4 sm:pt-6 pb-1 shrink-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-950">
              Atmos
            </h1>
            <p className="text-xs sm:text-sm font-medium text-zinc-500">
              Assistente climático da UNIP
            </p>
          </div>

          <section
            className={`w-full mx-auto px-4 sm:px-6 transition-all duration-700 ease-in-out flex-1 min-h-0 ${isChatExpanded
              ? "max-w-[1400px] pt-3 sm:pt-5 lg:pt-6 pb-6 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-center"
              : "max-w-7xl pt-1 pb-6 flex flex-col items-center justify-center"
              }`}
          >
            {/* 1. ROBÔ ATMOS 3D (Tamanho aumentado e alinhado no topo com a caixa do chat) */}
            <div
              className={`transition-all duration-700 ease-in-out flex flex-col items-center bg-transparent ${isChatExpanded
                ? "w-full lg:w-[480px] xl:w-[540px] lg:sticky lg:top-20 shrink-0 lg:-mt-6 xl:-mt-8"
                : "w-full max-w-4xl"
                }`}
            >
              <div
                className={`w-full relative flex items-center justify-center transition-all duration-700 pointer-events-auto bg-transparent ${isChatExpanded
                  ? "h-[360px] sm:h-[440px] lg:h-[540px] xl:h-[580px]"
                  : "h-[400px] sm:h-[480px] md:h-[530px]"
                  }`}
              >
                <RobotHero
                  pantallaColor={theme.primary}
                  scale={isChatExpanded ? 1.62 : 1.35}
                  color="#d4d4d8"
                  pantallaBrillo={1.3}
                  isTalking={isAtmosSpeaking}
                />
              </div>
            </div>

            {/* 2. CHAT CLIMÁTICO ATMOS (Caixa aumentada, lado a lado e alinhada) */}
            <div
              className={`transition-all duration-700 ease-in-out ${isChatExpanded
                ? "flex-1 w-full min-w-0 max-w-3xl xl:max-w-4xl"
                : "w-full -mt-12 sm:-mt-16 md:-mt-20 z-20 relative flex justify-center pb-12"
                }`}
            >
              <AtmosChat
                theme={theme}
                isExpanded={isChatExpanded}
                onExpandedChange={setIsChatExpanded}
                onAtmosSpeakingChange={setIsAtmosSpeaking}
              />
            </div>

          </section>
        </main>
      )}

      {/* PÁGINA: SOBRE O UNIATMOS */}
      {currentRoute === "sobre" && (
        <main className="flex-1 flex flex-col items-center w-full">
          <AboutPage theme={theme} onNavigateHome={() => navigateTo("home")} />
        </main>
      )}

      {/* PÁGINA: CENTRAL DE AJUDA */}
      {currentRoute === "ajuda" && (
        <main className="flex-1 flex flex-col items-center w-full">
          <HelpPage theme={theme} onNavigateHome={() => navigateTo("home")} />
        </main>
      )}

      {/* PÁGINA: CRÉDITOS E EQUIPE */}
      {currentRoute === "creditos" && (
        <main className="flex-1 flex flex-col items-center w-full">
          <CreditsPage theme={theme} onNavigateHome={() => navigateTo("home")} />
        </main>
      )}

    </div>
  );
}