"use client";

import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useReducedMotion } from "framer-motion";

import bottleGlb from "@/assets/models/bottle.glb";
import capGlb from "@/assets/models/cap.glb";
import mugGlb from "@/assets/models/mug.glb";
import shirtGlb from "@/assets/models/shirt.glb";

const BOTTLE_URL = bottleGlb;
// Hovering the hero preloads the other models so their first studio visit is instant.
const OTHER_MODEL_URLS = [capGlb, shirtGlb, mugGlb];
/** drei's autoRotateSpeed of 2 means one revolution per 30s; ~22s keeps it alive. */
const AUTO_ROTATE_SPEED = 2 / (22 / 30);
/** plan.md: colour updates tween over 300ms. */
const COLOUR_TWEEN_S = 0.3;
/** Pointer moves under this many px count as a click (colour cycle), not a drag. */
const CLICK_TOLERANCE_PX = 6;

/**
 * The hero's real-time bottle. Transparent canvas over the poster PNG (which
 * hero.tsx hides once this reports loaded) with a true 360° camera orbit: the
 * idle auto-spin resumes between drags, a full polar range views the bottle
 * from above and below, and a plain click cycles the body colourway.
 * Owned: three.js must never leak into the shared storefront bundle, so the
 * hero mounts this chunk through `next/dynamic` with `ssr: false`.
 */
export function HeroModel({
  onLoaded,
  color,
  onCycleColor,
}: {
  onLoaded?: () => void;
  /** Body colourway (hex) to apply to the bottle's `body` mesh. */
  color: string;
  /** A no-movement pointer-up is a click: the parent advances the colourway. */
  onCycleColor?: () => void;
}) {
  const reduced = !!useReducedMotion();
  const [ready, setReady] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const click = useRef({ active: false, travelled: 0, lastX: 0, lastY: 0 });
  const othersPreloaded = useRef(false);

  useEffect(() => {
    useGLTF.preload(BOTTLE_URL);
  }, []);

  const onCycleRef = useRef(onCycleColor);
  onCycleRef.current = onCycleColor;

  return (
    <SilentErrorBoundary>
      <div
        aria-hidden
        className={`absolute inset-0 [touch-action:pan-y] transition-opacity duration-700 ease-out [&_canvas]:[touch-action:pan-y] ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        onPointerEnter={() => {
          if (othersPreloaded.current) return;
          othersPreloaded.current = true;
          for (const url of OTHER_MODEL_URLS) useGLTF.preload(url);
        }}
        // OrbitControls consumes canvas drags; these wrapper handlers see the
        // same events by bubbling and are only used to tell click from drag.
        onPointerDown={(e) => {
          click.current = { active: true, travelled: 0, lastX: e.clientX, lastY: e.clientY };
        }}
        onPointerMove={(e) => {
          if (!click.current.active) return;
          click.current.travelled += Math.abs(e.clientX - click.current.lastX) + Math.abs(e.clientY - click.current.lastY);
          click.current.lastX = e.clientX;
          click.current.lastY = e.clientY;
        }}
        onPointerUp={() => {
          if (!click.current.active) return;
          click.current.active = false;
          if (click.current.travelled < CLICK_TOLERANCE_PX) onCycleRef.current?.();
        }}
        onPointerCancel={() => {
          click.current.active = false;
        }}
        onDoubleClick={() => controlsRef.current?.reset()}
      >
        <Canvas
          dpr={[1, 2]}
          camera={{ fov: 30, position: [0, 0.35, 2.3] }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          <Suspense fallback={null}>
            <HeroLights />
            <BottleRig
              color={color}
              onLoaded={() => {
                setReady(true);
                onLoaded?.();
              }}
            />
            <ContactShadows
              position={[0, -0.52, 0]}
              opacity={0.45}
              scale={2.6}
              blur={2.4}
              far={1.6}
              resolution={256}
              color="#050505"
            />
            <OrbitControls
              ref={controlsRef}
              makeDefault
              target={[0, 0.02, 0]}
              enablePan={false}
              enableZoom={false}
              enableDamping
              dampingFactor={0.08}
              // Full vertical range: the camera may go over the top and under
              // the bottle (poles are trimmed to avoid a gimbal singularity).
              minPolarAngle={0.2}
              maxPolarAngle={Math.PI - 0.2}
              autoRotate={!reduced && !interacting}
              autoRotateSpeed={AUTO_ROTATE_SPEED}
              onStart={() => setInteracting(true)}
              onEnd={() => setInteracting(false)}
            />
          </Suspense>
        </Canvas>
      </div>
    </SilentErrorBoundary>
  );
}

class SilentErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

function HeroLights() {
  const scene = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(new THREE.WebGLRenderer());
    const map = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return map;
  }, []);
  useEffect(() => () => scene.dispose(), [scene]);

  return (
    <>
      <Environment map={scene} environmentIntensity={0.85} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.3} />
      <directionalLight position={[-3, 1.5, -2.5]} intensity={0.5} color="#d7e7ff" />
      <directionalLight position={[-2, -1, 1.5]} intensity={0.35} color="#c6f135" />
    </>
  );
}

function BottleRig({
  color,
  onLoaded,
}: {
  color: string;
  onLoaded: () => void;
}) {
  const { scene } = useGLTF(BOTTLE_URL);
  // Clone so unmount-time disposal never poisons drei's loader cache.
  const model = useMemo(() => scene.clone(true), [scene]);
  const group = useRef<THREE.Group>(null);

  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;
  useEffect(() => {
    onLoadedRef.current();
  }, [model]);

  // Body material takes the selected colourway; lid and trim keep the baked
  // graphite/lime look so the bottle stays recognisable in every colourway.
  // Created once — later colourway changes tween this material, not replace it.
  const latestColor = useRef(color);
  latestColor.current = color;
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: latestColor.current,
        roughness: 0.5,
        metalness: 0.35,
      }),
    [],
  );
  useEffect(() => () => bodyMaterial.dispose(), [bodyMaterial]);
  useLayoutEffect(() => {
    const body = model.getObjectByName("body");
    if (body instanceof THREE.Mesh) body.material = bodyMaterial;
  }, [model, bodyMaterial]);

  const targetColor = useRef(new THREE.Color(color));
  useEffect(() => {
    targetColor.current.set(color);
  }, [color]);

  useFrame((_, delta) => {
    // Colourway tween keeps a click from snapping the body colour.
    bodyMaterial.color.lerp(targetColor.current, Math.min(1, delta / COLOUR_TWEEN_S));
  });

  // The camera orbits (OrbitControls); the bottle itself stays put.
  return (
    // `position` centres the normalised model (base at y=0, height 1) on origin.
    <group position={[0, -0.48, 0]} ref={group}>
      <primitive object={model} />
    </group>
  );
}
