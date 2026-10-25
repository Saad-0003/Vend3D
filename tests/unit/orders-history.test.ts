import { describe, expect, it } from "vitest";

import { buildOrderRecord, type OrderRecord } from "@/lib/checkout/order";
import { defaultConfiguration } from "@/lib/products/configuration";
import { getProductConfig } from "@/lib/products/config";
import {
  ALL_ORDERS,
  ORDER_PAGE_SIZE,
  countOrdersByStatus,
  hasMoreOrders,
  nextOrderLimit,
  orderStatuses,
  orderThumbnailSummary,
  selectOrders,
  shortOrderId,
  visibleOrders,
} from "@/lib/orders/history";
import type { CartLine } from "@/stores/cart-store";

/**
 * `/orders` selectors: status filtering, id search, newest-first ordering and
 * the 10-at-a-time load-more contract. Pure, so no DOM is needed.
 */

const configuration = defaultConfiguration(getProductConfig("heavyweight-boxy-tee")!);

function makeOrder({
  id,
  createdAt,
  status = "Placed",
  items = 1,
}: {
  id: string;
  createdAt: string;
  status?: OrderRecord["status"];
  items?: number;
}): OrderRecord {
  const lines: CartLine[] = Array.from({ length: items }, (_, index) => ({
    id: `${id}-line-${index}`,
    slug: "heavyweight-boxy-tee",
    name: "Heavyweight Boxy Tee",
    configuration,
    thumbnail: "",
    qty: 1,
    unitCents: 4800,
  }));

  return {
    ...buildOrderRecord({
      id,
      checkoutKey: `key-${id}`,
      createdAt,
      lines,
      address: {
        fullName: "Ayesha Khan",
        email: "ayesha@example.com",
        phone: "+92 300 1234567",
        address: "House 12, Street 4, Gulberg",
        city: "Lahore",
        province: "Punjab",
        postalCode: "54000",
      },
      shippingMethodId: "standard",
      cardBrand: "VISA",
      cardLast4: "4242",
    }),
    status,
  };
}

const placedNewest = makeOrder({ id: "ord-mabc123def", createdAt: "2026-03-02T10:00:00.000Z" });
const shippedMiddle = makeOrder({
  id: "ord-nyz987654",
  createdAt: "2026-03-01T10:00:00.000Z",
  status: "Shipped" as OrderRecord["status"],
});
const placedOldest = makeOrder({ id: "ord-qrs456xyz", createdAt: "2026-02-01T10:00:00.000Z" });

const orders = [placedOldest, shippedMiddle, placedNewest];

describe("shortOrderId", () => {
  it("keeps the tail of the id, without the ordinal prefix", () => {
    expect(shortOrderId("ord-mabc123def")).toBe("123DEF");
    expect(shortOrderId("abc")).toBe("ABC");
  });
});

describe("orderStatuses", () => {
  it("returns each status once, newest order first", () => {
    expect(orderStatuses(orders)).toEqual(["Placed", "Shipped"]);
  });

  it("returns no statuses for an empty history", () => {
    expect(orderStatuses([])).toEqual([]);
  });
});

describe("countOrdersByStatus", () => {
  it("counts each status present", () => {
    expect(countOrdersByStatus(orders)).toEqual({ Placed: 2, Shipped: 1 });
  });
});

describe("selectOrders", () => {
  it("sorts newest first regardless of the store order", () => {
    expect(selectOrders(orders).map((order) => order.id)).toEqual([
      placedNewest.id,
      shippedMiddle.id,
      placedOldest.id,
    ]);
  });

  it("filters by status", () => {
    expect(selectOrders(orders, { status: "Shipped" }).map((order) => order.id)).toEqual([
      shippedMiddle.id,
    ]);
    expect(selectOrders(orders, { status: ALL_ORDERS })).toHaveLength(3);
  });

  it("searches by full order id, case-insensitively", () => {
    expect(selectOrders(orders, { query: "MABC123DEF" }).map((order) => order.id)).toEqual([
      placedNewest.id,
    ]);
  });

  it("searches by the short id shown on the card, with or without a leading #", () => {
    expect(selectOrders(orders, { query: "123def" }).map((order) => order.id)).toEqual([
      placedNewest.id,
    ]);
    expect(selectOrders(orders, { query: "#123DEF" }).map((order) => order.id)).toEqual([
      placedNewest.id,
    ]);
  });

  it("returns nothing for a search that matches no id", () => {
    expect(selectOrders(orders, { query: "ord-nope" })).toEqual([]);
  });

  it("combines a status filter and a search", () => {
    expect(selectOrders(orders, { status: "Placed", query: "qrs" }).map((order) => order.id)).toEqual([
      placedOldest.id,
    ]);
    expect(selectOrders(orders, { status: "Shipped", query: "qrs" })).toEqual([]);
  });
});

describe("load more", () => {
  const many = Array.from({ length: 12 }, (_, index) =>
    makeOrder({
      id: `ord-load-${String(index).padStart(2, "0")}`,
      // Older as the index rises, so the first page is deterministic.
      createdAt: `2026-01-${String(20 - index).padStart(2, "0")}T10:00:00.000Z`,
    }),
  );

  it("reveals ten at a time and reports whether more remain", () => {
    expect(ORDER_PAGE_SIZE).toBe(10);
    expect(visibleOrders(many, ORDER_PAGE_SIZE)).toHaveLength(10);
    expect(hasMoreOrders(many, ORDER_PAGE_SIZE)).toBe(true);

    const next = nextOrderLimit(ORDER_PAGE_SIZE);
    expect(next).toBe(20);
    expect(visibleOrders(many, next)).toHaveLength(12);
    expect(hasMoreOrders(many, next)).toBe(false);
  });

  it("never returns a negative slice for a nonsense limit", () => {
    expect(visibleOrders(many, -5)).toEqual([]);
    expect(hasMoreOrders(many, -5)).toBe(true);
  });
});

describe("orderThumbnailSummary", () => {
  it("caps at three items and counts the rest", () => {
    const order = makeOrder({
      id: "ord-thumbs",
      createdAt: "2026-03-01T10:00:00.000Z",
      items: 5,
    });
    const summary = orderThumbnailSummary(order);
    expect(summary.items).toHaveLength(3);
    expect(summary.extra).toBe(2);
  });

  it("reports no extra when the order fits", () => {
    const summary = orderThumbnailSummary(
      makeOrder({ id: "ord-two", createdAt: "2026-03-01T10:00:00.000Z", items: 2 }),
    );
    expect(summary.items).toHaveLength(2);
    expect(summary.extra).toBe(0);
  });
});
