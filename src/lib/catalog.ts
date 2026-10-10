import { formatCents } from "@/lib/format";

export const CATEGORIES = ["All", "Apparel", "Drinkware", "Headwear"] as const;
export type Category = (typeof CATEGORIES)[number];

export const MATERIALS = ["Combed cotton", "Glazed ceramic", "Brushed steel", "Cotton twill"] as const;
export type Material = (typeof MATERIALS)[number];

export const SORTS = ["featured", "price-asc", "price-desc", "newest"] as const;
export type Sort = (typeof SORTS)[number];

export type Colorway = { name: string; hex: string };

export type Product = {
  id: string;
  name: string;
  /** Integer cents — the only money representation below the UI edge. */
  priceCents: number;
  category: Exclude<Category, "All">;
  material: Material;
  rating: number;
  image: string;
  /** ISO date, used by the `newest` sort. */
  releasedAt: string;
  colorways: Colorway[];
};

/**
 * The catalog both the home page's shop section and `/shop` read from, so the
 * grid on the landing page can never drift from the archive (rule 3).
 *
 * Phase 1 placeholder data (D-019): static assets, no DB, no money computed.
 * Phase 4 swaps the body of `listProducts` for a paginated Prisma query and
 * every consumer keeps working because prices stay cents here.
 * NOTE: the cap asset is a neutral embroidered-patch placeholder — no
 * third-party trademark ships.
 */
export const products: Product[] = [
  {
    id: "heavyweight-boxy-tee",
    name: "Heavyweight Boxy Tee",
    priceCents: 4800,
    category: "Apparel",
    material: "Combed cotton",
    rating: 5.0,
    image: "/products/heavyweight-boxy-tee.png",
    releasedAt: "2026-02-11",
    colorways: [
      { name: "Onyx", hex: "#1b1b1d" },
      { name: "Signal", hex: "#c6f135" },
      { name: "Ivory", hex: "#f2f0eb" },
    ],
  },
  {
    id: "luna-glazed-mug",
    name: "Luna Glazed Mug",
    priceCents: 2800,
    category: "Drinkware",
    material: "Glazed ceramic",
    rating: 4.9,
    image: "/products/luna-glazed-mug.png",
    releasedAt: "2026-01-06",
    colorways: [
      { name: "Signal", hex: "#c6f135" },
      { name: "Onyx", hex: "#1b1b1d" },
      { name: "Clay", hex: "#6b6a63" },
    ],
  },
  {
    id: "structured-6-panel-cap",
    name: "Structured 6-Panel Cap",
    priceCents: 3600,
    category: "Headwear",
    material: "Cotton twill",
    rating: 4.8,
    image: "/products/structured-6-panel-cap.png",
    releasedAt: "2025-11-18",
    colorways: [
      { name: "Onyx", hex: "#1b1b1d" },
      { name: "Graphite", hex: "#353437" },
      { name: "Signal", hex: "#c6f135" },
    ],
  },
  {
    id: "insulated-steel-bottle",
    name: "Insulated Steel Bottle",
    priceCents: 4200,
    category: "Drinkware",
    material: "Brushed steel",
    rating: 5.0,
    image: "/products/insulated-steel-bottle.png",
    releasedAt: "2025-09-30",
    colorways: [
      { name: "Ivory", hex: "#f2f0eb" },
      { name: "Signal", hex: "#c6f135" },
      { name: "Graphite", hex: "#2a2a2c" },
    ],
  },
];

/** Every distinct colourway across the catalog, de-duplicated by name. */
export const allColorways: Colorway[] = [
  ...new Map(products.flatMap((p) => p.colorways).map((c) => [c.name, c])).values(),
];

export const priceBounds = {
  min: Math.min(...products.map((p) => p.priceCents)),
  max: Math.max(...products.map((p) => p.priceCents)),
};

/** Pre-formatted price for display only — never send this back to the server. */
export function displayPrice(product: Product): string {
  return formatCents(product.priceCents);
}

/** Async read so a later Prisma query is a drop-in replacement. */
export function listProducts(): Promise<Product[]> {
  return Promise.resolve(products);
}
