import type { CardBrand } from "@/lib/payment/card";
import { shippingPriceCents, type ShippingMethodId } from "@/lib/checkout/shipping";
import type { Configuration } from "@/lib/products/configuration";
import { selectSubtotalCents, type CartLine } from "@/stores/cart-store";

/**
 * Order records (plan.md Phase 9 / ARCHITECTURE.md §5). Everything an order
 * needs is snapshotted at checkout — unit price, design config, address — so
 * history survives product edits and cart changes. Money is integer cents.
 *
 * `status` starts as "Placed" (Phase 9's demo word for PAID; D-048) and can
 * then be advanced from the admin screens (U6). `DEMO_ORDER_STATUSES` is the
 * one vocabulary list; its mapping to the planned database enum is in
 * DECISIONS.md D-096. Status history and internal notes ship on the record
 * itself so the admin service and the customer-facing timeline read the same
 * seam (`vend3d-orders`).
 */

export const ORDER_STATUS = "Placed" as const;

export const DEMO_ORDER_STATUSES = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
export type OrderStatus = (typeof DEMO_ORDER_STATUSES)[number];

/** Forward-only demo transitions; a cancel is allowed until the order ships. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Placed: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

/** The statuses an admin may offer for `status`. Terminal states stay final. */
export function nextOrderStatuses(status: string): OrderStatus[] {
  return ORDER_TRANSITIONS[status as OrderStatus] ?? [];
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (DEMO_ORDER_STATUSES as readonly string[]).includes(value);
}

/** One timestamped status change, seeded at placement. */
export type OrderStatusEvent = { status: OrderStatus; at: string };

/** Back-office-only annotation; never surfaces on the customer screen. */
export type OrderNote = { id: string; body: string; at: string };

export type OrderItem = {
  id: string;
  slug: string;
  name: string;
  configuration: Configuration;
  /**
   * `data:` URL snapshot, or empty when capture was unavailable. Optional
   * because a rehydrated order drops it: a full-canvas PNG is megabytes and
   * persisting it exhausts the localStorage quota.
   */
  thumbnail?: string;
  qty: number;
  unitCents: number;
};

export type OrderAddress = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

export type OrderRecord = {
  id: string;
  checkoutKey: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  /** Total units, for the badge on `/order/[id]`. */
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  shippingMethodId: ShippingMethodId;
  totalCents: number;
  address: OrderAddress;
  /** Display only — no card data is ever stored (ARCHITECTURE.md §3.3). */
  cardBrand: CardBrand;
  cardLast4: string;
  /** Placement plus every admin advance, oldest first (U6). */
  statusHistory: OrderStatusEvent[];
  /** Admin-only free-form notes (U6); optional for pre-U6 records. */
  notes?: OrderNote[];
};

/** Line items are copied as-is; the cart's snapshot is already the order's snapshot. */
export function toOrderItems(lines: CartLine[]): OrderItem[] {
  return lines.map((line) => ({
    id: line.id,
    slug: line.slug,
    name: line.name,
    configuration: line.configuration,
    thumbnail: line.thumbnail,
    qty: line.qty,
    unitCents: line.unitCents,
  }));
}

/** Totals recomputed from the lines, never from anything the client sent for display. */
export function orderTotals(lines: CartLine[], shippingMethodId: string | undefined) {
  const subtotalCents = selectSubtotalCents(lines);
  const shippingCents = shippingPriceCents(shippingMethodId);
  return {
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    itemCount: lines.reduce((sum, l) => sum + l.qty, 0),
  };
}

/**
 * Pure order construction. `id` and `now` are injectable so the tests are
 * deterministic and the store is the only place that generates them.
 */
export function buildOrderRecord(input: {
  id: string;
  checkoutKey: string;
  createdAt?: string;
  lines: CartLine[];
  address: OrderAddress;
  shippingMethodId: ShippingMethodId;
  cardBrand: CardBrand;
  cardLast4: string;
}): OrderRecord {
  const totals = orderTotals(input.lines, input.shippingMethodId);
  const createdAt = input.createdAt ?? new Date().toISOString();
  return {
    id: input.id,
    checkoutKey: input.checkoutKey,
    status: ORDER_STATUS,
    createdAt,
    items: toOrderItems(input.lines),
    itemCount: totals.itemCount,
    subtotalCents: totals.subtotalCents,
    shippingCents: totals.shippingCents,
    shippingMethodId: input.shippingMethodId,
    totalCents: totals.totalCents,
    address: input.address,
    cardBrand: input.cardBrand,
    cardLast4: input.cardLast4,
    // Placement is an event too, so the timeline always has at least one step.
    statusHistory: [{ status: ORDER_STATUS, at: createdAt }],
  };
}

/** Newest first, for `/order/[id]` neighbours and any future history list. */
export function sortOrdersNewest(orders: OrderRecord[]): OrderRecord[] {
  return [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Records placed before U6 carry no history: placement is reconstructed. */
export function normalizeOrder(order: OrderRecord): OrderRecord {
  return {
    ...order,
    statusHistory:
      order.statusHistory && order.statusHistory.length > 0
        ? order.statusHistory
        : [{ status: order.status, at: order.createdAt }],
  };
}

/** "12 Oct 2026" — the date column of the account order rows. */
export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
