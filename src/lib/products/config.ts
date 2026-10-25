import { products, type Product } from "@/lib/catalog";
import bottleGlb from "@/assets/models/bottle.glb";
import capGlb from "@/assets/models/cap.glb";
import mugGlb from "@/assets/models/mug.glb";
import shirtGlb from "@/assets/models/shirt.glb";

/**
 * One entry per product. The Studio screen renders every section from this
 * object and never branches on the slug, so adding a product is a data change.
 *
 * GLBs are bundled, hashed static assets (next.config.ts `asset/resource`):
 * the model URL is a build-time constant, so the studio never has to probe
 * whether the file exists in /public — the source it renders is always the
 * real mesh, and a broken or malformed file falls back to the placeholder via
 * the component's error boundary.
 *
 * Coordinates (`anchor.position`, `camera` presets) are in the model's own
 * units before the engine auto-fits it to the stage floor. A real GLB exported
 * with different proportions only needs its anchors adjusted here.
 */

export type Vec3 = [number, number, number];
export type CameraPresetKey = "front" | "back" | "side" | "detail";
export type PlaceholderKind = "tee" | "mug" | "cap" | "bottle";
export type DecalMethod = "print" | "embroidery" | "etch";

export type SwatchDef = { name: string; hex: string };

export type PartConfig = {
  id: string;
  label: string;
  /** Mesh names in the GLB (or placeholder) that this part paints. */
  meshNames: string[];
  swatches: SwatchDef[];
  allowCustomColor: boolean;
  finishable: boolean;
  /** Allowed finish slider range, 0 = matte, 100 = glossy. */
  glossRange: [number, number];
};

export type DecalZone = {
  id: string;
  label: string;
  partId: string;
  anchor: { position: Vec3; normal: Vec3 };
  /** Width and height of the printable area, in model units. */
  maxSize: [number, number];
  method: DecalMethod;
};

export type EngraveFont = { id: string; label: string; css: string };
export type EngraveZone = { id: string; label: string; partId: string };

/**
 * Fill colours offered for engraved text. Engraving renders as a tinted etch
 * on the part's front zone, so these read as "ink" colours rather than metals.
 */
export const ENGRAVE_COLORS: SwatchDef[] = [
  { name: "Ivory", hex: "#f2f0eb" },
  { name: "Graphite", hex: "#1b1b1d" },
  { name: "Brass", hex: "#c9a25e" },
  { name: "Lime", hex: "#c6f135" },
  { name: "Coral", hex: "#f43f5e" },
  { name: "Sky", hex: "#22d3ee" },
];

export type ExtraOption = { value: string; label: string };
export type ExtraConfig = {
  id: string;
  type: "size" | "select" | "toggle";
  label: string;
  options: ExtraOption[];
};

export type ProductConfig = {
  slug: string;
  name: string;
  /** One line shown in the purchase bar; distinct from the details accordion copy. */
  description: string;
  /** Integer cents, copied from the catalog so the configurator never drifts. */
  priceCents: number;
  category: Product["category"];
  placeholder: PlaceholderKind;
  model: {
    glb: string;
    /** Multiplier applied after the auto-fit. 1 keeps the fitted size. */
    scale: number;
    cameraPresets: Record<CameraPresetKey, Vec3>;
    autoRotateSpeed: number;
    environment: "studio";
    /** Source attribution shown under the stage when the model is not CC0. */
    credit?: { label: string; url: string };
  };
  parts: PartConfig[];
  decal: { enabled: boolean; zones: DecalZone[] };
  engrave: { enabled: boolean; maxChars: number; fonts: EngraveFont[]; zones: EngraveZone[] };
  extras: ExtraConfig[];
  details: {
    materials: string;
    dimensions: string;
    care: string;
    productionTime: string;
    shipping: string;
  };
};

const SHIPPING = "Dispatched in 48 hours. Demo checkout only, no real charge is made.";
const PRODUCTION = "48 hours from order to dispatch";

function catalogProduct(id: string): Product {
  const found = products.find((p) => p.id === id);
  if (!found) throw new Error(`Studio config references unknown catalog product "${id}"`);
  return found;
}

const tee = catalogProduct("heavyweight-boxy-tee");
const mug = catalogProduct("luna-glazed-mug");
const cap = catalogProduct("structured-6-panel-cap");
const bottle = catalogProduct("insulated-steel-bottle");

const teeConfig: ProductConfig = {
  slug: tee.id,
  name: tee.name,
  description: "260 gsm combed cotton with a boxy, dropped-shoulder cut.",
  priceCents: tee.priceCents,
  category: tee.category,
  placeholder: "tee",
  model: {
    glb: shirtGlb,
    // Per-product fit multiplier (model shell normalises the longest side to
    // 2.2); tuned so each product composes with its own camera presets.
    scale: 0.9,
    cameraPresets: {
      front: [0, 0.3, 4],
      back: [0, 0.3, -4],
      side: [4, 0.3, 0],
      detail: [0.8, 0.6, 1.8],
    },
    autoRotateSpeed: 1.2,
    environment: "studio",
    credit: {
      label: "T-shirt model — Poly by Google · CC BY 3.0",
      url: "https://poly.pizza/m/bdOMzzh-fSl",
    },
  },
  parts: [
    {
      id: "body",
      label: "Body",
      meshNames: ["body"],
      swatches: tee.colorways,
      allowCustomColor: true,
      finishable: true,
      glossRange: [0, 40],
    },
  ],
  decal: {
    enabled: true,
    zones: [
      {
        id: "chest",
        label: "Chest",
        partId: "body",
        anchor: { position: [0, 0.2, 0.08], normal: [0, 0, 1] },
        maxSize: [0.9, 0.9],
        method: "print",
      },
      {
        id: "back",
        label: "Back",
        partId: "body",
        anchor: { position: [0, 0.2, -0.08], normal: [0, 0, -1] },
        maxSize: [1.1, 1.2],
        method: "print",
      },
    ],
  },
  engrave: { enabled: false, maxChars: 0, fonts: [], zones: [] },
  extras: [
    {
      id: "size",
      type: "size",
      label: "Size",
      options: [
        { value: "s", label: "S" },
        { value: "m", label: "M" },
        { value: "l", label: "L" },
        { value: "xl", label: "XL" },
      ],
    },
  ],
  details: {
    materials: "Heavyweight combed cotton, 260 gsm, boxy cut.",
    dimensions: "Chest and length shown on the size chart at checkout.",
    care: "Machine wash cold, inside out. Tumble dry low. Do not bleach.",
    productionTime: PRODUCTION,
    shipping: SHIPPING,
  },
};

const mugConfig: ProductConfig = {
  slug: mug.id,
  name: mug.name,
  description: "Stoneware glazed by hand for a soft luna sheen.",
  priceCents: mug.priceCents,
  category: mug.category,
  placeholder: "mug",
  model: {
    glb: mugGlb,
    // Mug is 2.2 wide (body + handle) and its front preset is close (z 3.6):
    // 0.8 keeps body + handle inside the frame.
    scale: 0.8,
    cameraPresets: {
      front: [0, 0.2, 3.6],
      back: [0, 0.2, -3.6],
      side: [3.6, 0.4, 0.5],
      detail: [1, 0.4, 1.5],
    },
    autoRotateSpeed: 1,
    environment: "studio",
    credit: {
      label: "Mug model — MilkAndBanana · CC0 1.0",
      url: "https://poly.pizza/m/54cOZNS04L",
    },
  },
  parts: [
    {
      id: "body",
      label: "Glaze",
      meshNames: ["body"],
      swatches: mug.colorways,
      allowCustomColor: true,
      finishable: true,
      glossRange: [60, 100],
    },
    {
      id: "handle",
      label: "Handle",
      meshNames: ["handle"],
      swatches: mug.colorways,
      allowCustomColor: true,
      finishable: false,
      glossRange: [0, 0],
    },
  ],
  decal: {
    enabled: true,
    zones: [
      {
        id: "wrap",
        label: "Wrap",
        partId: "body",
        anchor: { position: [0, 0, 0.72], normal: [0, 0, 1] },
        maxSize: [1.0, 0.7],
        method: "print",
      },
    ],
  },
  engrave: {
    enabled: true,
    maxChars: 24,
    fonts: [
      { id: "serif", label: "Serif", css: "Georgia, serif" },
      { id: "sans", label: "Sans", css: "Arial, sans-serif" },
      { id: "mono", label: "Mono", css: "monospace" },
    ],
    zones: [{ id: "front", label: "Front", partId: "body" }],
  },
  extras: [
    {
      id: "capacity",
      type: "select",
      label: "Capacity",
      options: [
        { value: "11oz", label: "11 oz" },
        { value: "15oz", label: "15 oz" },
      ],
    },
  ],
  details: {
    materials: "Stoneware with a glazed finish, dishwasher and microwave safe.",
    dimensions: "11 oz or 15 oz capacity, handle on the right.",
    care: "Dishwasher safe. Avoid thermal shock from freezer to microwave.",
    productionTime: PRODUCTION,
    shipping: SHIPPING,
  },
};

const capConfig: ProductConfig = {
  slug: cap.id,
  name: cap.name,
  description: "Six-panel cotton twill with a pre-curved brim.",
  priceCents: cap.priceCents,
  category: cap.category,
  placeholder: "cap",
  model: {
    glb: capGlb,
    // The cap's bounding box far exceeds its visual extent (stray vertices in
    // the source GLB), so the shell under-sizes it; 1.3 pulls it back to frame.
    scale: 1.3,
    cameraPresets: {
      front: [0, 0.8, 3.2],
      back: [0, 0.8, -3.2],
      side: [3.2, 0.8, 0],
      detail: [0.6, 1.2, 1.4],
    },
    autoRotateSpeed: 1,
    environment: "studio",
    credit: {
      label: "Cap model — Poly by Google · CC BY 3.0",
      url: "https://poly.pizza/m/aaC5GgcWEhM",
    },
  },
  parts: [
    {
      id: "crown",
      label: "Crown",
      meshNames: ["crown"],
      swatches: cap.colorways,
      allowCustomColor: true,
      finishable: true,
      glossRange: [0, 60],
    },
    {
      id: "brim",
      label: "Brim",
      meshNames: ["brim"],
      swatches: cap.colorways,
      allowCustomColor: true,
      finishable: false,
      glossRange: [0, 0],
    },
  ],
  decal: {
    enabled: true,
    zones: [
      {
        id: "front-panel",
        label: "Front panel",
        partId: "crown",
        anchor: { position: [0, 0.35, 0.8], normal: [0, 0.3, 1] },
        maxSize: [0.6, 0.5],
        method: "embroidery",
      },
    ],
  },
  engrave: { enabled: false, maxChars: 0, fonts: [], zones: [] },
  extras: [
    {
      id: "strap",
      type: "toggle",
      label: "Adjustable strap",
      options: [],
    },
  ],
  details: {
    materials: "Structured six-panel crown in cotton twill with a pre-curved brim.",
    dimensions: "One size, adjustable strap at the back.",
    care: "Spot clean only. Reshape the crown while damp and air dry.",
    productionTime: PRODUCTION,
    shipping: SHIPPING,
  },
};

const bottleConfig: ProductConfig = {
  slug: bottle.id,
  name: bottle.name,
  description: "Vacuum-insulated brushed steel, 750 ml.",
  priceCents: bottle.priceCents,
  category: bottle.category,
  placeholder: "bottle",
  model: {
    glb: bottleGlb,
    scale: 1,
    cameraPresets: {
      front: [0, 0.3, 4.2],
      back: [0, 0.3, -4.2],
      side: [4.2, 0.3, 0],
      detail: [0.6, 0.5, 1.8],
    },
    autoRotateSpeed: 1,
    environment: "studio",
    credit: {
      label: "Bottle model — Poly by Google · CC BY 3.0",
      url: "https://poly.pizza/m/dm0ZTuKAs45",
    },
  },
  parts: [
    {
      id: "body",
      label: "Body",
      meshNames: ["body"],
      swatches: bottle.colorways,
      allowCustomColor: true,
      finishable: true,
      glossRange: [30, 100],
    },
    {
      id: "lid",
      label: "Lid",
      meshNames: ["lid"],
      swatches: bottle.colorways,
      allowCustomColor: true,
      finishable: false,
      glossRange: [0, 0],
    },
  ],
  decal: {
    enabled: true,
    zones: [
      {
        id: "front",
        label: "Front",
        partId: "body",
        anchor: { position: [0, 0, 0.42], normal: [0, 0, 1] },
        maxSize: [0.6, 0.9],
        method: "etch",
      },
    ],
  },
  engrave: {
    enabled: true,
    maxChars: 16,
    fonts: [
      { id: "serif", label: "Serif", css: "Georgia, serif" },
      { id: "sans", label: "Sans", css: "Arial, sans-serif" },
    ],
    zones: [{ id: "body", label: "Body", partId: "body" }],
  },
  extras: [
    {
      id: "lid-finish",
      type: "select",
      label: "Lid finish",
      options: [
        { value: "matte", label: "Matte" },
        { value: "gloss", label: "Gloss" },
      ],
    },
  ],
  details: {
    materials: "Double-wall brushed steel, vacuum insulated.",
    dimensions: "Approx. 750 ml capacity, 26 cm tall.",
    care: "Hand wash recommended. Not for the dishwasher.",
    productionTime: PRODUCTION,
    shipping: SHIPPING,
  },
};

export const productConfigs: ProductConfig[] = [teeConfig, mugConfig, capConfig, bottleConfig];

export function getProductConfig(slug: string): ProductConfig | undefined {
  return productConfigs.find((p) => p.slug === slug);
}
