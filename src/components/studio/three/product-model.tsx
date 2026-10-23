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
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";

import type { ProductConfig } from "@/lib/products/config";
import type { Configuration } from "@/lib/products/configuration";
import { buildPlaceholder } from "@/components/studio/three/placeholder-models";
import type { ModelSource } from "@/components/studio/three/use-model-source";

/** plan.md: material updates tween over 300ms. */
const TWEEN_MS = 300;

/**
 * Parsed GLBs per URL, shared across mounts. StrictMode remounts the canvas
 * once in dev: without this cache the second mount refetches (and that request
 * can wedge against the dev static pipeline), so the model that just rendered
 * is torn down and never comes back — "appears then disappears". With the
 * cache a remount reuses the already-parsed scene immediately. Failed loads
 * evict so a later mount can retry.
 */
const glbCache = new Map<string, Promise<GLTF>>();

function loadGlb(url: string): Promise<GLTF> {
  const cached = glbCache.get(url);
  if (cached) return cached;
  // Fetch + parse bypasses FileLoader (its request/signal stack stalled in the
  // field); parse() is pure and the GLBs are self-contained, so no path needed.
  const load = new Promise<GLTF>((resolve, reject) => {
    fetch(url, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(
        (buffer) => new Promise<GLTF>((res, rej) => new GLTFLoader().parse(buffer, "", res, rej)),
      )
      .then(resolve, reject);
  });
  glbCache.set(url, load);
  load.catch(() => glbCache.delete(url));
  return load;
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
    <GlbErrorBoundary fallback={<PlaceholderModel {...props} />}>
      <GlbModelInner {...props} />
    </GlbErrorBoundary>
  );
}

function GlbModelInner(props: ModelShellProps) {
  // Manual load instead of `useLoader`: r3f's suspense cache aborts a load when
  // its boundary unmounts mid-flight (StrictMode re-mounts do exactly that),
  // leaving a forever-suspended entry — a blank stage with no error surfaced.
  // A local load owns its lifecycle; the module cache (see loadGlb) makes a
  // remount reuse the same parse instead of refetching.
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setGltf(null);
    setFailed(false);
    let settled = false;
    const watchdog = window.setTimeout(() => {
      if (!cancelled && !settled) setFailed(true);
    }, 20000);
    loadGlb(props.product.model.glb)
      .then((data) => {
        settled = true;
        clearTimeout(watchdog);
        if (!cancelled) setGltf(data);
      })
      .catch(() => {
        settled = true;
        clearTimeout(watchdog);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      clearTimeout(watchdog);
    };
  }, [props.product.model.glb]);

  if (failed) throw new Error(`GLB failed to load: ${props.product.model.glb}`);
  // Hooks stay unconditional: the clone memo runs on every render of the mount.
  const root = useMemo(() => (gltf ? gltf.scene.clone(true) : null), [gltf]);
  if (!gltf || !root) return null;
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

  useEffect(() => {
    const group = groupRef.current;
    const mats = materials.current;
    const decals = decalMeshes.current;
    return () => {
      decals.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      mats.forEach((m) => m.dispose());
      decalTexture.current?.dispose();
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
