import React from "react";

/**
 * Componente de círculos decorativos posicionados atrás do robô Atmos.
 * - Estilo 2D, plano e minimalista (sem gradiente 3D, sem sombras de profundidade).
 * - Deslocados um pouco mais para baixo (translate-y vertical).
 * - Ocupam praticamente todo o espaço vertical disponível (~96% da altura).
 * - Espaçamento mínimo entre si (gap reduzido), formando uma composição contínua e uniforme.
 * - 3 círculos principais com 2 círculos adicionais em telas amplas para preenchimento total.
 * - Cores fiéis à identidade visual neutra do UniAtmos (tons de cinza suave e limpo).
 */
export function DecorativeSpheres() {
  return (
    <div
      className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-screen max-w-7xl px-2 flex items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5 pointer-events-none select-none z-0 overflow-visible translate-y-4 sm:translate-y-6 md:translate-y-7"
      aria-hidden="true"
    >
      {/* Círculo Extra Esquerdo (Telas amplas para preenchimento contínuo) */}
      <div
        className="hidden xl:block rounded-full aspect-square shrink-0 transition-transform duration-700 ease-out animate-float-slow"
        style={{
          width: "clamp(105px, 29vw, 500px)",
          height: "clamp(105px, 29vw, 500px)",
          maxHeight: "96%",
          backgroundColor: "#e4e4e7",
          opacity: 0.75,
        }}
      />

      {/* Círculo 1: Esquerda */}
      <div
        className="rounded-full aspect-square shrink-0 transition-transform duration-700 ease-out animate-float-slow"
        style={{
          width: "clamp(105px, 29vw, 500px)",
          height: "clamp(105px, 29vw, 500px)",
          maxHeight: "96%",
          backgroundColor: "#e4e4e7",
          opacity: 0.85,
        }}
      />

      {/* Círculo 2: Centro (posicionado diretamente atrás do robô Atmos) */}
      <div
        className="rounded-full aspect-square shrink-0 transition-transform duration-700 ease-out animate-float-slow"
        style={{
          width: "clamp(105px, 29vw, 500px)",
          height: "clamp(105px, 29vw, 500px)",
          maxHeight: "96%",
          backgroundColor: "#dedee3",
          opacity: 0.92,
        }}
      />

      {/* Círculo 3: Direita */}
      <div
        className="rounded-full aspect-square shrink-0 transition-transform duration-700 ease-out animate-float-slow"
        style={{
          width: "clamp(105px, 29vw, 500px)",
          height: "clamp(105px, 29vw, 500px)",
          maxHeight: "96%",
          backgroundColor: "#e4e4e7",
          opacity: 0.85,
        }}
      />

      {/* Círculo Extra Direito (Telas amplas para preenchimento contínuo) */}
      <div
        className="hidden xl:block rounded-full aspect-square shrink-0 transition-transform duration-700 ease-out animate-float-slow"
        style={{
          width: "clamp(105px, 29vw, 500px)",
          height: "clamp(105px, 29vw, 500px)",
          maxHeight: "96%",
          backgroundColor: "#e4e4e7",
          opacity: 0.75,
        }}
      />
    </div>
  );
}

export default DecorativeSpheres;
