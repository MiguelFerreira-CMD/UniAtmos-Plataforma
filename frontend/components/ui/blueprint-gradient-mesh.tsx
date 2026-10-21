"use client";

import React, { useEffect, useRef } from "react";

/* =========================
   Utils
   ========================= */
type Offset = { x: number; y: number };

const setHiDPICanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const parent = canvas.parentElement;
  const cw = (parent?.clientWidth ?? window.innerWidth) | 0;
  const ch = (parent?.clientHeight ?? window.innerHeight) | 0;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  canvas.width = Math.floor(cw * dpr);
  canvas.height = Math.floor(ch * dpr);
  canvas.style.width = cw + "px";
  canvas.style.height = ch + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

const originFromOffset = (offset: Offset, cell: number) => ({
  x: -((offset.x % cell) + cell) % cell,
  y: -((offset.y % cell) + cell) % cell,
});

/* =========================
   Film grain (suave para fundo claro)
   ========================= */
const Noise: React.FC<{ refresh?: number; alpha?: number }> = ({ refresh = 2, alpha = 4 }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d", { alpha: true });
    if (!ctx) return;

    let f = 0;
    let id = 0;
    const S = 1024;

    const resize = () => {
      c.width = S;
      c.height = S;
      c.style.width = "100%";
      c.style.height = "100%";
    };

    const draw = () => {
      const img = ctx.createImageData(S, S);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = alpha;
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = () => {
      if (f % refresh === 0) draw();
      f++;
      id = requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize);
    resize();
    loop();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(id);
    };
  }, [refresh, alpha]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
};

/* =========================
   Moving grid (linhas de blueprint cinza claro)
   ========================= */
interface GridProps {
  squareSize: number;
  borderColor: string;
  vignette?: boolean;
  gridOffsetRef: React.MutableRefObject<Offset>;
  className?: string;
}

const MovingGrid: React.FC<GridProps> = ({
  squareSize,
  borderColor,
  vignette = true,
  gridOffsetRef,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      ctx.clearRect(0, 0, cw, ch);

      const origin = originFromOffset(gridOffsetRef.current, squareSize);

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;

      // vertical
      for (let x = origin.x; x < cw + squareSize; x += squareSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, ch);
        ctx.stroke();
      }
      // horizontal
      for (let y = origin.y; y < ch + squareSize; y += squareSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(cw, y + 0.5);
        ctx.stroke();
      }

      if (vignette) {
        // fade radial suave para o fundo branco
        const grad = ctx.createRadialGradient(
          cw / 2,
          ch / 2,
          0,
          cw / 2,
          ch / 2,
          Math.sqrt(cw * cw + ch * ch) / 2
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.65, "rgba(255, 255, 255, 0.15)");
        grad.addColorStop(1, "rgba(251, 251, 251, 0.90)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
      }

      raf.current = requestAnimationFrame(draw);
    };

    const resize = () => setHiDPICanvas(canvas, ctx);
    resize();
    raf.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [squareSize, borderColor, vignette, gridOffsetRef]);

  return <canvas ref={canvasRef} className={`block h-full w-full border-none ${className}`} />;
};

/* =========================
   Interactive hover cell (muito suave para fundo claro)
   ========================= */
interface HoverProps {
  squareSize: number;
  hoverFillColor: string;
  hoverStrokeColor: string;
  hoverGlowColor: string;
  gridOffsetRef: React.MutableRefObject<Offset>;
  className?: string;
}

const SquaresInteractive: React.FC<HoverProps> = ({
  squareSize,
  hoverFillColor = "rgba(228, 228, 231, 0.45)",
  hoverStrokeColor = "rgba(161, 161, 170, 0.65)",
  hoverGlowColor = "rgba(228, 228, 231, 0.40)",
  gridOffsetRef,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredRef = useRef<{ x: number; y: number } | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.style.pointerEvents = "none";
    canvas.style.background = "transparent";

    const draw = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      ctx.clearRect(0, 0, cw, ch);

      if (hoveredRef.current) {
        const { x: gx, y: gy } = hoveredRef.current;
        const origin = originFromOffset(gridOffsetRef.current, squareSize);
        const cellX = origin.x + gx * squareSize;
        const cellY = origin.y + gy * squareSize;

        // glow + fill
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = hoverGlowColor;
        ctx.fillStyle = hoverFillColor;
        ctx.fillRect(cellX, cellY, squareSize, squareSize);
        ctx.restore();

        // border
        ctx.lineWidth = 1;
        ctx.strokeStyle = hoverStrokeColor;
        ctx.strokeRect(cellX + 0.5, cellY + 0.5, squareSize - 1, squareSize - 1);

        // brilho interno suave
        const grad = ctx.createLinearGradient(cellX, cellY, cellX, cellY + squareSize);
        grad.addColorStop(0, "rgba(255,255,255,0.4)");
        grad.addColorStop(1, "rgba(255,255,255,0.05)");
        ctx.fillStyle = grad;
        ctx.fillRect(cellX, cellY, squareSize, squareSize);
      }

      raf.current = requestAnimationFrame(draw);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
        hoveredRef.current = null;
        return;
      }

      const origin = originFromOffset(gridOffsetRef.current, squareSize);
      const gx = Math.floor((mouseX - origin.x) / squareSize);
      const gy = Math.floor((mouseY - origin.y) / squareSize);
      hoveredRef.current = { x: gx, y: gy };
    };

    const onPointerLeave = () => {
      hoveredRef.current = null;
    };

    const resize = () => setHiDPICanvas(canvas, ctx);

    resize();
    raf.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [squareSize, hoverFillColor, hoverStrokeColor, hoverGlowColor, gridOffsetRef]);

  return <canvas ref={canvasRef} className={`block h-full w-full border-none pointer-events-none select-none ${className}`} />;
};

/* =========================
   Final combined component — Blueprint
   ========================= */
export type Direction = "right" | "left" | "up" | "down" | "diagonal";

export interface BlueprintGradientMeshProps {
  showGrid?: boolean;
  direction?: Direction;
  speed?: number;
  squareSize?: number;

  // Background e Grid
  backgroundColor?: string;
  borderColor?: string;
  vignette?: boolean;

  // Hover
  hoverFillColor?: string;
  hoverStrokeColor?: string;
  hoverGlowColor?: string;

  className?: string;
}

export function BlueprintGradientMesh({
  showGrid = true,
  direction = "diagonal",
  speed = 0.2,
  squareSize = 44,
  backgroundColor = "#fbfbfb",
  // Linhas cinza claro conforme solicitado
  borderColor = "rgba(212, 212, 216, 0.65)",
  vignette = true,
  hoverFillColor = "rgba(228, 228, 231, 0.45)",
  hoverStrokeColor = "rgba(161, 161, 170, 0.65)",
  hoverGlowColor = "rgba(228, 228, 231, 0.40)",
  fadeBottom = false,
  className = "fixed inset-0 z-0",
}: BlueprintGradientMeshProps & { fadeBottom?: boolean }) {
  const gridOffsetRef = useRef<Offset>({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  // Animação contínua do offset
  useEffect(() => {
    const tick = () => {
      const v = Math.max(speed, 0.1);
      const s = squareSize;
      switch (direction) {
        case "right":
          gridOffsetRef.current.x = (gridOffsetRef.current.x - v + s) % s;
          break;
        case "left":
          gridOffsetRef.current.x = (gridOffsetRef.current.x + v + s) % s;
          break;
        case "up":
          gridOffsetRef.current.y = (gridOffsetRef.current.y - v + s) % s;
          break;
        case "down":
          gridOffsetRef.current.y = (gridOffsetRef.current.y - v + s) % s;
          break;
        case "diagonal":
        default:
          gridOffsetRef.current.x = (gridOffsetRef.current.x - v + s) % s;
          gridOffsetRef.current.y = (gridOffsetRef.current.y - v + s) % s;
          break;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [direction, speed, squareSize]);

  return (
    <div
      className={`overflow-hidden pointer-events-none select-none ${className}`}
      style={{ background: backgroundColor }}
    >
      {/* Spotlight suave em tom claro/neutro */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_900px_at_50%_260px,rgba(244,244,245,0.7),transparent_75%)] pointer-events-none" />

      {/* Grade em movimento com linhas cinza claro */}
      {showGrid && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <MovingGrid
            squareSize={squareSize}
            borderColor={borderColor}
            vignette={vignette}
            gridOffsetRef={gridOffsetRef}
          />
        </div>
      )}

      {/* Células interativas no hover */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <SquaresInteractive
          squareSize={squareSize}
          hoverFillColor={hoverFillColor}
          hoverStrokeColor={hoverStrokeColor}
          hoverGlowColor={hoverGlowColor}
          gridOffsetRef={gridOffsetRef}
        />
      </div>

      {/* Textura sutil de granulação */}
      <div className="pointer-events-none absolute inset-0 z-30 opacity-60">
        <Noise refresh={2} alpha={4} />
      </div>

      {/* Fade inferior opcional */}
      {fadeBottom && (
        <div className="pointer-events-none absolute inset-0 z-40 bg-gradient-to-b from-transparent via-transparent to-[#fbfbfb]/90" />
      )}
    </div>
  );
}

export default BlueprintGradientMesh;
