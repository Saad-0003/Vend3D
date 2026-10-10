import type { SavedDesign } from "@/stores/designs-store";

/** Tabs on `/designs`. "Ordered" means a cart line for the design was checked out. */
export const DESIGN_TABS = ["all", "drafts", "ordered"] as const;
export type DesignTab = (typeof DESIGN_TABS)[number];

export const SORTS = ["recent", "name"] as const;
export type DesignSort = (typeof SORTS)[number];

export function isDesignTab(value: string | null): value is DesignTab {
  return value !== null && (DESIGN_TABS as readonly string[]).includes(value);
}

export function isDesignSort(value: string | null): value is DesignSort {
  return value !== null && (SORTS as readonly string[]).includes(value);
}

/**
 * Filters and sorts the library. Pure, so the rules are unit-testable without
 * React. `product` is a slug, or "all".
 */
export function selectDesigns(
  designs: SavedDesign[],
  opts: { tab: DesignTab; sort: DesignSort; product: string },
): SavedDesign[] {
  let list = designs;
  if (opts.tab === "drafts") list = list.filter((d) => !d.orderedAt);
  if (opts.tab === "ordered") list = list.filter((d) => !!d.orderedAt);
  if (opts.product !== "all") list = list.filter((d) => d.slug === opts.product);

  const sorted = [...list];
  if (opts.sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }
  return sorted;
}

/** "3 min ago", "2 days ago". Relative to `now`, so it is pure and testable. */
export function relativeTime(iso: string, now: number): string {
  const diff = Math.max(0, now - Date.parse(iso));
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Distinct product slugs present in the library, for the product filter. */
export function productsIn(designs: SavedDesign[]): { slug: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const d of designs) if (!seen.has(d.slug)) seen.set(d.slug, d.productName);
  return [...seen].map(([slug, name]) => ({ slug, name }));
}
