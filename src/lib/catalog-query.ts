import { SORTS, type Product, type Sort } from "./catalog";

export type CatalogQuery = {
  /** Category tab; "All" (or empty) means no category filter. */
  category?: string;
  /** Colourway names, multi-select. Empty = no colour filter. */
  colors?: string[];
  /** Inclusive price range in cents. */
  minPrice?: number;
  maxPrice?: number;
  /** Material names. Empty = no material filter. */
  materials?: string[];
  query?: string;
  sort?: Sort;
};

/**
 * Pure catalog filtering + sorting (AGENTS.md: business logic lives in `src/lib`
 * and is unit-tested; the screen is a thin wrapper). Shared by `/shop` so the
 * URL query string can be validated and applied in one place.
 */
export function applyCatalogQuery(list: Product[], q: CatalogQuery): Product[] {
  const needle = q.query?.trim().toLowerCase() ?? "";

  const filtered = list.filter((p) => {
    if (q.category && q.category !== "All" && p.category !== q.category) return false;
    if (q.colors?.length && !p.colorways.some((c) => q.colors?.includes(c.name))) return false;
    if (q.materials?.length && !q.materials.includes(p.material)) return false;
    if (typeof q.minPrice === "number" && p.priceCents < q.minPrice) return false;
    if (typeof q.maxPrice === "number" && p.priceCents > q.maxPrice) return false;
    if (needle && !`${p.name} ${p.category} ${p.material}`.toLowerCase().includes(needle)) {
      return false;
    }
    return true;
  });

  switch (q.sort) {
    case "price-asc":
      return filtered.sort((a, b) => a.priceCents - b.priceCents);
    case "price-desc":
      return filtered.sort((a, b) => b.priceCents - a.priceCents);
    case "newest":
      return filtered.sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
    default:
      // "featured" keeps the catalog's curated order.
      return filtered;
  }
}

/**
 * Serialises the toolbar state into a shareable query string. Empty values are
 * omitted so a clean browse has a clean URL.
 */
export function serializeCatalogQuery(q: CatalogQuery): string {
  const params = new URLSearchParams();
  if (q.category && q.category !== "All") params.set("category", q.category);
  if (q.query?.trim()) params.set("q", q.query.trim());
  if (q.colors?.length) params.set("color", q.colors.join(","));
  if (q.materials?.length) params.set("material", q.materials.join(","));
  if (typeof q.minPrice === "number") params.set("min", String(q.minPrice));
  if (typeof q.maxPrice === "number") params.set("max", String(q.maxPrice));
  if (q.sort && q.sort !== "featured") params.set("sort", q.sort);
  return params.toString();
}

/** Inverse of `serializeCatalogQuery`, tolerant of hand-edited URLs. */
export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const num = (key: string) => {
    const raw = params.get(key);
    if (raw === null) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };
  const sort = params.get("sort");

  return {
    category: params.get("category") ?? "All",
    query: params.get("q") ?? "",
    colors: params.get("color")?.split(",").filter(Boolean) ?? [],
    materials: params.get("material")?.split(",").filter(Boolean) ?? [],
    minPrice: num("min"),
    maxPrice: num("max"),
    sort: SORTS.includes(sort as Sort) ? (sort as Sort) : "featured",
  };
}
