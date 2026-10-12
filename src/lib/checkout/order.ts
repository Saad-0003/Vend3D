import type { CardBrand } from "@/lib/payment/card";
import { shippingPriceCents, type ShippingMethodId } from "@/lib/checkout/shipping";
import type { Configuration } from "@/lib/products/configuration";
import { selectSubtotalCents, type CartLine } from "@/stores/cart-store";

/**
 * Order records (plan.md Phase 9 / ARCHITECTURE.md §5). Everything an order
 * needs is snapshotted at checkout — unit price, design config, address — so
 * history survives product edits and cart changes. Money is integer cents.
 *
 * `status` is "Placed": the prompt's word for a demo order. Phase 9 maps it to
 * the plan's `PAID` enum when `placeOrder` becomes the server writer (D-048).
 */

export const ORDER_STATUS = "Placed" as const;
export type OrderStatus = typeof ORDER_STATUS;

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
  return {
    id: input.id,
    checkoutKey: input.checkoutKey,
    status: ORDER_STATUS,
    createdAt: input.createdAt ?? new Date().toISOString(),
    items: toOrderItems(input.lines),
    itemCount: totals.itemCount,
    subtotalCents: totals.subtotalCents,
    shippingCents: totals.shippingCents,
    shippingMethodId: input.shippingMethodId,
    totalCents: totals.totalCents,
    address: input.address,
    cardBrand: input.cardBrand,
    cardLast4: input.cardLast4,
  };
}

/** Newest first, for `/order/[id]` neighbours and any future history list. */
export function sortOrdersNewest(orders: OrderRecord[]): OrderRecord[] {
  return [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** "12 Oct 2026" — the date column of the account order rows. */
export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
