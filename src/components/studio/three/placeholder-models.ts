import * as THREE from "three";

import type { PlaceholderKind } from "@/lib/products/config";

/**
 * Stand-in geometry for a product whose GLB has not been supplied yet. Mesh
 * names match `PartConfig.meshNames`, so the scene paints these exactly like a
 * real model. Sizes are roughly two units across, the same scale the decal
 * anchors in `config.ts` are written against.
 */
export function buildPlaceholder(kind: PlaceholderKind): THREE.Group {
  const group = new THREE.Group();
  const add = (name: string, geometry: THREE.BufferGeometry) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
    mesh.name = name;
    group.add(mesh);
    return mesh;
  };

  switch (kind) {
    case "tee":
      add("body", new THREE.BoxGeometry(1.7, 1.9, 0.12, 4, 4, 1));
      break;

    case "mug": {
      add("body", new THREE.CylinderGeometry(0.6, 0.6, 1.6, 64, 1, true));
      const handle = add("handle", new THREE.TorusGeometry(0.34, 0.08, 16, 40, Math.PI));
      handle.position.set(0.62, 0, 0);
      handle.rotation.z = -Math.PI / 2;
      break;
    }

    case "cap": {
      const crown = add(
        "crown",
        new THREE.SphereGeometry(0.9, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      );
      crown.scale.set(1, 0.7, 1);
      const brim = add("brim", new THREE.CylinderGeometry(0.95, 0.95, 0.04, 48));
      brim.scale.set(1, 1, 0.55);
      brim.position.set(0, 0.02, 0.6);
      break;
    }

    case "bottle": {
      add("body", new THREE.CapsuleGeometry(0.45, 1.3, 8, 32));
      const lid = add("lid", new THREE.CylinderGeometry(0.22, 0.22, 0.25, 32));
      lid.position.set(0, 1.17, 0);
      break;
    }
  }

  return group;
}

/** Releases every geometry and material a placeholder created. */
export function disposePlaceholder(group: THREE.Object3D): void {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((m) => m.dispose());
    }
  });
}
