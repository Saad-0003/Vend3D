"use client";

import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";

import type { ProductConfig } from "@/lib/products/config";
import { productConfigs } from "@/lib/products/config";
import type { Configuration } from "@/lib/products/configuration";
import { buildPlaceholder } from "@/components/studio/three/placeholder-models";
import type { ModelSource } from "@/components/studio/three/use-model-source";
import {
  invalidateGlb,
  loadWithRetry,
  markGlbFailed,
  setGlbAttempt,
  setGlbProgress,
  startGlbLoad,
} from "@/lib/studio/glb";

/** plan.md: material updates tween over 300ms. */
const TWEEN_MS = 300;

/**
 * Parsed GLB entries per URL, shared across mounts and kicked off at MODULE
 * INIT (see the prefetch below): on this machine a GLB fetch resolves reliably
 * only when it is already complete before this page's WebGL work (the
 * environment bake) runs — a fetch that starts or completes while
 * PMREMGenerator.fromScene is synchronously rendering wedges at the renderer's
 * fetch scheduler (the promise never resolves even though the bytes were
 * delivered), which left the studio stage blank in dev. The hero dodges this
 * by preloading in an effect before the r3f root renders; the studio uses a
 * module-init prefetch over build-time-constant asset URLs. StrictMode
 * remounts reuse the pending/ready entry instead of refetching ("appears then
 * disappears"). Failed loads evict so a later mount can retry.
 */
const glbEntries = new Map<
  string,
  { promise: Promise<GLTF>; status: "pending" | "ok" | "err"; result?: GLTF; error?: unknown }
>();

/**
 * Streams the GLB so the stage can show real byte progress, and hands the
 * parsed mesh back. The response body is concatenated by hand because
 * `arrayBuffer()` reports nothing until it is done.
 */
async function fetchGlb(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(url, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const header = Number(response.headers.get("content-length"));
  const total = Number.isFinite(header) && header > 0 ? header : null;
  const body = response.body;
  if (!body) return response.arrayBuffer();

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    loaded += value.byteLength;
    setGlbProgress(url, loaded, total);
  }

  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes.buffer;
}

function loadGlbEntry(url: string) {
  let entry = glbEntries.get(url);
  if (entry) return entry;

  // Fetch + parse bypasses FileLoader (its request/signal stack stalled in the
  // field); parse() is pure and the GLBs are self-contained, so no path needed.
  // `loadWithRetry` owns the 20s budget and the two short-backoff retries, so a
  // hanging or failing asset can never hold the Suspense boundary forever.
  startGlbLoad(url);
  let attemptCount = 0;
  const promise = loadWithRetry(async (signal) => {
    attemptCount += 1;
    if (attemptCount > 1) setGlbAttempt(url, attemptCount);
    const buffer = await fetchGlb(url, signal);
    return new Promise<GLTF>((resolve, reject) => new GLTFLoader().parse(buffer, "", resolve, reject));
  });
  entry = { promise, status: "pending" };
  glbEntries.set(url, entry);
  promise.then(
    (result) => {
      entry.status = "ok";
      entry.result = result;
    },
    (error) => {
      entry.status = "err";
      entry.error = error;
      glbEntries.delete(url);
      markGlbFailed(url);
    },
  );
  return entry;
}

/**
 * Manual retry from the stage: drop both the parsed cache and the shared load
 * state, then let the next render start a fresh attempt.
 */
export function retryGlb(url: string) {
  glbEntries.delete(url);
  invalidateGlb(url);
}

// Module-init prefetch: begin loading every bundled GLB the moment this chunk
// evaluates — long before the studio's environment bake runs, which is when a
// fetch would otherwise wedge (see glbEntries). The GLB URLs are build-time
// constants, so this is safe at module scope. ~230 KB total, lazy chunk only.
// Server side (SSR of client components) there is no fetch/window: skipped.
if (typeof window !== "undefined") {
  for (const config of productConfigs) loadGlbEntry(config.model.glb);
}

/** Suspends on the render-time GLB entry; throws through the boundary on error. */
function useGltfEntry(url: string): GLTF {
  const entry = loadGlbEntry(url);
  if (entry.status === "pending") throw entry.promise;
  if (entry.status === "err") throw new Error(`GLB failed to load: ${String(entry.error)}`);
  return entry.result as GLTF;
}

/** Roughness for a finish value: glossy (100) is 0.12, matte (0) is 0.9. */
export function roughnessFromFinish(finish: number): number {
  return THREE.MathUtils.lerp(0.9, 0.12, finish / 100);
}

type Target = { color: THREE.Color; roughness: number };

/**
 * Renders the product: a GLB when `source` is `glb`, otherwise the placeholder
 * primitive for the product type. Every part's material is tweened to its
 * configured colour and finish, and decal/engraving overlays are rebuilt when
 * the configuration changes. Geometry, materials and textures are disposed on
 * unmount.
 */
export function ProductModel({
  product,
  configuration,
  source,
  decalUrl,
  onReady,
}: {
  product: ProductConfig;
  configuration: Configuration;
  source: Exclude<ModelSource, "checking">;
  decalUrl: string | null;
  onReady?: () => void;
}) {
  return (
    <Suspense fallback={null}>
      {source === "glb" ? (
        <GlbModel
          product={product}
          configuration={configuration}
          decalUrl={decalUrl}
          onReady={onReady}
        />
      ) : (
        <PlaceholderModel
          product={product}
          configuration={configuration}
          decalUrl={decalUrl}
          onReady={onReady}
        />
      )}
    </Suspense>
  );
}

/**
 * A GLB that exists but fails to parse must not take the canvas down. The
 * error boundary swaps in the placeholder, so the stage always shows something.
 */
class GlbErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function GlbModel(props: ModelShellProps) {
  return (
    // The fallback must not report "ready": the stage's overlay reads the real
    // load state (failed) and offers a manual retry instead of fading out.
    <GlbErrorBoundary fallback={<PlaceholderModel {...props} onReady={undefined} />}>
      <GlbModelInner {...props} />
    </GlbErrorBoundary>
  );
}

function GlbModelInner(props: ModelShellProps) {
  // Render-time suspension over the module-level entry (useGltfEntry): the
  // fetch starts during render, exactly like the hero's useGLTF, and a
  // StrictMode remount awaits the same entry instead of refetching. An
  // effect-time fetch reliably stalled on this machine in dev.
  const gltf = useGltfEntry(props.product.model.glb);
  const root = useMemo(() => gltf.scene.clone(true), [gltf]);
  return <ModelShell {...props} root={root} owned />;
}

function PlaceholderModel(props: ModelShellProps) {
  const root = useMemo(
    () => buildPlaceholder(props.product.placeholder),
    [props.product.placeholder],
  );
  return <ModelShell {...props} root={root} owned />;
}

type ModelShellProps = {
  product: ProductConfig;
  configuration: Configuration;
  decalUrl: string | null;
  onReady?: () => void;
};

/**
 * Draws the engraved text onto a transparent canvas in the selected font and
 * colour. Returns null when the text is empty or 2D canvas is unavailable.
 */
function makeEngraveTexture(
  engrave: Configuration["engrave"],
  fonts: ProductConfig["engrave"]["fonts"],
): THREE.CanvasTexture | null {
  const text = engrave.text.trim();
  if (!text) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const css = fonts.find((f) => f.id === engrave.font)?.css ?? "Georgia, serif";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = engrave.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Size follows the size slider; the width cap keeps long text inside the zone.
  const maxWidth = canvas.width * 0.86 * (engrave.sizePct / 100);
  let px = canvas.height * 0.34;
  ctx.font = `600 ${px}px ${css}`;
  const measured = ctx.measureText(text).width;
  if (measured > maxWidth) {
    px = Math.max(16, px * (maxWidth / measured));
    ctx.font = `600 ${px}px ${css}`;
  }
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Shared shell for both sources: normalises scale and centres the model on the
 * floor, applies the part materials and places decal and engraving overlays.
 */
function ModelShell({
  product,
  configuration,
  decalUrl,
  onReady,
  root,
}: ModelShellProps & { root: THREE.Object3D; owned: true }) {
  const groupRef = useRef<THREE.Group>(null);
  const targets = useRef(new Map<string, Target>());
  const materials = useRef(new Map<string, THREE.MeshStandardMaterial>());
  const decalTexture = useRef<THREE.Texture | null>(null);
  const decalMeshes = useRef<THREE.Mesh[]>([]);
  const engraveTexture = useRef<THREE.Texture | null>(null);
  const engraveMeshes = useRef<THREE.Mesh[]>([]);

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;
    const fit = (2.2 / longest) * product.model.scale;
    // SETScalar, not multiply: StrictMode re-runs this effect in dev and a
    // run twice would compound. A fresh clone starts at scale 1.
    root.scale.setScalar(fit);
    // Centre the mid-box on the origin (no floor resting): the cameras,
    // ContactShadows plane and decal anchors are authored for the placeholder
    // convention — a model centred at the origin with the shadow just beneath.
    const centred = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
    root.position.sub(centred);
  }, [root, product.model.scale]);

  useLayoutEffect(() => {
    const mats = materials.current;
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const part = product.parts.find((p) => p.meshNames.includes(obj.name));
      if (!part) return;
      const material = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 });
      obj.material = material;
      mats.set(part.id, material);
    });
    onReady?.();
    return () => {
      mats.clear();
    };
  }, [root, product.parts, onReady]);

  useEffect(() => {
    for (const part of product.parts) {
      const cfg = configuration.parts[part.id];
      if (!cfg) continue;
      targets.current.set(part.id, {
        color: new THREE.Color(cfg.color),
        roughness: roughnessFromFinish(cfg.finish),
      });
    }
  }, [configuration.parts, product.parts]);

  useFrame((_, delta) => {
    const step = Math.min(1, delta / (TWEEN_MS / 1000));
    for (const [partId, target] of targets.current) {
      const material = materials.current.get(partId);
      if (!material) continue;
      material.color.lerp(target.color, step);
      material.roughness = THREE.MathUtils.lerp(material.roughness, target.roughness, step);
      // Rougher surfaces reflect the room probe dimmer and softer; glossier ones
      // pick up more of it. Without this the roughness change reads as a flat
      // colour shift instead of a matte→shiny response.
      const env = 0.35 + (1 - target.roughness) * 1.35;
      material.envMapIntensity = THREE.MathUtils.lerp(material.envMapIntensity, env, step);
    }
  });

  useEffect(() => {
    decalMeshes.current.forEach((m) => {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
      m.parent?.remove(m);
    });
    decalMeshes.current = [];
    decalTexture.current?.dispose();
    decalTexture.current = null;

    const decal = configuration.decal;
    const zone = product.decal.zones.find((z) => z.id === decal?.zone);
    if (!decal || !zone || !decalUrl || !groupRef.current) return;

    let cancelled = false;
    new THREE.TextureLoader().load(decalUrl, (t) => {
      if (cancelled) return;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      const target = root.getObjectByName(
        product.parts.find((p) => p.id === zone.partId)?.meshNames[0] ?? "",
      );
      if (!(target instanceof THREE.Mesh) || !groupRef.current) return;

      const [w, h] = zone.maxSize;
      const scale = new THREE.Vector3(w * decal.scale, h * decal.scale, 1);
      const position = new THREE.Vector3(...zone.anchor.position).add(
        new THREE.Vector3(decal.offsetX * w * 0.5, decal.offsetY * h * 0.5, 0),
      );
      const orientation = new THREE.Euler(0, 0, THREE.MathUtils.degToRad(decal.rotation));
      const helper = new THREE.Object3D();
      helper.position.copy(position);
      helper.lookAt(position.clone().add(new THREE.Vector3(...zone.anchor.normal)));
      helper.rotation.z += orientation.z;

      const geometry = new DecalGeometry(target, helper.position, helper.rotation, scale);
      const material = new THREE.MeshStandardMaterial({
        map: t,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: 0.7,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = "decal";
      groupRef.current.add(mesh);
      decalMeshes.current.push(mesh);
      decalTexture.current = t;
    });

    return () => {
      cancelled = true;
    };
  }, [configuration.decal, decalUrl, product.decal.zones, product.parts, root]);

  // Engraving: the text is drawn into a transparent texture in the selected
  // font and colour, then projected onto the part's front zone (the decal zone
  // anchor of the same part supplies the surface point and size).
  const engrave = configuration.engrave;
  useEffect(() => {
    engraveMeshes.current.forEach((m) => {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
      m.parent?.remove(m);
    });
    engraveMeshes.current = [];
    engraveTexture.current?.dispose();
    engraveTexture.current = null;

    const zone = product.engrave.zones[0];
    if (!engrave.enabled || !zone || !groupRef.current) return;

    const surface = product.decal.zones.find((z) => z.partId === zone.partId);
    const target = root.getObjectByName(
      product.parts.find((p) => p.id === zone.partId)?.meshNames[0] ?? "",
    );
    if (!surface || !(target instanceof THREE.Mesh)) return;

    const texture = makeEngraveTexture(engrave, product.engrave.fonts);
    if (!texture) return;

    const [w] = surface.maxSize;
    const scale = new THREE.Vector3(w * 0.9, (w * 0.9) / 2, 1);
    const normal = new THREE.Vector3(...surface.anchor.normal).normalize();
    // Sink with the configured depth so the engraving reads as an etch, and
    // keep it in front of the decal's own polygon offset.
    const position = new THREE.Vector3(...surface.anchor.position).addScaledVector(
      normal,
      -engrave.depthMm * 0.06,
    );
    const helper = new THREE.Object3D();
    helper.position.copy(position);
    helper.lookAt(position.clone().add(normal));

    const geometry = new DecalGeometry(target, helper.position, helper.rotation, scale);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -6,
      roughness: 0.45,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "engrave";
    groupRef.current.add(mesh);
    engraveMeshes.current.push(mesh);
    engraveTexture.current = texture;
  }, [engrave, product.decal.zones, product.engrave.fonts, product.engrave.zones, product.parts, root]);

  useEffect(() => {
    const group = groupRef.current;
    const mats = materials.current;
    const decals = decalMeshes.current;
    const engravings = engraveMeshes.current;
    return () => {
      decals.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      engravings.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      mats.forEach((m) => m.dispose());
      decalTexture.current?.dispose();
      engraveTexture.current?.dispose();
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
      if (group) group.clear();
    };
  }, [root]);

  return (
    <group ref={groupRef}>
      <primitive object={root} />
    </group>
  );
}
