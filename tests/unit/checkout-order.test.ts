import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildOrderRecord, orderTotals, sortOrdersNewest } from "@/lib/checkout/order";
import { getShippingMethod, SHIPPING_METHODS, shippingPriceCents } from "@/lib/checkout/shipping";
import { defaultConfiguration } from "@/lib/products/configuration";
import { getProductConfig } from "@/lib/products/config";
import type { CartLine } from "@/stores/cart-store";
import { useOrdersStore } from "@/stores/orders-store";

/**
 * Order records and the store that holds them (plan.md Phase 9). The store is a
 * client mirror today, but the idempotency contract is the one the server action
 * inherits, so it is tested here rather than tested later.
 */

const configuration = defaultConfiguration(getProductConfig("heavyweight-boxy-tee")!);

/** A realistic snapshot: the studio stores `canvas.toDataURL("image/png")`. */
const SNAPSHOT = `data:image/png;base64,${"iVBORw0KGgo=".repeat(200_000)}`;

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    id: "line-1",
    slug: "heavyweight-boxy-tee",
    name: "Heavyweight Boxy Tee",
    configuration,
    thumbnail: "",
    qty: 2,
    unitCents: 4800,
    ...overrides,
  };
}

const orderInput = {
  checkoutKey: "checkout-key-1",
  lines: [line()],
  address: {
    fullName: "Ayesha Khan",
    email: "ayesha@example.com",
    phone: "+92 300 1234567",
    address: "House 12, Street 4, Gulberg",
    city: "Lahore",
    province: "Punjab",
    postalCode: "54000",
  },
  shippingMethodId: "standard" as const,
  cardBrand: "VISA" as const,
  cardLast4: "4242",
};

describe("shipping", () => {
  it("ships the two documented methods", () => {
    expect(SHIPPING_METHODS.map((m) => m.id)).toEqual(["standard", "express"]);
  });

  it("prices methods in integer cents", () => {
    expect(shippingPriceCents("standard")).toBe(0);
    expect(shippingPriceCents("express")).toBe(900);
    expect(shippingPriceCents("nonsense")).toBe(0);
    expect(getShippingMethod("express")?.eta).toBe("2–3 business days");
  });
});

describe("orderTotals", () => {
  it("adds shipping to the subtotal in cents", () => {
    expect(orderTotals([line()], "express")).toEqual({
      subtotalCents: 9600,
      shippingCents: 900,
      totalCents: 10500,
      itemCount: 2,
    });
  });

  it("handles an empty cart and free shipping", () => {
    expect(orderTotals([], "standard")).toEqual({
      subtotalCents: 0,
      shippingCents: 0,
      totalCents: 0,
      itemCount: 0,
    });
  });

  it("sums quantities across lines", () => {
    const lines = [line(), line({ id: "line-2", qty: 1 })];
    expect(orderTotals(lines, "standard").itemCount).toBe(3);
  });
});

describe("buildOrderRecord", () => {
  it("snapshots everything the order needs and marks it Placed", () => {
    const record = buildOrderRecord({ ...orderInput, id: "ord-1", createdAt: "2026-03-01T10:00:00.000Z" });

    expect(record.id).toBe("ord-1");
    expect(record.status).toBe("Placed");
    expect(record.createdAt).toBe("2026-03-01T10:00:00.000Z");
    expect(record.itemCount).toBe(2);
    expect(record.subtotalCents).toBe(9600);
    expect(record.shippingCents).toBe(0);
    expect(record.totalCents).toBe(9600);
    expect(record.cardBrand).toBe("VISA");
    expect(record.cardLast4).toBe("4242");
    expect(record.address.city).toBe("Lahore");
    expect(record.items).toHaveLength(1);
    expect(record.items[0]).toMatchObject({ slug: "heavyweight-boxy-tee", qty: 2, unitCents: 4800 });
    // Only brand and last4 ever reach the record.
    expect(Object.keys(record)).not.toContain("cardNumber");
    expect(Object.keys(record)).not.toContain("cvc");
    expect(Object.keys(record)).not.toContain("expiry");
  });

  it("recomputes the shipping price from the method", () => {
    const record = buildOrderRecord({ ...orderInput, id: "ord-2", shippingMethodId: "express" });
    expect(record.shippingCents).toBe(900);
    expect(record.totalCents).toBe(10500);
  });
});

describe("sortOrdersNewest", () => {
  it("puts the newest order first without mutating the input", () => {
    const older = buildOrderRecord({ ...orderInput, id: "a", createdAt: "2026-01-01T00:00:00.000Z", checkoutKey: "k-a" });
    const newer = buildOrderRecord({ ...orderInput, id: "b", createdAt: "2026-02-01T00:00:00.000Z", checkoutKey: "k-b" });
    const input = [older, newer];
    expect(sortOrdersNewest(input).map((o) => o.id)).toEqual(["b", "a"]);
    expect(input.map((o) => o.id)).toEqual(["a", "b"]);
  });
});

describe("orders store", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [], hydrated: true });
  });

  it("stores a placed order", () => {
    const record = useOrdersStore.getState().placeOrder({ ...orderInput, id: "ord-1" });
    expect(record.status).toBe("Placed");
    expect(useOrdersStore.getState().orders).toHaveLength(1);
    expect(useOrdersStore.getState().findOrder("ord-1")).toBe(record);
  });

  // --- localStorage quota hardening (review finding: CRITICAL) ---

  it("does not persist full-size thumbnails", () => {
    useOrdersStore
      .getState()
      .placeOrder({ ...orderInput, id: "ord-1", lines: [line({ thumbnail: SNAPSHOT })] });

    const stored = localStorage.getItem("vend3d-orders");
    expect(stored).toBeTruthy();
    // `JSON.stringify` drops undefined, so no data URL is written.
    expect(stored).not.toContain("data:image/png");
    // The in-memory snapshot keeps it for the confirmation screen.
    expect(useOrdersStore.getState().orders[0]?.items[0]?.thumbnail).toBe(SNAPSHOT);
  });

  it("still places an order when the storage write throws", () => {
    // beforeEach has just written a valid (empty) payload.
    const before = localStorage.getItem("vend3d-orders");
    expect(before).toBeTruthy();

    // Spy on the prototype: jsdom exposes localStorage through a Proxy, so a
    // spy on the instance itself is silently ignored.
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });

    try {
      const record = useOrdersStore
        .getState()
        .placeOrder({ ...orderInput, id: "ord-9", lines: [line({ thumbnail: SNAPSHOT })] });

      // The order exists in memory; only cross-reload durability is lost.
      expect(record.id).toBe("ord-9");
      expect(useOrdersStore.getState().orders).toHaveLength(1);
      // The failed write left the previous payload untouched rather than
      // aborting the order.
      expect(localStorage.getItem("vend3d-orders")).toBe(before);
    } finally {
      setItem.mockRestore();
    }
  });

  it("is idempotent per checkoutKey", () => {
    const first = useOrdersStore.getState().placeOrder({ ...orderInput, id: "ord-1" });
    const second = useOrdersStore.getState().placeOrder({ ...orderInput, id: "ord-1" });

    expect(first).toBe(second);
    expect(useOrdersStore.getState().orders).toHaveLength(1);

    // A fresh key is a fresh attempt, not a duplicate.
    const third = useOrdersStore
      .getState()
      .placeOrder({ ...orderInput, id: "ord-2", checkoutKey: "checkout-key-2" });
    expect(third.id).toBe("ord-2");
    expect(useOrdersStore.getState().orders).toHaveLength(2);
  });

  it("returns undefined for an unknown order", () => {
    expect(useOrdersStore.getState().findOrder("nope")).toBeUndefined();
  });
});
