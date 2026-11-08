import { beforeEach, describe, expect, it } from "vitest";

import {
  baseAdminProducts,
  selectAdminProducts,
  slugify,
  toPreviewConfig,
  uniqueSlug,
} from "@/lib/admin/catalog-ops";
import {
  ADMIN_PRODUCTS_STORAGE_KEY,
  createLocalCatalogAdminService,
} from "@/lib/admin/catalog-service";
import {
  adminCustomizationSchema,
  adminProductFormSchema,
  adminProductRecordSchema,
  centsToDollars,
  dollarsToCents,
  formatBytes,
  type AdminProduct,
} from "@/lib/admin/product-schema";
import { products } from "@/lib/catalog";

/**
 * The U5 seams (plan.md Phase 1B): the zod contracts, the pure list/slug
 * helpers and the localStorage service. What's pinned is what Phase 4's
 * database-backed implementation must reproduce — money as integer cents,
 * slug uniqueness across catalog + records, the lenient corrupt-payload rule
 * (D-094's), and the quota failure that must never silently drop an upload.
 */

function memoryStorage() {
  const map = new Map<string, string>();
  const throwOnWrite = { value: false };
  return {
    getItem: (name: string) => {
      if (throwOnWrite.value) throw new Error("SecurityError: the store is blocked");
      return map.get(name) ?? null;
    },
    setItem: (name: string, value: string) => {
      if (throwOnWrite.value) throw new Error("QuotaExceededError: the store is full");
      map.set(name, value);
    },
    /** Test-only switch: simulate a full / blocked store for the next write. */
    blockWrites: () => (throwOnWrite.value = true),
    raw: (name: string) => map.get(name) ?? null,
    clear: () => map.clear(),
  };
}

type Storage = ReturnType<typeof memoryStorage>;

/** A valid catalog-shaped draft; the service fills id/updatedAt itself. */
function draft(overrides: Partial<AdminProduct> = {}): Omit<AdminProduct, "id" | "updatedAt"> {
  return {
    slug: "vintage-tee",
    name: "Vintage Tee",
    description: "A test draft",
    category: "Apparel",
    priceCents: 2999,
    status: "draft",
    parts: [
      { id: "body", label: "Body", color: "#c6f135", meshNames: ["Tee_Body"], finishable: true, gloss: [0, 60] },
    ],
    decalZones: [],
    engraveEnabled: false,
    ...overrides,
  };
}

function service(storage: Storage) {
  return createLocalCatalogAdminService({
    storage,
    readCatalog: () => Promise.resolve(products),
  });
}

beforeEach(() => {
  localStorage.clear();
});

/* ------------------------------------------------------------------ money */

describe("dollarsToCents / centsToDollars", () => {
  it("converts a dollar string into integer cents", () => {
    expect(dollarsToCents("12.99")).toEqual({ ok: true, cents: 1299 });
    expect(dollarsToCents("$1,000")).toEqual({ ok: true, cents: 100_000 });
    expect(dollarsToCents("0.5")).toEqual({ ok: true, cents: 50 });
    expect(centsToDollars(1299)).toBe("12.99");
  });

  it("rejects anything that is not a plain non-negative price", () => {
    for (const bad of ["abc", "-3", "0", "12.999", "1e5", "1000.00.00", ""]) {
      expect(dollarsToCents(bad).ok).toBe(false);
    }
    expect(dollarsToCents("10000.01").ok).toBe(false); // over the $10,000 cap
    expect(dollarsToCents("10000").ok).toBe(true);
  });
});

/* ------------------------------------------------------------------ slugs */

describe("slugify / uniqueSlug", () => {
  it("turns names into url-safe slugs", () => {
    expect(slugify("Heavyweight Boxy Tee!")).toBe("heavyweight-boxy-tee");
    expect(slugify("Luna — Glazed “Mug”")).toBe("luna-glazed-mug");
    expect(slugify("  ")).toBe("");
  });

  it("appends -2, -3… only when the slug is taken", () => {
    const taken = ["tee", "tee-2"];
    expect(uniqueSlug("tee", taken)).toBe("tee-3");
    expect(uniqueSlug("cap", taken)).toBe("cap");
  });
});

/* ---------------------------------------------------------------- schemas */

describe("adminProductFormSchema", () => {
  const valid = {
    name: "Studio Tote",
    slug: "studio-tote",
    category: "Headwear",
    description: "",
    price: "45.00",
    status: "draft",
  } as const;

  it("accepts a complete basics section", () => {
    expect(adminProductFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects malformed slugs and prices with inline-ready messages", () => {
    const slug = adminProductFormSchema.safeParse({ ...valid, slug: "Studio Tote" });
    expect(slug.success).toBe(false);
    if (!slug.success) expect(slug.error.issues[0]?.message).toMatch(/lowercase/i);

    const price = adminProductFormSchema.safeParse({ ...valid, price: "free" });
    expect(price.success).toBe(false);
    if (!price.success) expect(price.error.issues[0]?.message).toMatch(/like 12\.99/i);
  });
});

describe("adminCustomizationSchema", () => {
  it("requires at least one customizable part", () => {
    const result = adminCustomizationSchema.safeParse({
      parts: [],
      decalZones: [],
      engraveEnabled: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toMatch(/at least one/i);
  });
});

describe("adminProductRecordSchema", () => {
  it("parses a full record round-trip", () => {
    const record: AdminProduct = {
      id: "vintage-tee",
      slug: "vintage-tee",
      name: "Vintage Tee",
      description: "",
      category: "Apparel",
      priceCents: 2999,
      status: "active",
      updatedAt: new Date().toISOString(),
      parts: [{ id: "body", label: "Body", color: "#ffffff", meshNames: [], finishable: false, gloss: [0, 0] }],
      decalZones: [],
      engraveEnabled: false,
      model: { name: "tee.glb", sizeBytes: 10, dataUrl: "data:application/gltf-binary;base64,AA" },
    };
    expect(adminProductRecordSchema.safeParse(record).success).toBe(true);
  });

  it("drops entries with a bad hex or slug instead of crashing screens", () => {
    expect(
      adminProductRecordSchema.safeParse({
        id: "x",
        slug: "Not A Slug",
        name: "Broken",
        description: "",
        category: "Apparel",
        priceCents: 100,
        status: "draft",
        updatedAt: "2026-01-01",
        parts: [],
        decalZones: [],
        engraveEnabled: false,
      }).success,
    ).toBe(false);
  });
});

describe("formatBytes", () => {
  it("renders readable sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1_572_864)).toBe("1.5 MB");
  });
});

/* ------------------------------------------------------- list selection */

describe("selectAdminProducts", () => {
  const list: AdminProduct[] = [
    {
      id: "a-tee",
      slug: "a-tee",
      name: "Archive Tee",
      description: "",
      category: "Apparel",
      priceCents: 1000,
      status: "active",
      updatedAt: "2026-11-01T00:00:00.000Z",
      parts: [],
      decalZones: [],
      engraveEnabled: false,
    },
    {
      id: "d-mug",
      slug: "d-mug",
      name: "Draft Mug",
      description: "",
      category: "Drinkware",
      priceCents: 2000,
      status: "draft",
      updatedAt: "2026-11-03T00:00:00.000Z",
      parts: [],
      decalZones: [],
      engraveEnabled: false,
    },
  ];

  it("filters by query, category and status; newest first", () => {
    expect(selectAdminProducts(list, { query: "mug", category: "All", status: "all" })).toEqual([list[1]]);
    expect(selectAdminProducts(list, { query: "", category: "Drinkware", status: "all" })).toEqual([list[1]]);
    expect(selectAdminProducts(list, { query: "", category: "All", status: "draft" })).toEqual([list[1]]);
    expect(selectAdminProducts(list, { query: "", category: "All", status: "all" })).toEqual([list[1], list[0]]);
    // slug also matches the search, "nothing fits" is a plain empty array
    expect(selectAdminProducts(list, { query: "a-tee", category: "All", status: "all" })).toEqual([list[0]]);
  });
});

/* ---------------------------------------------------------- the service */

describe("createLocalCatalogAdminService", () => {
  it("lists the static catalog merged with stored records", async () => {
    const storage = memoryStorage();
    const svc = service(storage);
    const list = await svc.listProducts();
    // The four catalog seeds are always there, parts seeded from the config.
    expect(list.map((p) => p.id)).toEqual(products.map((p) => p.id));
    const tee = list.find((p) => p.id === "heavyweight-boxy-tee")!;
    expect(tee.fallbackImage).toBeTruthy();
    expect(tee.parts.length).toBeGreaterThan(0);
  });

  it("creates a product with a stable id and a now timestamp", async () => {
    const storage = memoryStorage();
    const svc = service(storage);
    const result = await svc.createProduct(draft());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.product.id).toBe("vintage-tee");
    expect(new Date(result.product.updatedAt).getTime()).toBeGreaterThan(0);

    const stored = JSON.parse(storage.raw(ADMIN_PRODUCTS_STORAGE_KEY)!);
    expect(stored.state.records).toHaveLength(1);
  });

  it("uniquifies the slug on collision with the catalog or records", async () => {
    const storage = memoryStorage();
    const svc = service(storage);
    const first = await svc.createProduct(draft());
    const second = await svc.createProduct(draft());
    expect(first.ok && second.ok).toBe(true);
    if (!(first.ok && second.ok)) return;
    expect(second.product.slug).toBe("vintage-tee-2");
    // Also collides against catalog ids ("luna-glazed-mug" exists)
    const clash = await svc.createProduct(
      draft({ slug: "luna-glazed-mug", name: "Luna Again" }),
    );
    expect(clash.ok && clash.product.slug.startsWith("luna-glazed-mug-")).toBe(true);
  });

  it("demotes an archived create to a draft (archive is a list action)", async () => {
    const storage = memoryStorage();
    const svc = service(storage);
    const result = await svc.createProduct(draft({ status: "archived" }));
    expect(result.ok && result.product.status).toBe("draft");
  });

  it("updates a catalog product through an override; unknown ids fail softly", async () => {
    const storage = memoryStorage();
    const svc = service(storage);
    const edit = await svc.updateProduct("heavyweight-boxy-tee", {
      priceCents: 5555,
      status: "draft",
    });
    expect(edit.ok && edit.product.priceCents).toBe(5555);

    const list = await svc.listProducts();
    expect(list.find((p) => p.id === "heavyweight-boxy-tee")?.status).toBe("draft");

    const missing = await svc.updateProduct("nope", { priceCents: 1 });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error).toMatch(/no longer exists/i);
  });

  it("duplicates with a fresh id, copied-after timestamp and archive→draft", async () => {
    const storage = memoryStorage();
    const svc = service(storage);
    await svc.setProductStatus("heavyweight-boxy-tee", "archived");
    const fromArchive = await svc.duplicateProduct("heavyweight-boxy-tee");
    expect(fromArchive.ok && fromArchive.product.status).toBe("draft");

    const dup = await svc.duplicateProduct("luna-glazed-mug");
    expect(dup.ok).toBe(true);
    if (!dup.ok) return;
    expect(dup.product.id).toBe("luna-glazed-mug-copy");
    expect(dup.product.name).toBe("Luna Glazed Mug copy");
    const source = (await svc.getProduct("luna-glazed-mug"))!;
    expect(Date.parse(dup.product.updatedAt)).toBeGreaterThan(Date.parse(source.updatedAt));
  });

  it("archives and restores from the list", async () => {
    const storage = memoryStorage();
    const svc = service(storage);
    await svc.setProductStatus("structured-6-panel-cap", "archived");
    expect((await svc.getProduct("structured-6-panel-cap"))?.status).toBe("archived");
    await svc.setProductStatus("structured-6-panel-cap", "active");
    expect((await svc.getProduct("structured-6-panel-cap"))?.status).toBe("active");
  });

  it("reads a corrupt payload as empty, but surfaces a blocked store", async () => {
    const storage = memoryStorage();
    const svc = service(storage);
    storage.setItem(ADMIN_PRODUCTS_STORAGE_KEY, "{not json");
    // Corrupt → the seed rows still come through, in catalog order & shape.
    const recovered = await svc.listProducts();
    expect(recovered.map((p) => p.id)).toEqual(products.map((p) => p.id));

    storage.blockWrites();
    const blocked = await createLocalCatalogAdminService({
      storage,
      readCatalog: () => Promise.resolve(products),
    }).createProduct(draft());
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toMatch(/Saving failed/i);
  });

  it("getProduct misses cleanly outside the catalog", async () => {
    const storage = memoryStorage();
    const svc = service(storage);
    await expect(svc.getProduct("ghost")).resolves.toBeNull();
  });
});

/* ---------------------------------------------------------- base + preview */

describe("baseAdminProducts / toPreviewConfig", () => {
  it("seeds one admin row per catalog product", () => {
    const base = baseAdminProducts();
    expect(base).toHaveLength(products.length);
    expect(base.every((p) => p.parts.length > 0)).toBe(true); // even the tee has parts
  });

  it("builds a previewable config for a new product with the category placeholder", () => {
    const config = toPreviewConfig(
      {
        id: "",
        slug: "studio-tote",
        name: "Studio Tote",
        description: "",
        priceCents: 4500,
        category: "Headwear",
      },
      {
        parts: [{ id: "panel", label: "Panel", color: "#111111", meshNames: [], finishable: false, gloss: [0, 0] }],
        decalZones: [],
        engraveEnabled: true,
      },
    );
    expect(config.placeholder).toBe("cap");
    expect(config.parts[0]?.swatches[0]?.hex).toBe("#111111");
    expect(config.engrave.enabled).toBe(true);
    expect(config.decal.enabled).toBe(false);
  });
});
