
"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

export interface ThemeColors {
  primary: string;
  secondary: string;
  light: string;
  glow: string;
  period: "morning" | "afternoon" | "night";
}

/**
 * Cores automáticas baseadas no horário local:
 * Manhã: 06:00–11:59
 * Tarde: 12:00–17:59
 * Noite: 18:00–05:59
 */
export function getCurrentTheme(): ThemeColors {
  const hours = new Date().getHours();

  if (hours >= 6 && hours < 12) {
    return {
      period: "morning",
      primary: "#0284C7",
      secondary: "#0369A1",
      light: "#38BDF8",
      glow: "rgba(2, 132, 199, 0.35)",
    };
  }

  if (hours >= 12 && hours < 18) {
    return {
      period: "afternoon",
      primary: "#D97706",
      secondary: "#B45309",
      light: "#F59E0B",
      glow: "rgba(217, 119, 6, 0.35)",
    };
  }

  return {
    period: "night",
    primary: "#000000",
    secondary: "#111111",
    light: "#1A1A1A",
    glow: "rgba(0, 0, 0, 0.5)",
  };
}

function ResponsiveGroup({
  children,
  scale = 1,
}: {
  children: React.ReactNode;
  scale?: number;
}) {
  const { viewport } = useThree();
  const s = Math.min(1.48, viewport.width / 2.38) * scale;

  return <group scale={s}>{children}</group>;
}

function GlassCapsule({
  color,
  power,
  intensity,
}: {
  color: string;
  power: number;
  intensity: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const currentColor = useRef(new THREE.Color(color));
  const targetColor = useMemo(() => new THREE.Color(color), [color]);

  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color(color) },
      power: { value: power },
      intensity: { value: intensity },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;

    currentColor.current.lerp(targetColor, Math.min(1, delta * 3.5));

    materialRef.current.uniforms.color.value.copy(currentColor.current);
    materialRef.current.uniforms.power.value = power;
    materialRef.current.uniforms.intensity.value = intensity;
  });

  return (
    <mesh>
      <sphereGeometry args={[0.3, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewPosition;

          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform vec3 color;
          uniform float power;
          uniform float intensity;

          varying vec3 vNormal;
          varying vec3 vViewPosition;

          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);

            float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
            fresnel = pow(fresnel, power);

            gl_FragColor = vec4(color, fresnel * intensity);
          }
        `}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

const earBaseMat = new THREE.MeshStandardMaterial({
  color: "#f0f0f0",
  roughness: 0.5,
});

const earRingMat = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.3,
});

const earCenterMat = new THREE.MeshStandardMaterial({
  color: "#cccccc",
  roughness: 0.8,
});

const antennaBaseMat = new THREE.MeshStandardMaterial({
  color: "#999999",
  roughness: 0.4,
  metalness: 0.5,
});

const antennaStickMat = new THREE.MeshStandardMaterial({
  color: "#d0d0d0",
  roughness: 0.4,
  metalness: 0.2,
});

function RobotEar({
  position,
  scale = 1,
  isLeft = false,
  tipColor = "#ff3366",
}: {
  position: [number, number, number];
  scale?: number;
  isLeft?: boolean;
  tipColor?: string;
}) {
  const dir = isLeft ? -1 : 1;
  const tipMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (tipMatRef.current) {
      tipMatRef.current.color.set(tipColor);
    }
  }, [tipColor]);

  return (
    <group position={position} scale={scale}>
      <mesh
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earBaseMat}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.025, 32]} />
      </mesh>

      <mesh
        position={[dir * 0.012, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earRingMat}
      >
        <torusGeometry args={[0.032, 0.008, 16, 32]} />
      </mesh>

      <mesh
        position={[dir * 0.012, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earCenterMat}
      >
        <cylinderGeometry args={[0.03, 0.03, 0.005, 32]} />
      </mesh>

      <group position={[dir * 0.015, 0.035, 0]} rotation={[-0.4, 0, 0]}>
        <mesh
          position={[0, 0.01, 0]}
          castShadow
          receiveShadow
          material={antennaBaseMat}
        >
          <cylinderGeometry args={[0.006, 0.008, 0.02, 16]} />
        </mesh>

        <mesh
          position={[0, 0.06, 0]}
          castShadow
          receiveShadow
          material={antennaStickMat}
        >
          <cylinderGeometry args={[0.003, 0.003, 0.1, 8]} />
        </mesh>

        <mesh position={[0, 0.11, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.006, 16, 16]} />
          <meshStandardMaterial
            ref={tipMatRef}
            color={tipColor}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

const eyeMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(2.2, 2.2, 2.2),
  toneMapped: false,
  transparent: true,
});

function RobotMouth({
  isTalking = false,
  color = "#ffffff",
}: {
  isTalking?: boolean;
  color?: string;
}) {
  const mouthRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!mouthRef.current) return;

    const t = clock.getElapsedTime();

    if (isTalking) {
      const flutter =
        Math.sin(t * 22) * 0.45 + Math.sin(t * 37) * 0.35;

      const targetScaleY = THREE.MathUtils.clamp(
        1.1 + flutter,
        0.4,
        2.8,
      );

      const targetScaleX = THREE.MathUtils.clamp(
        1.0 + Math.cos(t * 16) * 0.2,
        0.85,
        1.25,
      );

      mouthRef.current.scale.y = THREE.MathUtils.lerp(
        mouthRef.current.scale.y,
        targetScaleY,
        0.35,
      );

      mouthRef.current.scale.x = THREE.MathUtils.lerp(
        mouthRef.current.scale.x,
        targetScaleX,
        0.35,
      );

      if (matRef.current) {
        const glow = 2.0 + Math.sin(t * 20) * 0.5;
        matRef.current.color.setRGB(glow, glow, glow);
      }
    } else {
      mouthRef.current.scale.y = THREE.MathUtils.lerp(
        mouthRef.current.scale.y,
        0.35,
        0.15,
      );

      mouthRef.current.scale.x = THREE.MathUtils.lerp(
        mouthRef.current.scale.x,
        1.0,
        0.15,
      );

      if (matRef.current) {
        matRef.current.color.setRGB(1.8, 1.8, 1.8);
      }
    }
  });

  return (
    <group ref={mouthRef} position={[0, -0.075, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.007, 0.045, 12, 16]} />
        <meshBasicMaterial
          ref={matRef}
          color={new THREE.Color(2.0, 2.0, 2.0)}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function RobotEye({
  position,
  rotation,
  scale = 1,
  blinkDuration = 0.15,
  blinkCycle = 3.0,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  blinkDuration?: number;
  blinkCycle?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const cycle = clock.getElapsedTime() % blinkCycle;
    let targetScaleY = 1;

    if (cycle < blinkDuration) {
      const progress = cycle / blinkDuration;
      const blinkClose = Math.sin(progress * Math.PI);
      targetScaleY = Math.max(0.05, 1.0 - blinkClose);
    }

    groupRef.current.scale.set(scale, scale * targetScaleY, scale);
  });

  const { topPath, bottomPath } = useMemo(() => {
    const w = 0.025;
    const h = 0.035;
    const r = 0.02;
    const g = 0.005;

    const tPath = new THREE.CurvePath<THREE.Vector3>();

    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w, g, 0),
        new THREE.Vector3(-w, h - r, 0),
      ),
    );

    tPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-w, h - r, 0),
        new THREE.Vector3(-w, h, 0),
        new THREE.Vector3(-w + r, h, 0),
      ),
    );

    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w + r, h, 0),
        new THREE.Vector3(w - r, h, 0),
      ),
    );

    tPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(w - r, h, 0),
        new THREE.Vector3(w, h, 0),
        new THREE.Vector3(w, h - r, 0),
      ),
    );

    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(w, h - r, 0),
        new THREE.Vector3(w, g, 0),
      ),
    );

    const bPath = new THREE.CurvePath<THREE.Vector3>();

    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w, -g, 0),
        new THREE.Vector3(-w, -(h - r), 0),
      ),
    );

    bPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-w, -(h - r), 0),
        new THREE.Vector3(-w, -h, 0),
        new THREE.Vector3(-w + r, -h, 0),
      ),
    );

    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w + r, -h, 0),
        new THREE.Vector3(w - r, -h, 0),
      ),
    );

    bPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(w - r, -h, 0),
        new THREE.Vector3(w, -h, 0),
        new THREE.Vector3(w, -(h - r), 0),
      ),
    );

    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(w, -(h - r), 0),
        new THREE.Vector3(w, -g, 0),
      ),
    );

    return { topPath: tPath, bottomPath: bPath };
  }, []);

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <mesh material={eyeMat}>
        <tubeGeometry args={[topPath, 20, 0.0035, 8, false]} />
      </mesh>

      <mesh material={eyeMat}>
        <tubeGeometry args={[bottomPath, 20, 0.0035, 8, false]} />
      </mesh>
    </group>
  );
}

function generatePbrTexturesAsync(): Promise<{
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const size = 512;
      const canvasC = document.createElement("canvas");
      const canvasB = document.createElement("canvas");

      canvasC.width = canvasB.width = size;
      canvasC.height = canvasB.height = size;

      const ctxC = canvasC.getContext("2d");
      const ctxB = canvasB.getContext("2d");

      if (ctxC && ctxB) {
        ctxC.fillStyle = "#dcdcdc";
        ctxC.fillRect(0, 0, size, size);

        ctxB.fillStyle = "#808080";
        ctxB.fillRect(0, 0, size, size);

        for (let i = 0; i < 10000; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const r = 0.5 + Math.random() * 1.5;
          const isDark = Math.random() > 0.15;

          ctxC.beginPath();
          ctxC.arc(x, y, r, 0, Math.PI * 2);
          ctxC.fillStyle = isDark ? "#222222" : "#dddddd";
          ctxC.fill();

          ctxB.beginPath();
          ctxB.arc(x, y, r, 0, Math.PI * 2);
          ctxB.fillStyle = isDark ? "#000000" : "#ffffff";
          ctxB.fill();
        }
      }

      const texC = new THREE.CanvasTexture(canvasC);
      const texB = new THREE.CanvasTexture(canvasB);

      texC.wrapS = texB.wrapS = THREE.RepeatWrapping;
      texC.wrapT = texB.wrapT = THREE.RepeatWrapping;

      texC.repeat.set(6, 3);
      texB.repeat.set(6, 3);

      texC.needsUpdate = true;
      texB.needsUpdate = true;

      resolve({ colorMap: texC, bumpMap: texB });
    }, 0);
  });
}

function RobotPrototype({
  neckParams = {
    baseR: 0.25,
    baseH: -0.01,
    midR: 0.23,
    midH: 0.02,
    lipBottomR: 0.27,
    lipBottomH: 0.025,
    lipTopR: 0.28,
    lipTopH: 0.05,
    innerR: 0.24,
    innerDropH: 0.03,
  },
  bodyParams = {
    bodyBevelR: 0.21,
    bodyBevelY: 0.38,
    bodyBevelT: 0.015,
  },
  color = "#c4c4c4",
  headColor = "#7DD3FC",
  pantallaColor = "#7DD3FC",
  pantallaBrillo = 1.3,
  blinkCycle = 3.0,
  metalness = 0.0,
  isTalking = false,
}: {
  neckParams?: Record<string, number>;
  bodyParams?: Record<string, number>;
  color?: string;
  headColor?: string;
  pantallaColor?: string;
  pantallaBrillo?: number;
  blinkCycle?: number;
  metalness?: number;
  isTalking?: boolean;
}) {
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const headMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const eyesGroupRef = useRef<THREE.Group>(null);

  const windowPointer = useRef({ x: 0, y: 0 });

  const targetHeadColor = useMemo(
    () => new THREE.Color(headColor),
    [headColor],
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      windowPointer.current.x = x;
      windowPointer.current.y = y;
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  const [textures, setTextures] = useState<{
    colorMap: THREE.CanvasTexture | null;
    bumpMap: THREE.CanvasTexture | null;
  }>({
    colorMap: null,
    bumpMap: null,
  });

  const design = {
    pantallaColor,
    pantallaGrosor: 3.8,
    pantallaBrillo,
    separacionOjos: 0.07,
    tamañoOrejas: 1.3,
    escalaOjos: 1.1,
    parpadeoFrecuencia: blinkCycle,
    parpadeoDuracion: 0.45,
    colorChasis: color,
    alturaCabeza: 0.6,
  };

  useFrame((state, delta) => {
    if (!headRef.current) return;

    const dt = Math.min(delta, 0.1);
    const t = state.clock.getElapsedTime();

    // Muda a cor da própria cabeça suavemente.
    if (headMaterialRef.current) {
      headMaterialRef.current.color.lerp(
        targetHeadColor,
        Math.min(1, dt * 2.5),
      );
    }

    const px = windowPointer.current.x;
    const py = windowPointer.current.y;

    const idleRotY =
      Math.sin(t * 0.45) * 0.045 + Math.sin(t * 1.1) * 0.02;

    const idleRotX = Math.sin(t * 0.65) * 0.025 + 0.01;
    const idleRotZ = Math.cos(t * 0.4) * 0.012;

    const targetHeadRotY = px * 0.48 + idleRotY;
    const targetHeadRotX = -py * 0.3 + idleRotX;
    const targetHeadRotZ = -px * 0.07 + idleRotZ;

    headRef.current.rotation.y = THREE.MathUtils.lerp(
      headRef.current.rotation.y,
      targetHeadRotY,
      dt * 4.5,
    );

    headRef.current.rotation.x = THREE.MathUtils.lerp(
      headRef.current.rotation.x,
      targetHeadRotX,
      dt * 4.5,
    );

    headRef.current.rotation.z = THREE.MathUtils.lerp(
      headRef.current.rotation.z,
      targetHeadRotZ,
      dt * 4.5,
    );

    // Olhos acompanham o cursor.
    if (eyesGroupRef.current) {
      const eyeTargetX = px * 0.022;
      const eyeTargetY = -0.02 + py * 0.017;
      const eyeRotY = px * 0.28;
      const eyeRotX = -py * 0.22;

      eyesGroupRef.current.position.x = THREE.MathUtils.lerp(
        eyesGroupRef.current.position.x,
        eyeTargetX,
        dt * 6.5,
      );

      eyesGroupRef.current.position.y = THREE.MathUtils.lerp(
        eyesGroupRef.current.position.y,
        eyeTargetY,
        dt * 6.5,
      );

      eyesGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        eyesGroupRef.current.rotation.y,
        eyeRotY,
        dt * 6.5,
      );

      eyesGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        eyesGroupRef.current.rotation.x,
        eyeRotX,
        dt * 6.5,
      );
    }
  });

  useEffect(() => {
    let mounted = true;

    let generatedMaps: {
      colorMap: THREE.CanvasTexture;
      bumpMap: THREE.CanvasTexture;
    } | null = null;

    generatePbrTexturesAsync().then((res) => {
      if (mounted) {
        generatedMaps = res;
        setTextures(res);
      } else {
        res.colorMap.dispose();
        res.bumpMap.dispose();
      }
    });

    return () => {
      mounted = false;

      if (generatedMaps) {
        generatedMaps.colorMap.dispose();
        generatedMaps.bumpMap.dispose();
      }
    };
  }, []);

  const neckProfile = useMemo(() => {
    const points = [];

    points.push(new THREE.Vector2(neckParams.innerR, neckParams.baseH));
    points.push(new THREE.Vector2(neckParams.baseR, neckParams.baseH));
    points.push(new THREE.Vector2(neckParams.midR, neckParams.midH));

    points.push(
      new THREE.Vector2(neckParams.lipBottomR, neckParams.lipBottomH),
    );

    points.push(
      new THREE.Vector2(neckParams.lipTopR, neckParams.lipTopH),
    );

    points.push(
      new THREE.Vector2(neckParams.innerR, neckParams.lipTopH),
    );

    points.push(
      new THREE.Vector2(
        neckParams.innerR,
        neckParams.lipTopH - neckParams.innerDropH,
      ),
    );

    return points;
  }, [neckParams]);

  if (!textures.colorMap) return null;

  return (
    <group ref={bodyRef} position={[0, -0.3, 0]}>
      {/* Corpo do robô: mantém a cor original. */}
      <mesh castShadow receiveShadow>
        <sphereGeometry
          args={[
            0.43,
            64,
            64,
            0,
            Math.PI * 2,
            Math.PI * 0.15,
            Math.PI * 0.85,
          ]}
        />

        <meshStandardMaterial
          color={design.colorChasis}
          map={textures.colorMap}
          bumpMap={textures.bumpMap || undefined}
          bumpScale={0.005}
          roughness={1.0}
          metalness={metalness}
          envMapIntensity={0.0}
        />
      </mesh>

      {bodyParams.bodyBevelT > 0 && (
        <mesh
          position={[0, bodyParams.bodyBevelY, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <torusGeometry
            args={[
              bodyParams.bodyBevelR,
              bodyParams.bodyBevelT,
              32,
              64,
            ]}
          />

          <meshStandardMaterial
            color={design.colorChasis}
            map={textures.colorMap}
            bumpMap={textures.bumpMap || undefined}
            bumpScale={0.005}
            roughness={1.0}
            metalness={metalness}
            envMapIntensity={0.0}
          />
        </mesh>
      )}

      <mesh position={[0, 0.38, 0]} receiveShadow castShadow>
        <latheGeometry args={[neckProfile, 64]} />

        <meshStandardMaterial
          color={design.colorChasis}
          map={textures.colorMap}
          bumpMap={textures.bumpMap || undefined}
          bumpScale={0.005}
          roughness={1.0}
          metalness={metalness}
          envMapIntensity={0.0}
        />
      </mesh>

      {/* Cabeça com cor dinâmica conforme o período do dia. */}
      <group ref={headRef} position={[0, design.alturaCabeza, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry
            args={[0.28, 64, 64, 0, Math.PI * 2, 0, Math.PI]}
          />

          <meshStandardMaterial
            ref={headMaterialRef}
            color={headColor}
            roughness={0.45}
            metalness={0.08}
          />
        </mesh>

        <GlassCapsule
          color={design.pantallaColor}
          power={design.pantallaGrosor}
          intensity={design.pantallaBrillo}
        />

        {/* Olhos acompanham o cursor. */}
        <group ref={eyesGroupRef} position={[0, -0.02, 0.29]}>
          <RobotEye
            position={[-design.separacionOjos, 0, 0]}
            rotation={[0, -0.2, 0]}
            scale={design.escalaOjos}
            blinkDuration={design.parpadeoDuracion}
            blinkCycle={design.parpadeoFrecuencia}
          />

          <RobotEye
            position={[design.separacionOjos, 0, 0]}
            rotation={[0, 0.2, 0]}
            scale={design.escalaOjos}
            blinkDuration={design.parpadeoDuracion}
            blinkCycle={design.parpadeoFrecuencia}
          />

          <RobotMouth
            isTalking={isTalking}
            color={design.pantallaColor}
          />
        </group>

        <RobotEar
          position={[-0.29, 0, 0]}
          isLeft
          scale={design.tamañoOrejas}
          tipColor={design.pantallaColor}
        />

        <RobotEar
          position={[0.29, 0, 0]}
          isLeft={false}
          scale={design.tamañoOrejas}
          tipColor={design.pantallaColor}
        />
      </group>
    </group>
  );
}

export interface RobotHeroProps {
  color?: string;
  scale?: number;
  pantallaColor?: string;
  pantallaBrillo?: number;
  blinkCycle?: number;
  metalness?: number;
  isTalking?: boolean;
  className?: string;
}

export function RobotHero({
  color = "#c4c4c4",
  scale = 1.35,
  pantallaColor,
  pantallaBrilho = 1.3,
  blinkCycle = 3.0,
  metalness = 0.0,
  isTalking = false,
  className = "",
}: RobotHeroProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<ThemeColors>(() =>
    getCurrentTheme(),
  );

  // Atualiza o tema a cada minuto e quando a aba volta a ficar visível.
  useEffect(() => {
    const updateTheme = () => {
      setTheme(getCurrentTheme());
    };

    updateTheme();

    const intervalId = window.setInterval(updateTheme, 60_000);

    document.addEventListener("visibilitychange", updateTheme);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", updateTheme);
    };
  }, []);

  const effectivePantallaColor = pantallaColor || theme.primary;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none ${className}`}
    >
      <Canvas
        shadows={false}
        camera={{ position: [0, 0.05, 4.15], fov: 38 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.9} color="#ffffff" />

        <directionalLight
          position={[0, 6, 3]}
          intensity={0.45}
          color="#f4f4f5"
        />

        <directionalLight
          position={[-5, 2, -5]}
          intensity={0.25}
          color="#e4e4e7"
        />

        <Environment preset="studio" blur={0.6} />

        <ResponsiveGroup scale={scale}>
          <RobotPrototype
            neckParams={{
              baseR: 0.215,
              baseH: -0.05,
              midR: 0.28,
              midH: 0.02,
              lipBottomR: 0.295,
              lipBottomH: 0.045,
              lipTopR: 0.27,
              lipTopH: 0.055,
              innerR: 0.1,
              innerDropH: 0.0,
            }}
            bodyParams={{
              bodyBevelR: 0.235,
              bodyBevelY: 0.34,
              bodyBevelT: 0.025,
            }}
            color={color}
            headColor={theme.primary}
            pantallaColor={effectivePantallaColor}
            pantallaBrillo={pantallaBrilho}
            blinkCycle={blinkCycle}
            metalness={metalness}
            isTalking={isTalking}
          />
        </ResponsiveGroup>
      </Canvas>
    </div>
  );
}

export default RobotHero;