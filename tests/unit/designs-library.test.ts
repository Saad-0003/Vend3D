import { describe, expect, it } from "vitest";

import { productsIn, relativeTime, selectDesigns } from "@/lib/designs/library";
import type { SavedDesign } from "@/stores/designs-store";

const base = {
  productName: "Luna Glazed Mug",
  thumbnail: "",
  configuration: {} as SavedDesign["configuration"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

const designs: SavedDesign[] = [
  { ...base, id: "a", name: "Zebra", slug: "luna-glazed-mug", updatedAt: "2026-03-01T00:00:00.000Z" },
  { ...base, id: "b", name: "Alpha", slug: "structured-6-panel-cap", productName: "Cap", updatedAt: "2026-02-01T00:00:00.000Z", orderedAt: "2026-02-02T00:00:00.000Z" },
  { ...base, id: "c", name: "Mid", slug: "luna-glazed-mug", updatedAt: "2026-02-15T00:00:00.000Z" },
];

describe("selectDesigns", () => {
  it("shows everything by default, newest first", () => {
    expect(selectDesigns(designs, { tab: "all", sort: "recent", product: "all" }).map((d) => d.id)).toEqual(["a", "c", "b"]);
  });

  it("filters drafts and ordered separately", () => {
    expect(selectDesigns(designs, { tab: "drafts", sort: "recent", product: "all" }).map((d) => d.id)).toEqual(["a", "c"]);
    expect(selectDesigns(designs, { tab: "ordered", sort: "recent", product: "all" }).map((d) => d.id)).toEqual(["b"]);
  });

  it("sorts by name when asked", () => {
    expect(selectDesigns(designs, { tab: "all", sort: "name", product: "all" }).map((d) => d.name)).toEqual(["Alpha", "Mid", "Zebra"]);
  });

  it("filters by product slug", () => {
    expect(selectDesigns(designs, { tab: "all", sort: "recent", product: "luna-glazed-mug" }).map((d) => d.id)).toEqual(["a", "c"]);
  });

  it("does not mutate the input array", () => {
    const copy = [...designs];
    selectDesigns(designs, { tab: "all", sort: "name", product: "all" });
    expect(designs).toEqual(copy);
  });
});

describe("productsIn", () => {
  it("lists each product once", () => {
    expect(productsIn(designs)).toEqual([
      { slug: "luna-glazed-mug", name: "Luna Glazed Mug" },
      { slug: "structured-6-panel-cap", name: "Cap" },
    ]);
  });
});

describe("relativeTime", () => {
  const now = Date.parse("2026-03-01T01:00:00.000Z");
  it("uses short relative units", () => {
    expect(relativeTime("2026-03-01T00:59:40.000Z", now)).toBe("just now");
    expect(relativeTime("2026-03-01T00:30:00.000Z", now)).toBe("30 min ago");
    expect(relativeTime("2026-02-28T13:00:00.000Z", now)).toBe("12 h ago");
    expect(relativeTime("2026-02-26T01:00:00.000Z", now)).toBe("3 d ago");
  });
});
