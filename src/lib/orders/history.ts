import { sortOrdersNewest, type OrderRecord } from "@/lib/checkout/order";

/**
 * `/orders` selectors (Phase 1B U1). Pure so the search, status chips and
 * load-more contract can be unit-tested without a DOM, and so Phase 9 can swap
 * the store for a paginated query without touching the screen's logic.
 *
 * The store holds browser-local records; `sortOrdersNewest` already defines the
 * "newest first" rule used by `/order/[id]`, so history reuses it rather than
 * inventing a second ordering.
 */

/** One page of history. "Load more" reveals the next 10. */
export const ORDER_PAGE_SIZE = 10;

export const ALL_ORDERS = "all";

export type OrderFilters = {
  /** A status value, or `ALL_ORDERS`. */
  status?: string;
  /** Matches the full order id or its short display form. */
  query?: string;
};

/** The statuses actually present in the data, newest order first. */
export function orderStatuses(orders: readonly OrderRecord[]): string[] {
  const seen = new Set<string>();
  for (const order of sortOrdersNewest([...orders])) seen.add(order.status);
  return [...seen];
}

/** One count per status, for the chip badges. */
export function countOrdersByStatus(orders: readonly OrderRecord[]): Record<string, number> {
  return orders.reduce<Record<string, number>>((counts, order) => {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
    return counts;
  }, {});
}

/**
 * The short form on a history card: the tail of the id, uppercased. The full id
 * stays in the card's accessible name and `title`, so nothing becomes
 * unsearchable or ambiguous.
 */
export function shortOrderId(id: string): string {
  const bare = id.replace(/^ord-/, "");
  const tail = bare.slice(-6) || id;
  return tail.toUpperCase();
}

/** Newest first, then filtered by status and an id search. */
export function selectOrders(
  orders: readonly OrderRecord[],
  { status = ALL_ORDERS, query = "" }: OrderFilters = {},
): OrderRecord[] {
  const needle = query.trim().replace(/^#/, "").toLowerCase();
  const wanted = status.trim().toLowerCase();

  return sortOrdersNewest([...orders]).filter((order) => {
    if (wanted && wanted !== ALL_ORDERS && order.status.toLowerCase() !== wanted) return false;
    if (!needle) return true;
    return (
      order.id.toLowerCase().includes(needle) ||
      shortOrderId(order.id).toLowerCase().includes(needle)
    );
  });
}

/** The slice the screen shows for the current "Load more" limit. */
export function visibleOrders(orders: readonly OrderRecord[], limit: number): OrderRecord[] {
  return orders.slice(0, Math.max(0, limit));
}

export function hasMoreOrders(orders: readonly OrderRecord[], limit: number): boolean {
  return orders.length > Math.max(0, limit);
}

export function nextOrderLimit(limit: number): number {
  return Math.max(0, limit) + ORDER_PAGE_SIZE;
}

/** Up to `max` item snapshots, plus how many were held back for the "+N" tile. */
export function orderThumbnailSummary(
  order: OrderRecord,
  max = 3,
): { items: OrderRecord["items"]; extra: number } {
  const cap = Math.max(0, max);
  return {
    items: order.items.slice(0, cap),
    extra: Math.max(0, order.items.length - cap),
  };
}
