import { products } from "@/lib/catalog";
import { getProductConfig, type DecalMethod, type ProductConfig } from "@/lib/products/config";
import {
  type AdminCategory,
  type AdminPart,
  type AdminProduct,
} from "@/lib/admin/product-schema";

/**
 * Pure admin-product helpers (plan.md Phase 1B U5). Slug generation, list
 * selection and the preview-config bridge live here so they are unit-testable
 * without a DOM, in the same shape `lib/orders/history.ts` and
 * `lib/designs/library.ts` use for their screens.
 */

/** `Heavyweight Boxy Tee!` → `heavyweight-boxy-tee`. Empty name → empty slug. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** `slug`, `slug-2`, `slug-3`… skipping anything the catalog or storage already holds. */
export function uniqueSlug(base: string, takenIds: string[]): string {
  if (!takenIds.includes(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;
    if (!takenIds.includes(candidate)) return candidate;
  }
}

export type AdminProductFilters = {
  query: string;
  category: AdminCategory | "All";
  status: string; // a status value or "all"
};

const ALL_STATUSES = "all";

/** Newest edit first; a `-d` suffix (+1) keeps duplicates right behind their original. */
export function selectAdminProducts(
  list: AdminProduct[],
  { query, category, status }: AdminProductFilters,
): AdminProduct[] {
  const needle = query.trim().toLowerCase();
  return list
    .filter((product) => {
      if (category !== "All" && product.category !== category) return false;
      if (status !== ALL_STATUSES && product.status !== status) return false;
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) ||
        product.slug.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Parts seeded from the live storefront config, so "Edit" starts from truth. */
export function adminPartsFromConfig(slug: string): AdminPart[] {
  const config = getProductConfig(slug);
  if (!config) return [];
  return config.parts.map((part) => ({
    id: part.id,
    label: part.label,
    color: part.swatches[0]?.hex ?? "#c6f135",
    meshNames: part.meshNames,
    finishable: part.finishable,
    gloss: part.glossRange,
  }));
}

export function adminDecalZonesFromConfig(slug: string): AdminProduct["decalZones"] {
  const config = getProductConfig(slug);
  if (!config || !config.decal.enabled) return [];
  return config.decal.zones.map((zone) => ({ id: zone.id, label: zone.label, partId: zone.partId }));
}

function engraveEnabledFromConfig(slug: string): boolean {
  return getProductConfig(slug)?.engrave.enabled ?? false;
}

/** The placeholder primitive kind a category falls back to before a GLB exists. */
export function placeholderKind(category: AdminCategory): "tee" | "mug" | "cap" {
  switch (category) {
    case "Apparel":
      return "tee";
    case "Headwear":
      return "cap";
    default:
      return "mug";
  }
}

const DEFAULT_DECAL_METHOD: DecalMethod = "print";

/** The first decal method any storefront zone uses, so previews stay realistic. */
function decalMethodFor(category: AdminCategory): DecalMethod {
  if (category === "Apparel") return "print";
  if (category === "Headwear") return "embroidery";
  return "etch";
}

/**
 * A previewable `ProductConfig` from the admin record: the shape the studio's
 * canvas already consumes, so the small viewer needs zero new pieces. Uploads
 * and mesh names only materialize once saved — the preview takes a form-state
 * snapshot, not a persisted record (see `AdminProductPreviewOverrides`).
 */
export type AdminProductPreviewOverrides = {
  modelUrl?: string;
  parts?: AdminProduct["parts"];
  decalZones?: AdminProduct["decalZones"];
  engraveEnabled?: boolean;
};

export function toPreviewConfig(
  record: {
    id: string;
    slug: string;
    name: string;
    description: string;
    priceCents: number;
    category: AdminCategory;
  },
  overrides: AdminProductPreviewOverrides = {},
): ProductConfig {
  const category: AdminCategory = record.category;
  const parts = overrides.parts ?? adminPartsFromConfig(record.id);
  const decalZones = overrides.decalZones ?? adminDecalZonesFromConfig(record.id);
  const engraveEnabled = overrides.engraveEnabled ?? engraveEnabledFromConfig(record.id);
  const bundled = getProductConfig(record.id);

  return {
    slug: record.slug,
    name: record.name,
    description: record.description,
    priceCents: record.priceCents,
    category,
    placeholder: bundled?.placeholder ?? placeholderKind(category),
    model: {
      glb: overrides.modelUrl ?? bundled?.model.glb ?? "",
      // A data-URL or bundled model still gets the shell's auto-fit; 1 is neutral.
      scale: bundled?.model.scale ?? 1,
      cameraPresets: bundled?.model.cameraPresets ?? {
        front: [0, 0.3, 4],
        back: [0, 0.3, -4],
        side: [4, 0.3, 0],
        detail: [0.8, 0.6, 1.8],
      },
      autoRotateSpeed: 1,
      environment: "studio",
      // Preview spans carry no credit: the admin record, not the mesh, is authority here.
    },
    parts: parts.map((part) => ({
      id: part.id,
      label: part.label,
      meshNames: part.meshNames,
      // One default swatch is what the admin form defines; the full palette
      // remains catalog-level (detail cards still show their shipped colourways).
      swatches: [{ name: `${part.label} default`, hex: part.color }],
      allowCustomColor: true,
      finishable: part.finishable,
      glossRange: part.gloss,
    })),
    decal: { enabled: decalZones.length > 0, zones: decalZones.map((zone) => ({ ...zone, anchor: { position: [0, 0.2, 0.08], normal: [0, 0, 1] }, maxSize: [0.9, 0.9] as [number, number], method: decalMethodFor(category) ?? DEFAULT_DECAL_METHOD })) },
    engrave: engraveEnabled
      ? {
          enabled: true,
          maxChars: 24,
          fonts: [{ id: "mono", label: "Mono", css: "monospace" }],
          zones: decalZones.map((zone) => ({ id: `engrave-${zone.partId}`, label: `Front (${zone.label})`, partId: zone.partId })),
        }
      : { enabled: false, maxChars: 0, fonts: [], zones: [] },
    extras: bundled?.extras ?? [],
    details: bundled?.details ?? {
      materials: "Added from the admin demo — details arrive with Phase 4.",
      dimensions: "Not set yet.",
      care: "Not set yet.",
      productionTime: "Not set yet.",
      shipping: "Dispatched in 48 hours. Demo checkout only, no real charge is made.",
    },
  };
}

/** Static catalog products as admin rows, before any stored override. */
export function baseAdminProducts(): AdminProduct[] {
  return products.map((product) => ({
    id: product.id,
    slug: product.id,
    name: product.name,
    description: getProductConfig(product.id)?.description ?? "",
    category: product.category,
    priceCents: product.priceCents,
    status: "active" as const,
    updatedAt: product.releasedAt,
    parts: adminPartsFromConfig(product.id),
    decalZones: adminDecalZonesFromConfig(product.id),
    engraveEnabled: engraveEnabledFromConfig(product.id),
    fallbackImage: product.image,
  }));
}
