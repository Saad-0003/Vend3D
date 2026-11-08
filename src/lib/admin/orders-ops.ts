import { type OrderRecord } from "@/lib/checkout/order";

/**
 * `/admin/orders` selectors (U6). Pure like the customer's
 * `lib/orders/history.ts`, and reusing its load-more contract verbatim —
 * "Load more" is one behaviour for both seams, not two implementations.
 *
 * The admin search matches the order id or the *customer email*; the customer
 * history only ever matches their own id, which is why this file exists
 * instead of widening U1's selector. Statuses come from the canonical
 * `DEMO_ORDER_STATUSES` list, so an empty browser still offers the full filter.
 */

export type AdminOrderSort = "newest" | "oldest";

export type AdminOrderFilters = {
  query: string;
  status: string;
  sort: AdminOrderSort;
};

export function selectAdminOrders(
  orders: readonly OrderRecord[],
  { query, status, sort }: AdminOrderFilters,
): OrderRecord[] {
  const needle = query.trim().replace(/^#/, "").toLowerCase();
  const wanted = status.trim().toLowerCase();

  return [...orders]
    .filter((order) => {
      if (wanted !== "all" && order.status.toLowerCase() !== wanted) return false;
      if (!needle) return true;
      return (
        order.id.toLowerCase().includes(needle) ||
        order.address.email.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) =>
      sort === "oldest"
        ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
        : Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
}
