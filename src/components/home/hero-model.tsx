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
/** Dragging the full card width turns the bottle this far (yaw and pitch both). */
const DRAG_TURN_RADIANS = Math.PI * 1.4;
/** Viewing from above/below is clamped so the bottle never flips upside down. */
const PITCH_LIMIT = 0.95;
const RESET_SECONDS = 0.8;
/** plan.md: material/colour updates tween over 300ms. */
const TWEEN_MS = 300;
/** Pointer moves under this many px count as a click (colour cycle), not a drag. */
const CLICK_TOLERANCE_PX = 6;

type DragState = {
  dragging: boolean;
  lastX: number;
  lastY: number;
  lastWidth: number;
  lastHeight: number;
  /** Pointer movement (px) accumulated since the last frame, consumed in useFrame. */
  dragDeltaX: number;
  dragDeltaY: number;
  /** Total pointer travel since pointer-down, for the click-vs-drag split. */
  travelled: number;
  /** Yaw (unclamped) and pitch (clamped to PITCH_LIMIT), both radians. */
  spin: number;
  pitch: number;
  /** Smoothed drag speed in rad/s, handed to `inertia` on release. */
  velocity: number;
  inertia: number;
  reset: { from: number; fromPitch: number; t: number } | null;
};

function createDragState(): DragState {
  return {
    dragging: false,
    lastX: 0,
    lastY: 0,
    lastWidth: 0,
    lastHeight: 0,
    dragDeltaX: 0,
    dragDeltaY: 0,
    travelled: 0,
    spin: 0,
    pitch: 0,
    velocity: 0,
    inertia: 0,
    reset: null,
  };
}

/**
 * The hero's real-time bottle. Transparent canvas over the poster PNG (which
 * hero.tsx hides once this reports loaded), slow spin with pointer drag +
 * inertia, vertical drag orbits the pitch so the bottle can be viewed from
 * above or below, a plain click cycles the body colourway, double-click to
 * reface. Owned: three.js must never leak into the shared storefront bundle,
 * so the hero mounts this chunk through `next/dynamic` with `ssr: false`.
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
  const dragRef = useRef<DragState>(createDragState());
  const othersPreloaded = useRef(false);

  useEffect(() => {
    useGLTF.preload(BOTTLE_URL);
  }, []);

  const drag = dragRef.current;
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
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          drag.dragging = true;
          drag.lastX = e.clientX;
          drag.lastY = e.clientY;
          drag.lastWidth = e.currentTarget.getBoundingClientRect().width || 1;
          drag.lastHeight = e.currentTarget.getBoundingClientRect().height || 1;
          drag.travelled = 0;
          drag.velocity = 0;
          drag.inertia = 0;
          drag.reset = null;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.dragging) return;
          const dx = e.clientX - drag.lastX;
          const dy = e.clientY - drag.lastY;
          drag.travelled += Math.abs(dx) + Math.abs(dy);
          drag.dragDeltaX += dx;
          drag.dragDeltaY += dy;
          drag.lastX = e.clientX;
          drag.lastY = e.clientY;
        }}
        onPointerUp={(e) => {
          if (!drag.dragging) return;
          drag.dragging = false;
          if (drag.travelled < CLICK_TOLERANCE_PX) {
            // A click on the bottle itself: advance the colourway.
            drag.inertia = 0;
            onCycleRef.current?.();
          } else {
            drag.inertia = drag.velocity;
          }
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
          const targetSpin = Math.round(drag.spin / tau) * tau;
          drag.inertia = 0;
          if (reduced) {
            drag.spin = targetSpin;
            drag.pitch = 0;
            return;
          }
          drag.reset = { from: drag.spin, fromPitch: drag.pitch, t: 0 };
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
  color,
  onLoaded,
}: {
  dragRef: RefObject<DragState>;
  reduced: boolean;
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
    const g = group.current;
    if (!g) return;
    const drag = dragRef.current;

    if (drag.reset) {
      const tau = Math.PI * 2;
      drag.reset.t = Math.min(1, drag.reset.t + delta / RESET_SECONDS);
      const eased = 1 - Math.pow(1 - drag.reset.t, 3);
      const targetSpin = Math.round(drag.reset.from / tau) * tau;
      drag.spin = drag.reset.from + (targetSpin - drag.reset.from) * eased;
      drag.pitch = drag.reset.fromPitch * (1 - eased);
      if (drag.reset.t >= 1) drag.reset = null;
    } else if (drag.dragging) {
      const yawGain = drag.lastWidth ? DRAG_TURN_RADIANS / drag.lastWidth : 0.01;
      const pitchGain = drag.lastHeight ? DRAG_TURN_RADIANS / drag.lastHeight : 0.01;
      drag.spin += drag.dragDeltaX * yawGain;
      // OrbitControls convention: dragging down brings the camera above the
      // bottle (top tips toward the viewer), dragging up goes underneath.
      drag.pitch = THREE.MathUtils.clamp(
        drag.pitch + drag.dragDeltaY * pitchGain,
        -PITCH_LIMIT,
        PITCH_LIMIT,
      );
      const instant = delta > 0 ? (drag.dragDeltaX * yawGain) / delta : 0;
      drag.velocity += (instant - drag.velocity) * Math.min(1, delta * 12);
      drag.dragDeltaX = 0;
      drag.dragDeltaY = 0;
    } else if (Math.abs(drag.inertia) > 0.03) {
      drag.spin += drag.inertia * delta;
      drag.inertia *= Math.exp(-2.6 * delta);
    } else {
      drag.inertia = 0;
      if (!reduced) drag.spin += SPIN_RAD_PER_SEC * delta;
    }

    // Yaw is free; pitch eases toward its (clamped) target for weight. Dragging
    // up turns the camera above the bottle, dragging down below it.
    g.rotation.y = drag.spin;
    g.rotation.x += (drag.pitch - g.rotation.x) * Math.min(1, delta * 10);

    // Colourway tween keeps a click from snapping the body colour.
    bodyMaterial.color.lerp(targetColor.current, Math.min(1, delta / (TWEEN_MS / 1000)));
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
