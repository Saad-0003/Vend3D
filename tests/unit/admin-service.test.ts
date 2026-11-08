import { beforeEach, describe, expect, it } from "vitest";

import { computeAdminOverview, toAdminOrderRow, type AdminOverview } from "@/lib/admin/overview";
import {
  DESIGNS_STORAGE_KEY,
  ORDERS_STORAGE_KEY,
  createLocalAdminService,
} from "@/lib/admin/service";
import type { OrderRecord } from "@/lib/checkout/order";
import type { SavedDesign } from "@/stores/designs-store";
import { products } from "@/lib/catalog";

/**
 * The admin read seam (plan.md Phase 1B U4). What gets pinned is what Phase
 * 10's server implementation must reproduce: the aggregation shape, the
 * newest-first recent-orders rule, money in cents, and the "corrupt payload
 * reads as empty" lenience — a browser-local demo must never 500 the
 * dashboard over stale JSON.
 */

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (name: string) => map.get(name) ?? null,
    setItem: (name: string, value: string) => void map.set(name, value),
    /** Test-only: inspect without going through the service. */
    raw: (name: string) => map.get(name) ?? null,
    clear: () => map.clear(),
  };
}

type Storage = ReturnType<typeof memoryStorage>;

function seedOrders(storage: Storage, orders: unknown[]) {
  storage.setItem(ORDERS_STORAGE_KEY, JSON.stringify({ state: { orders }, version: 0 }));
}

function seedDesigns(storage: Storage, designs: unknown[]) {
  storage.setItem(DESIGNS_STORAGE_KEY, JSON.stringify({ state: { designs }, version: 0 }));
}

/** Minimal OrderRecord — only the fields the service reads. */
function order(overrides: Partial<OrderRecord> & Pick<OrderRecord, "id" | "createdAt">): OrderRecord {
  return {
    checkoutKey: `key-${overrides.id}`,
    status: "Placed",
    items: [],
    itemCount: 2,
    subtotalCents: 4400,
    shippingCents: 500,
    shippingMethodId: "standard",
    totalCents: 4900,
    address: {
      fullName: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "+92 300 1234567",
      address: "House 12",
      city: "Lahore",
      province: "Punjab",
      postalCode: "54000",
    },
    cardBrand: "VISA",
    cardLast4: "4242",
    ...overrides,
  } as OrderRecord;
}

const DESIGN = { id: "d-1", name: "Onyx tee", slug: "heavyweight-boxy-tee", productName: "Heavyweight Boxy Tee" } as SavedDesign;

describe("computeAdminOverview", () => {
  it("counts every seam's records and sums the revenue in cents", () => {
    const overview = computeAdminOverview({
      orders: [order({ id: "ord-1", createdAt: "2026-11-01" }), order({ id: "ord-2", createdAt: "2026-11-02", totalCents: 1200 })],
      designs: [DESIGN],
      products,
    });
    expect(overview.totalOrders).toBe(2);
    expect(overview.revenueCents).toBe(4900 + 1200);
    expect(overview.productCount).toBe(products.length);
    expect(overview.designCount).toBe(1);
  });

  it("returns all zeros and no recent orders for an empty browser", () => {
    const overview = computeAdminOverview({ orders: [], designs: [], products: [] });
    expect(overview).toMatchObject({
      totalOrders: 0,
      revenueCents: 0,
      productCount: 0,
      designCount: 0,
      recentOrders: [],
    } satisfies Partial<AdminOverview>);
  });

  it("lists the newest five orders first — newest-first is checkout's one ordering rule", () => {
    const orders = [
      order({ id: "ord-1", createdAt: "2026-11-01" }),
      order({ id: "ord-2", createdAt: "2026-11-03" }),
      order({ id: "ord-3", createdAt: "2026-11-02" }),
      order({ id: "ord-4", createdAt: "2026-11-04" }),
      order({ id: "ord-5", createdAt: "2026-11-06" }),
      order({ id: "ord-6", createdAt: "2026-11-05" }),
      order({ id: "ord-7", createdAt: "2026-11-07" }),
    ];
    const overview = computeAdminOverview({ orders, designs: [], products });
    expect(overview.recentOrders.map((o) => o.id)).toEqual([
      "ord-7",
      "ord-5",
      "ord-6",
      "ord-4",
      "ord-2",
    ]);
  });

  it("carries the row fields the table renders, cents and date strings untouched", () => {
    const row = toAdminOrderRow(order({ id: "ord-9", createdAt: "2026-11-08", itemCount: 3, totalCents: 7500 }));
    expect(row).toEqual({
      id: "ord-9",
      customer: "Ayesha Khan",
      status: "Placed",
      createdAt: "2026-11-08",
      itemCount: 3,
      totalCents: 7500,
    });
  });

  it("falls back to the checkout email when a customer name is missing", () => {
    const row = toAdminOrderRow(
      order({ id: "ord-10", createdAt: "2026-11-08", address: { ...order({ id: "ord-x", createdAt: "" }).address, fullName: "" } }),
    );
    expect(row.customer).toBe("ayesha@example.com");
  });
});

describe("createLocalAdminService", () => {
  let storage: Storage;
  let service: ReturnType<typeof createLocalAdminService>;

  beforeEach(() => {
    storage = memoryStorage();
    service = createLocalAdminService({ storage, readProducts: () => products });
  });

  it("reads the zustand persisted envelopes for orders and designs", async () => {
    seedOrders(storage, [order({ id: "ord-1", createdAt: "2026-11-01" })]);
    seedDesigns(storage, [DESIGN]);

    const overview = await service.getOverview();
    expect(overview.totalOrders).toBe(1);
    expect(overview.designCount).toBe(1);
    expect(overview.productCount).toBe(products.length);
    expect(overview.recentOrders[0]?.id).toBe("ord-1");
  });

  it("reports an empty browser as zeros, not an error", async () => {
    storage.clear();
    const overview = await service.getOverview();
    expect(overview.totalOrders).toBe(0);
    expect(overview.revenueCents).toBe(0);
    expect(overview.recentOrders).toEqual([]);
  });

  it.each([
    ["corrupt JSON", "(not json"],
    ["a non-array payload", JSON.stringify({ state: { orders: 42 }, version: 0 })],
    ["a missing state wrapper", JSON.stringify({ orders: [] })],
  ])("reads a %s as empty demo data instead of crashing the dashboard", async (_name, payload) => {
    storage.setItem(ORDERS_STORAGE_KEY, payload);
    const overview = await service.getOverview();
    expect(overview.totalOrders).toBe(0);
    expect(overview.recentOrders).toEqual([]);
  });

  it("surfaces a throwing storage as a rejection — the dashboard's error state", async () => {
    const hostile = { getItem: () => {
      throw new Error("blocked");
    } };
    const blocked = createLocalAdminService({ storage: hostile, readProducts: () => products });
    await expect(blocked.getOverview()).rejects.toThrow("blocked");
  });

  it("rejects with an explicit null storage (no SSR window) so the screen can show its error state", async () => {
    const ssr = createLocalAdminService({ storage: null, readProducts: () => products });
    await expect(ssr.getOverview()).rejects.toThrow(/browser/);
  });
});
