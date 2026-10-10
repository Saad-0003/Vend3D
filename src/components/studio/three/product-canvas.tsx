"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { CameraPresetKey, ProductConfig } from "@/lib/products/config";
import type { Configuration } from "@/lib/products/configuration";
import { ProductModel } from "@/components/studio/three/product-model";
import type { ModelSource } from "@/components/studio/three/use-model-source";

/** plan.md §Phase 5: cap device pixel ratio at 2 for the viewer. */
const DPR: [number, number] = [1, 2];
/** Auto-rotate resumes after this much idle time, per the studio spec. */
export const AUTO_ROTATE_RESUME_MS = 4_000;
const ZOOM_MIN = 2;
const ZOOM_MAX = 8;

export type CanvasHandle = {
  reset: () => void;
  zoom: (direction: 1 | -1) => void;
  preset: (key: CameraPresetKey) => void;
  capture: () => string | null;
};

/**
 * The 3D stage. The screen loads it through `next/dynamic` with `ssr: false`,
 * so three.js stays out of the shared storefront bundle (AGENTS §6.5). The
 * parent drives camera actions through `handle`, and `onInteract` fires on
 * every user orbit so the parent can pause auto-rotate.
 */
export default function ProductCanvas({
  product,
  configuration,
  source,
  decalUrl,
  autoRotate,
  onReady,
  onInteract,
  handle,
}: {
  product: ProductConfig;
  configuration: Configuration;
  source: Exclude<ModelSource, "checking">;
  decalUrl: string | null;
  autoRotate: boolean;
  onReady?: () => void;
  onInteract?: () => void;
  handle: MutableRefObject<CanvasHandle | null>;
}) {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    const probe = document.createElement("canvas");
    setWebgl(!!(probe.getContext("webgl2") || probe.getContext("webgl")));
  }, []);

  if (webgl === null) return null;

  if (webgl === false) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-center">
        <p className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
          3D preview needs WebGL. Try a current browser, or open this page on a desktop.
        </p>
      </div>
    );
  }

  return (
    <Canvas
      dpr={DPR}
      camera={{ position: product.model.cameraPresets.front, fov: 35 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <StudioEnvironment />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 2]} intensity={1.1} />
      <directionalLight position={[-3, 2, -3]} intensity={0.5} color="#d7e7ff" />
      <Suspense fallback={null}>
        <ProductModel
          product={product}
          configuration={configuration}
          source={source}
          decalUrl={decalUrl}
          onReady={onReady}
        />
      </Suspense>
      <ContactShadows position={[0, -1.15, 0]} opacity={0.5} scale={6} blur={2.4} far={3} />
      <CameraRig
        product={product}
        autoRotate={autoRotate}
        onInteract={onInteract}
        handle={handle}
      />
    </Canvas>
  );
}

/**
 * Soft studio light from the bundled RoomEnvironment. Local, so the viewer never
 * waits on a remote HDR. The scene is built once and disposed with the canvas.
 */
function StudioEnvironment() {
  const scene = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(new THREE.WebGLRenderer());
    return pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }, []);
  useEffect(() => () => scene.dispose(), [scene]);
  return <Environment map={scene} environmentIntensity={0.6} />;
}

function CameraRig({
  product,
  autoRotate,
  onInteract,
  handle,
}: {
  product: ProductConfig;
  autoRotate: boolean;
  onInteract?: () => void;
  handle: MutableRefObject<CanvasHandle | null>;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const controls = useRef<OrbitControlsImpl | null>(null);
  const motion = useRef<number | null>(null);

  useEffect(() => {
    const cancelMotion = () => {
      if (motion.current !== null) cancelAnimationFrame(motion.current);
      motion.current = null;
    };

    const glide = (to: THREE.Vector3, duration = 700) => {
      const c = controls.current;
      if (!c) return;
      cancelMotion();
      const from = camera.position.clone();
      const started = performance.now();
      const frame = () => {
        const t = Math.min(1, (performance.now() - started) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        camera.position.lerpVectors(from, to, eased);
        c.update();
        motion.current = t < 1 ? requestAnimationFrame(frame) : null;
      };
      motion.current = requestAnimationFrame(frame);
    };

    handle.current = {
      reset: () => glide(new THREE.Vector3(...product.model.cameraPresets.front)),
      preset: (key) => glide(new THREE.Vector3(...product.model.cameraPresets[key])),
      zoom: (direction) => {
        const c = controls.current;
        if (!c) return;
        const offset = camera.position.clone().sub(c.target);
        const dist = THREE.MathUtils.clamp(
          offset.length() * (direction === 1 ? 0.85 : 1.18),
          ZOOM_MIN,
          ZOOM_MAX,
        );
        glide(c.target.clone().add(offset.normalize().multiplyScalar(dist)), 300);
      },
      // `preserveDrawingBuffer` is on, so the last frame is still readable here.
      capture: () => gl.domElement.toDataURL("image/png"),
    };
    return () => {
      cancelMotion();
      handle.current = null;
    };
  }, [camera, gl, handle, product.model.cameraPresets]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={ZOOM_MIN}
      maxDistance={ZOOM_MAX}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 1.8}
      autoRotate={autoRotate}
      autoRotateSpeed={product.model.autoRotateSpeed}
      onStart={onInteract}
    />
  );
}
