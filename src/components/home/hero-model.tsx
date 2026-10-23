"use client";

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useReducedMotion } from "framer-motion";

const BOTTLE_URL = "/models/bottle.glb";
// Hovering the hero preloads the other models so their first studio visit is instant.
const OTHER_MODEL_URLS = ["/models/cap.glb", "/models/shirt.glb", "/models/mug.glb"];
/** ~22s per revolution keeps the bottle alive without reading as an ad spin. */
const SPIN_RAD_PER_SEC = (Math.PI * 2) / 22;
/** Dragging the full card width turns the bottle this far. */
const DRAG_TURN_RADIANS = Math.PI * 1.4;
const RESET_SECONDS = 0.8;

type DragState = {
  dragging: boolean;
  lastX: number;
  lastWidth: number;
  /** Pointer movement (px) accumulated since the last frame, consumed in useFrame. */
  dragDelta: number;
  /** Smoothed drag speed in rad/s, handed to `inertia` on release. */
  velocity: number;
  inertia: number;
  reset: { from: number; to: number; t: number } | null;
  spin: number;
};

function createDragState(): DragState {
  return {
    dragging: false,
    lastX: 0,
    lastWidth: 0,
    dragDelta: 0,
    velocity: 0,
    inertia: 0,
    reset: null,
    spin: 0,
  };
}

/**
 * The hero's real-time bottle. Transparent canvas over the poster PNG (which
 * hero.tsx hides once this reports loaded), slow spin with pointer drag +
 * inertia, double-click to reface, subtle parallax tilt, contact shadow.
 * Owned: three.js must never leak into the shared storefront bundle, so the
 * hero mounts this chunk through `next/dynamic` with `ssr: false`.
 */
export function HeroModel({ onLoaded }: { onLoaded?: () => void }) {
  const reduced = !!useReducedMotion();
  const [ready, setReady] = useState(false);
  const dragRef = useRef<DragState>(createDragState());
  const othersPreloaded = useRef(false);

  useEffect(() => {
    useGLTF.preload(BOTTLE_URL);
  }, []);

  const drag = dragRef.current;

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
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          drag.dragging = true;
          drag.lastX = e.clientX;
          drag.velocity = 0;
          drag.inertia = 0;
          drag.reset = null;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.dragging) return;
          drag.lastWidth = e.currentTarget.getBoundingClientRect().width || 1;
          drag.dragDelta += e.clientX - drag.lastX;
          drag.lastX = e.clientX;
        }}
        onPointerUp={(e) => {
          if (!drag.dragging) return;
          drag.dragging = false;
          drag.inertia = drag.velocity;
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={(e) => {
          drag.dragging = false;
          drag.inertia = 0;
          if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onDoubleClick={() => {
          const tau = Math.PI * 2;
          const target = Math.round(drag.spin / tau) * tau;
          drag.inertia = 0;
          if (reduced) {
            drag.spin = target;
            return;
          }
          drag.reset = { from: drag.spin, to: target, t: 0 };
        }}
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
              dragRef={dragRef}
              reduced={reduced}
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
  dragRef,
  reduced,
  onLoaded,
}: {
  dragRef: RefObject<DragState>;
  reduced: boolean;
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

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const drag = dragRef.current;

    if (drag.reset) {
      drag.reset.t = Math.min(1, drag.reset.t + delta / RESET_SECONDS);
      const eased = 1 - Math.pow(1 - drag.reset.t, 3);
      drag.spin = drag.reset.from + (drag.reset.to - drag.reset.from) * eased;
      if (drag.reset.t >= 1) drag.reset = null;
    } else if (drag.dragging) {
      const gain = drag.lastWidth ? DRAG_TURN_RADIANS / drag.lastWidth : 0.01;
      drag.spin += drag.dragDelta * gain;
      const instant = delta > 0 ? (drag.dragDelta * gain) / delta : 0;
      drag.velocity += (instant - drag.velocity) * Math.min(1, delta * 12);
      drag.dragDelta = 0;
    } else if (Math.abs(drag.inertia) > 0.03) {
      drag.spin += drag.inertia * delta;
      drag.inertia *= Math.exp(-2.6 * delta);
    } else {
      drag.inertia = 0;
      if (!reduced) drag.spin += SPIN_RAD_PER_SEC * delta;
    }

    g.rotation.y = drag.spin;
    // Parallax: a few degrees of tilt toward the pointer.
    const tilt = reduced ? 0 : Math.max(-0.09, Math.min(0.09, state.pointer.y * -0.06));
    g.rotation.x += (tilt - g.rotation.x) * Math.min(1, delta * 4);
  });

  return (
    // `position` centres the normalised model (base at y=0, height 1) on origin.
    <group position={[0, -0.48, 0]}>
      <group ref={group}>
        <primitive object={model} />
      </group>
    </group>
  );
}
