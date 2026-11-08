import { beforeEach, describe, expect, it } from "vitest";

import { sortOrdersNewest } from "@/lib/checkout/order";
import { selectAdminOrders } from "@/lib/admin/orders-ops";
import {
  ORDERS_STORAGE_KEY,
  createLocalAdminOrdersService,
  type AdminOrdersStorage,
} from "@/lib/admin/orders-service";
import type { OrderRecord } from "@/lib/checkout/order";

/**
 * The U6 seams (plan.md Phase 1B): the demo status vocabulary with its
 * transition limits, the pure list selectors, and the localStorage service
 * over the `vend3d-orders` envelope the checkout store owns. What's pinned is
 * what Phase 10's server admin actions must reproduce: forward-only
 * fulfilment, cancel-before-ship only, timestamped history, terminal states
 * that stay terminal, and D-094's lenience (corrupt → empty, blocked → error).
 */

function memoryStorage(): AdminOrdersStorage & {
  blockWrites: () => void;
  seed: (value: unknown) => void;
  safeSeed: (value: string) => void;
} {
  const map = new Map<string, string>();
  const throwOnWrite = { value: false };
  return {
    getItem: (name) => {
      if (throwOnWrite.value) throw new Error("SecurityError: the store is blocked");
      return map.get(name) ?? null;
    },
    setItem: (name, value) => {
      if (throwOnWrite.value) throw new Error("QuotaExceededError: the store is full");
      map.set(name, value);
    },
    blockWrites: () => (throwOnWrite.value = true),
    seed: (value) => map.set(ORDERS_STORAGE_KEY, JSON.stringify(value)),
    safeSeed: (value) => map.set(ORDERS_STORAGE_KEY, value),
  };
}

type Storage = ReturnType<typeof memoryStorage>;

/** `order()` mirrors what `buildOrderRecord` writes at checkout. */
function order(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "ord-u6-test-1",
    checkoutKey: "ck-u6-test-1",
    status: "Placed",
    createdAt: "2026-11-01T10:00:00.000Z",
    items: [
      {
        id: "line-1",
        slug: "vintage-tee",
        name: "Vintage Tee",
        configuration: {
          version: 1,
          slug: "vintage-tee",
          parts: { body: { color: "#c6f135", finish: 20 } },
          extras: {},
          engrave: { enabled: false, text: "", font: "", color: "#f2f0eb", depthMm: 0.12, sizePct: 70 },
          decal: null,
        },
        qty: 1,
        unitCents: 2999,
      },
    ],
    itemCount: 1,
    subtotalCents: 2999,
    shippingCents: 0,
    shippingMethodId: "standard",
    totalCents: 2999,
    address: {
      email: "ayesha@example.com",
      fullName: "Ayesha Khan",
      phone: "+92 300 1234567",
      address: "House 12, Street 4",
      city: "Lahore",
      province: "Punjab",
      postalCode: "54000",
    },
    cardBrand: "VISA",
    cardLast4: "4242",
    statusHistory: [{ status: "Placed", at: "2026-11-01T10:00:00.000Z" }],
    ...overrides,
  };
}

function service(storage: Storage) {
  return createLocalAdminOrdersService({
    storage,
    now: () => "2026-11-09T09:30:00.000Z",
  });
}

beforeEach(() => {
  localStorage.clear();
});

/* ------------------------------------------------------------- vocabulary */

describe("selectAdminOrders", () => {
  const orders = [
    order({ id: "ord-a", createdAt: "2026-11-05T10:00:00.000Z", status: "Placed" }),
    order({
      id: "ord-b",
      createdAt: "2026-11-03T10:00:00.000Z",
      status: "Shipped",
      address: { ...order().address, email: "bilal@example.com" },
    }),
  ];

  it("searches by order id fragment", () => {
    expect(selectAdminOrders(orders, { query: "a", status: "all", sort: "newest" }).map((o) => o.id)).toEqual([
      "ord-a",
      "ord-b",
    ]);
  });

  it("searches by email, case-insensitively", () => {
    expect(
      selectAdminOrders(orders, { query: "BILAL@", status: "all", sort: "newest" }).map((o) => o.id),
    ).toEqual(["ord-b"]);
  });

  it("filters by status exactly", () => {
    expect(selectAdminOrders(orders, { query: "", status: "shipped", sort: "newest" })).toHaveLength(1);
  });

  it("sorts oldest first on demand", () => {
    expect(selectAdminOrders(orders, { query: "", status: "all", sort: "oldest" }).map((o) => o.id)).toEqual([
      "ord-b",
      "ord-a",
    ]);
  });
});

/* -------------------------------------------------------- history envelope */

describe("history envelope", () => {
  it("appends a timestamped history entry and flips the status", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [order()] }, version: 0 });
    const sut = service(storage);

    const result = await sut.setOrderStatus("ord-u6-test-1", "Processing");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.order.status).toBe("Processing");
    expect(result.order.statusHistory).toEqual([
      { status: "Placed", at: "2026-11-01T10:00:00.000Z" },
      { status: "Processing", at: "2026-11-09T09:30:00.000Z" },
    ]);
  });

  it("keeps the rest of the envelope intact and writes back vend3d-orders", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [order(), order({ id: "ord-two" })] }, version: 0 });
    const sut = service(storage);

    await sut.setOrderStatus("ord-u6-test-1", "Processing");
    const raw = JSON.parse(storage.getItem(ORDERS_STORAGE_KEY) ?? "{}") as {
      state: { orders: { id: string; status: string; statusHistory: unknown[] }[] };
      version: number;
    };
    expect(raw.version).toBe(0);
    expect(raw.state.orders).toHaveLength(2);
    expect(raw.state.orders.find((o) => o.id === "ord-two")?.status).toBe("Placed");
    expect(raw.state.orders.find((o) => o.id === "ord-u6-test-1")?.status).toBe("Processing");
    expect(raw.state.orders.find((o) => o.id === "ord-u6-test-1")?.statusHistory).toHaveLength(2);
  });
});

/* ----------------------------------------------------- status transitions */

describe("status transitions", () => {
  it("walks the forward path Placed → Processing → Shipped → Delivered", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [order()] }, version: 0 });
    const sut = service(storage);

    expect((await sut.setOrderStatus("ord-u6-test-1", "Processing")).ok).toBe(true);
    expect((await sut.setOrderStatus("ord-u6-test-1", "Shipped")).ok).toBe(true);
    expect((await sut.setOrderStatus("ord-u6-test-1", "Delivered")).ok).toBe(true);

    const final = await sut.getOrder("ord-u6-test-1");
    expect(final?.status).toBe("Delivered");
    expect(final?.statusHistory).toHaveLength(4);
  });

  it("rejects transitions outside the map and leaves the record untouched", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [order()] }, version: 0 });
    const sut = service(storage);

    const result = await sut.setOrderStatus("ord-u6-test-1", "Delivered");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Placed");
    expect((await sut.getOrder("ord-u6-test-1"))?.status).toBe("Placed");
  });

  it("allows cancelling only before the order ships", async () => {
    const storage = memoryStorage();
    const staged = { state: { orders: [order({ status: "Processing" })] }, version: 0 };
    storage.seed(staged);
    const sut = service(storage);

    expect((await sut.setOrderStatus("ord-u6-test-1", "Cancelled")).ok).toBe(true);
  });

  it("makes the cancelled order final", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [order({ status: "Cancelled" })] }, version: 0 });
    const sut = service(storage);

    const result = await sut.setOrderStatus("ord-u6-test-1", "Processing");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/final/i);
  });

  it("rejects cancel after shipment (Shipped → Delivered only)", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [order({ status: "Shipped" })] }, version: 0 });
    const sut = service(storage);

    const result = await sut.setOrderStatus("ord-u6-test-1", "Cancelled");
    expect(result.ok).toBe(false);
  });

  it("fails with a friendly message for an unknown order id", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [] }, version: 0 });
    const sut = service(storage);

    const result = await sut.setOrderStatus("ord-missing", "Processing");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("not in this browser");
  });

  it("rejects a status value outside the vocabulary", async () => {
    const storage = memoryStorage();
    const sut = service(storage);
    // @ts-expect-error — probing the runtime guard past the type system
    const result = await sut.setOrderStatus("ord-u6-test-1", "Refunded");
    expect(result.ok).toBe(false);
  });
});

/* ------------------------------------------------------------------ notes */

describe("notes", () => {
  it("appends admin-only notes, newest first on read", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [order()] }, version: 0 });
    const sut = service(storage);

    const first = await sut.addOrderNote("ord-u6-test-1", "Proof approved by the customer.");
    expect(first.ok).toBe(true);

    const found = await sut.getOrder("ord-u6-test-1");
    expect(found?.notes).toEqual([
      {
        id: expect.any(String),
        body: "Proof approved by the customer.",
        at: "2026-11-09T09:30:00.000Z",
      },
    ]);
  });

  it("rejects blank notes and implies the limit message", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [order()] }, version: 0 });
    const sut = service(storage);

    const blank = await sut.addOrderNote("ord-u6-test-1", "   ");
    expect(blank.ok).toBe(false);
    if (blank.ok) return;
    expect(blank.error).toContain("Write a note");
  });

  it("rejects notes over 500 characters", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [order()] }, version: 0 });
    const sut = service(storage);

    const long = await sut.addOrderNote("ord-u6-test-1", "x".repeat(501));
    expect(long.ok).toBe(false);
  });
});

/* --------------------------------------------------------------- lenience */

describe("storage lenience (D-094 rules)", () => {
  it("reads a corrupt payload as zero orders instead of throwing", async () => {
    const storage = memoryStorage();
    storage.safeSeed("{not json");
    const sut = service(storage);

    expect(await sut.listOrders()).toEqual([]);
    expect(await sut.getOrder("ord-u6-test-1")).toBeNull();
  });

  it("reads a legacy record (no statusHistory) with placement reconstructed", async () => {
    const storage = memoryStorage();
    const legacy = order();
    delete (legacy as Partial<OrderRecord>).statusHistory;
    storage.seed({ state: { orders: [legacy] }, version: 0 });
    const sut = service(storage);

    const found = await sut.getOrder("ord-u6-test-1");
    expect(found?.statusHistory).toEqual([
      { status: "Placed", at: "2026-11-01T10:00:00.000Z" },
    ]);
  });

  it("lists newest first", async () => {
    const storage = memoryStorage();
    storage.seed({
      state: {
        orders: [
          order({ id: "ord-old", createdAt: "2026-10-01T10:00:00.000Z" }),
          order({ id: "ord-new", createdAt: "2026-11-08T10:00:00.000Z" }),
        ],
      },
      version: 0,
    });
    const sut = service(storage);

    expect((await sut.listOrders()).map((o) => o.id)).toEqual([
      "ord-new",
      "ord-old",
    ]);
  });

  it("turns a blocked store into an explicit write error, never a silent loss", async () => {
    const storage = memoryStorage();
    storage.seed({ state: { orders: [order()] }, version: 0 });
    const sut = service(storage);

    storage.blockWrites();
    const result = await sut.setOrderStatus("ord-u6-test-1", "Processing");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Saving failed");
  });

  it("reads nothing when the envelope's state.orders is missing", async () => {
    const storage = memoryStorage();
    storage.seed({ state: {}, version: 0 });
    const sut = service(storage);
    expect(await sut.listOrders()).toEqual([]);
  });
});

/* ------------------------------------------------------- pure sort helpers */

describe("sortOrdersNewest stays the shared ordering", () => {
  it("orders by createdAt descending", () => {
    const sorted = sortOrdersNewest([
      order({ id: "old", createdAt: "2026-01-01T00:00:00.000Z" }),
      order({ id: "new", createdAt: "2026-06-01T00:00:00.000Z" }),
    ]);
    expect(sorted.map((o) => o.id)).toEqual(["new", "old"]);
  });
});

